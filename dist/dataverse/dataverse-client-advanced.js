import { DataverseBatchClient } from "./dataverse-client.batch.js";
import { esc } from "./dataverse-client.utils.js";
const COMPONENT_TYPE_MAP = {
    1: "Entity",
    2: "Attribute",
    3: "Relationship",
    9: "OptionSet",
    29: "Workflow",
    61: "SystemForm",
    71: "SiteMap",
    90: "PluginAssembly",
    92: "PluginType",
    97: "WebResource",
    95: "ServiceEndpoint",
    79: "ConnectionRole",
};
/** Escapes a string for safe embedding inside an XML element value. */
function xmlEscape(v) {
    return v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
/**
 * Extends DataverseMetadataClient with advanced query capabilities:
 * bound functions, server-side paging, and change tracking (delta queries).
 */
export class DataverseAdvancedClient extends DataverseBatchClient {
    // ─── Advanced Actions & Functions ────────────────────────────────────────
    async executeBoundFunction(entitySetName, recordId, functionName, params = {}) {
        const paramStr = Object.entries(params)
            .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
            .join(",");
        const url = `${entitySetName}(${recordId})/${functionName}(${paramStr})`;
        return this.requestWithRetry(() => this.http.get(url).then((r) => r.data));
    }
    // ─── Paging ──────────────────────────────────────────────────────────────
    async queryWithPaging(entitySetName, options = {}) {
        const maxTotal = Math.min(options.maxTotal ?? 5000, 50000);
        const records = [];
        let pageCount = 0;
        const queryOptions = {};
        if (options.select !== undefined)
            queryOptions.select = options.select;
        if (options.filter !== undefined)
            queryOptions.filter = options.filter;
        if (options.orderby !== undefined)
            queryOptions.orderby = options.orderby;
        if (options.expand !== undefined)
            queryOptions.expand = options.expand;
        let response = await this.query(entitySetName, queryOptions);
        records.push(...response.value);
        pageCount++;
        while (response["@odata.nextLink"] && records.length < maxTotal) {
            const nextLink = response["@odata.nextLink"];
            response = await this.requestWithRetry(() => this.http.get(nextLink).then((r) => r.data));
            records.push(...response.value);
            pageCount++;
        }
        const trimmed = records.slice(0, maxTotal);
        return { records: trimmed, totalRetrieved: trimmed.length, pageCount };
    }
    // ─── Change Tracking ─────────────────────────────────────────────────────
    async getChangedRecords(entitySetName, deltaToken, select) {
        let url;
        const extraHeaders = {};
        if (deltaToken === null) {
            const selectStr = select?.length ? `?$select=${select.join(",")}` : "";
            url = `${entitySetName}${selectStr}`;
            extraHeaders["Prefer"] = "odata.track-changes";
        }
        else {
            const selectStr = select?.length ? `&$select=${select.join(",")}` : "";
            url = `${entitySetName}?$deltatoken=${deltaToken}${selectStr}`;
        }
        const response = await this.requestWithRetry(() => this.http
            .get(url, { headers: extraHeaders })
            .then((r) => r.data));
        const value = response.value ?? [];
        const newAndModified = [];
        const deleted = [];
        for (const record of value) {
            if ("@removed" in record) {
                const idUrl = String(record["@id"] ?? "");
                const match = idUrl.match(/\(([^)]+)\)$/);
                deleted.push({ id: match ? match[1] : idUrl });
            }
            else {
                newAndModified.push(record);
            }
        }
        const deltaLink = response["@odata.deltaLink"];
        let nextDeltaToken = null;
        if (deltaLink) {
            const match = deltaLink.match(/\$deltatoken=([^&]+)/);
            nextDeltaToken = match ? decodeURIComponent(match[1]) : null;
        }
        return { newAndModified, deleted, nextDeltaToken };
    }
    // ─── Solution ────────────────────────────────────────────────────────────
    async getSolutionComponents(solutionName, componentType, top = 200) {
        return this.requestWithRetry(async () => {
            const solResp = await this.http.get(`solutions?$filter=uniquename eq '${esc(solutionName)}'&$select=solutionid,uniquename,friendlyname,version&$top=1`);
            const solutions = solResp.data.value;
            if (!solutions.length)
                throw new Error(`Solution '${solutionName}' not found`);
            const sol = solutions[0];
            const solutionId = sol["solutionid"];
            let filter = `_solutionid_value eq ${solutionId}`;
            if (componentType !== undefined)
                filter += ` and componenttype eq ${componentType}`;
            const compResp = await this.http.get(`solutioncomponents?$filter=${filter}&$select=componenttype,objectid&$top=${top}&$orderby=componenttype`);
            const components = compResp.data.value.map((c) => ({
                componentType: c["componenttype"],
                componentTypeName: COMPONENT_TYPE_MAP[c["componenttype"]] ??
                    `Type${c["componenttype"]}`,
                objectId: c["objectid"],
            }));
            return {
                solutionName: sol["uniquename"],
                solutionId,
                friendlyName: sol["friendlyname"],
                version: sol["version"],
                components,
                count: components.length,
            };
        });
    }
    async publishCustomizations(components) {
        return this.requestWithRetry(async () => {
            const hasComponents = components &&
                ((components.entities?.length ?? 0) > 0 ||
                    (components.webResources?.length ?? 0) > 0 ||
                    (components.optionSets?.length ?? 0) > 0);
            if (!hasComponents) {
                await this.http.post("PublishAllXml", {});
                return {
                    published: true,
                    message: "All customizations published successfully",
                };
            }
            let paramXml = "<importexportxml>";
            if (components.entities?.length) {
                paramXml +=
                    "<entities>" +
                        components.entities
                            .map((e) => `<entity>${xmlEscape(e)}</entity>`)
                            .join("") +
                        "</entities>";
            }
            if (components.webResources?.length) {
                paramXml +=
                    "<webresources>" +
                        components.webResources
                            .map((r) => `<webresource>${xmlEscape(r)}</webresource>`)
                            .join("") +
                        "</webresources>";
            }
            if (components.optionSets?.length) {
                paramXml +=
                    "<optionsets>" +
                        components.optionSets
                            .map((o) => `<optionset>${xmlEscape(o)}</optionset>`)
                            .join("") +
                        "</optionsets>";
            }
            paramXml += "</importexportxml>";
            await this.http.post("PublishXml", { ParameterXml: paramXml });
            return {
                published: true,
                message: "Selected customizations published successfully",
            };
        });
    }
}
//# sourceMappingURL=dataverse-client-advanced.js.map