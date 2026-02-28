import { HttpClient, HttpError } from "./http-client.js";
import { esc } from "./dataverse-client.utils.js";
const API_VERSION = "9.2";
/**
 * Maps entity set names with irregular pluralization to their primary key field names.
 * Used as a fallback when OData-EntityId and @odata.id are absent from the response.
 */
const ENTITY_SET_TO_PK = {
    opportunities: "opportunityid",
    territories: "territoryid",
    categories: "categoryid",
    activityparties: "activitypartyid",
    activitymimeattachments: "activitymimeattachmentid",
    queues: "queueid",
    queueitems: "queueitemid",
};
export class DataverseClient {
    http;
    authProvider;
    maxRetries;
    constructor(authProvider, maxRetries = 3, timeoutMs = 30_000) {
        this.authProvider = authProvider;
        this.maxRetries = maxRetries;
        this.http = new HttpClient({
            baseURL: `${authProvider.environmentUrl}/api/data/v${API_VERSION}/`,
            timeout: timeoutMs,
            headers: {
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                Accept: "application/json",
                "Content-Type": "application/json; charset=utf-8",
            },
            tokenProvider: () => authProvider.getToken(),
        });
    }
    async requestWithRetry(fn, attempt = 0) {
        try {
            return await fn();
        }
        catch (error) {
            if (error instanceof HttpError) {
                // On 401: invalidate cached token and retry once with a fresh token
                if (error.status === 401 && attempt === 0) {
                    this.authProvider.invalidateToken();
                    return this.requestWithRetry(fn, attempt + 1);
                }
                // On transient errors (429, 503): retry with Retry-After-aware backoff
                const isTransient = [429, 503, 504].includes(error.status);
                if (isTransient && attempt < this.maxRetries) {
                    const retryAfterSec = error.responseHeaders["retry-after"];
                    const delay = retryAfterSec
                        ? parseInt(retryAfterSec, 10) * 1000
                        : Math.pow(2, attempt) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    return this.requestWithRetry(fn, attempt + 1);
                }
            }
            throw this.formatError(error);
        }
    }
    formatError(error) {
        if (error instanceof HttpError) {
            const dvError = error.data?.error;
            if (dvError) {
                return new Error(`Dataverse error ${dvError.code ?? ""}: ${dvError.message ?? "Unknown error"}`);
            }
            if (error.code === "ECONNABORTED") {
                return new Error("Request timed out. Check your Dataverse environment URL.");
            }
            return error;
        }
        return error instanceof Error ? error : new Error(String(error));
    }
    // ─── Auth ────────────────────────────────────────────────────────────────
    async whoAmI() {
        return this.requestWithRetry(async () => {
            const whoAmIResp = await this.http.get("WhoAmI");
            const { UserId, BusinessUnitId, OrganizationId } = whoAmIResp.data;
            let OrganizationName = "";
            try {
                const orgResp = await this.http.get(`organizations(${OrganizationId})?$select=name`);
                OrganizationName = orgResp.data.name ?? "";
            }
            catch {
                OrganizationName = "";
            }
            const EnvironmentUrl = this.authProvider.environmentUrl;
            return {
                UserId,
                BusinessUnitId,
                OrganizationId,
                OrganizationName,
                EnvironmentUrl,
            };
        });
    }
    // ─── Metadata ────────────────────────────────────────────────────────────
    async listTables(includeCustomOnly = false) {
        const filter = includeCustomOnly ? "$filter=IsCustomEntity eq true" : "";
        const select = "$select=LogicalName,SchemaName,DisplayName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity";
        const query = [select, filter].filter(Boolean).join("&");
        return this.requestWithRetry(() => this.http
            .get(`EntityDefinitions?${query}`)
            .then((r) => r.data.value));
    }
    async getTableMetadata(logicalName, includeAttributes = true) {
        const expand = includeAttributes ? "$expand=Attributes" : "";
        const url = `EntityDefinitions(LogicalName='${esc(logicalName)}')${expand ? "?" + expand : ""}`;
        return this.requestWithRetry(() => this.http.get(url).then((r) => r.data));
    }
    async getRelationships(logicalName) {
        const escaped = esc(logicalName);
        const [oneToMany, manyToOne, manyToMany] = await Promise.all([
            this.requestWithRetry(() => this.http
                .get(`EntityDefinitions(LogicalName='${escaped}')/OneToManyRelationships`)
                .then((r) => r.data.value)),
            this.requestWithRetry(() => this.http
                .get(`EntityDefinitions(LogicalName='${escaped}')/ManyToOneRelationships`)
                .then((r) => r.data.value)),
            this.requestWithRetry(() => this.http
                .get(`EntityDefinitions(LogicalName='${escaped}')/ManyToManyRelationships`)
                .then((r) => r.data.value)),
        ]);
        return [...oneToMany, ...manyToOne, ...manyToMany];
    }
    // ─── Query ───────────────────────────────────────────────────────────────
    async query(entitySetName, options = {}) {
        const params = [];
        if (options.select?.length)
            params.push(`$select=${options.select.join(",")}`);
        if (options.filter)
            params.push(`$filter=${options.filter}`);
        if (options.orderby)
            params.push(`$orderby=${options.orderby}`);
        if (options.top)
            params.push(`$top=${options.top}`);
        if (options.expand)
            params.push(`$expand=${options.expand}`);
        if (options.count)
            params.push("$count=true");
        if (options.apply)
            params.push(`$apply=${options.apply}`);
        const url = `${entitySetName}${params.length ? "?" + params.join("&") : ""}`;
        return this.requestWithRetry(() => this.http.get(url).then((r) => r.data));
    }
    async executeFetchXml(entitySetName, fetchXml) {
        const encoded = encodeURIComponent(fetchXml);
        return this.requestWithRetry(() => this.http
            .get(`${entitySetName}?fetchXml=${encoded}`)
            .then((r) => r.data));
    }
    // ─── CRUD ────────────────────────────────────────────────────────────────
    async getRecord(entitySetName, id, select) {
        const params = select ? `?$select=${select.join(",")}` : "";
        return this.requestWithRetry(async () => {
            const response = await this.http.get(`${entitySetName}(${id})${params}`, {
                headers: { Prefer: 'odata.include-annotations="*"' },
            });
            const etag = response.headers["odata-etag"] ??
                response.data["@odata.etag"] ??
                null;
            return { record: response.data, etag };
        });
    }
    async createRecord(entitySetName, data) {
        return this.requestWithRetry(async () => {
            const response = await this.http.post(entitySetName, data, {
                headers: { Prefer: "return=representation" },
            });
            // 1. OData-EntityId header (standard, most reliable)
            const locationHeader = response.headers["odata-entityid"];
            const fromHeader = locationHeader?.match(/\(([^)]+)\)/)?.[1];
            if (fromHeader)
                return fromHeader;
            // 2. @odata.id in body (collection response shape)
            const body = response.data;
            const fromOdataId = body["@odata.id"]?.match(/\(([^)]+)\)/)?.[1];
            if (fromOdataId)
                return fromOdataId;
            // 3. Primary key field in body (when return=representation and no OData-EntityId header)
            //    Use known irregular pluralizations; fall back to simple s-strip convention.
            const pkGuess = ENTITY_SET_TO_PK[entitySetName] ??
                entitySetName.replace(/s$/, "") + "id";
            const fromPk = body[pkGuess];
            if (fromPk)
                return fromPk;
            // 4. Location header fallback
            const location = response.headers["location"];
            return location?.match(/\(([^)]+)\)/)?.[1] ?? "";
        });
    }
    async updateRecord(entitySetName, id, data, etag) {
        await this.requestWithRetry(() => this.http.patch(`${entitySetName}(${id})`, data, {
            headers: { "If-Match": etag ?? "*" },
        }));
    }
    async deleteRecord(entitySetName, id) {
        await this.requestWithRetry(() => this.http.delete(`${entitySetName}(${id})`));
    }
    async upsertRecord(entitySetName, alternateKey, alternateKeyValue, data, mode = "upsert", keySegment) {
        return this.requestWithRetry(async () => {
            const url = keySegment
                ? `${entitySetName}(${keySegment})`
                : `${entitySetName}(${esc(alternateKey)}='${esc(alternateKeyValue)}')`;
            const headers = {
                Prefer: "return=representation",
            };
            if (mode === "createOnly")
                headers["If-None-Match"] = "*";
            if (mode === "updateOnly")
                headers["If-Match"] = "*";
            try {
                const response = await this.http.put(url, data, { headers });
                const operation = response.status === 201 ? "created" : "updated";
                const locationHeader = response.headers["odata-entityid"];
                const fromHeader = locationHeader?.match(/\(([^)]+)\)/)?.[1];
                const body = response.data;
                const pkGuess = ENTITY_SET_TO_PK[entitySetName] ??
                    entitySetName.replace(/s$/, "") + "id";
                const id = fromHeader ?? body?.[pkGuess] ?? alternateKeyValue;
                return { operation, id };
            }
            catch (err) {
                if (err instanceof HttpError && err.status === 412) {
                    if (mode === "createOnly")
                        throw new Error("Record already exists");
                    if (mode === "updateOnly")
                        throw new Error("Record not found");
                }
                throw err;
            }
        });
    }
    // ─── Relations ───────────────────────────────────────────────────────────
    async associate(entitySetName, id, relationshipName, relatedEntitySetName, relatedId) {
        const relatedUrl = `${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${relatedEntitySetName}(${relatedId})`;
        await this.requestWithRetry(() => this.http.post(`${entitySetName}(${id})/${relationshipName}/$ref`, {
            "@odata.id": relatedUrl,
        }));
    }
    async disassociate(entitySetName, id, relationshipName, relatedId, relatedEntitySetName) {
        const suffix = relatedId
            ? `?$id=${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${relatedEntitySetName ?? entitySetName}(${relatedId})`
            : "";
        await this.requestWithRetry(() => this.http.delete(`${entitySetName}(${id})/${relationshipName}/$ref${suffix}`));
    }
}
//# sourceMappingURL=dataverse-client.js.map