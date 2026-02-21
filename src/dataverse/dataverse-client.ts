import { HttpClient, HttpError } from './http-client.js';
import type { AuthProvider } from '../auth/auth-provider.interface.js';
import type {
  ODataResponse,
  EntityMetadata,
  RelationshipMetadata,
  WhoAmIResponse,
  BatchRequest,
} from './types.js';
import { esc, parseMultipartResponse } from './dataverse-client.utils.js';

const API_VERSION = '9.2';

/**
 * Maps entity set names with irregular pluralization to their primary key field names.
 * Used as a fallback when OData-EntityId and @odata.id are absent from the response.
 */
const ENTITY_SET_TO_PK: Record<string, string> = {
  opportunities: 'opportunityid',
  territories: 'territoryid',
  categories: 'categoryid',
  activityparties: 'activitypartyid',
  activitymimeattachments: 'activitymimeattachmentid',
  queues: 'queueid',
  queueitems: 'queueitemid',
};

export class DataverseClient {
  protected readonly http: HttpClient;
  private readonly authProvider: AuthProvider;
  private readonly maxRetries: number;

  constructor(authProvider: AuthProvider, maxRetries = 3, timeoutMs = 30_000) {
    this.authProvider = authProvider;
    this.maxRetries = maxRetries;

    this.http = new HttpClient({
      baseURL: `${authProvider.environmentUrl}/api/data/v${API_VERSION}/`,
      timeout: timeoutMs,
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
      tokenProvider: () => authProvider.getToken(),
    });
  }

  protected async requestWithRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpError) {
        // On 401: invalidate cached token and retry once with a fresh token
        if (error.status === 401 && attempt === 0) {
          this.authProvider.invalidateToken();
          return this.requestWithRetry(fn, attempt + 1);
        }

        // On transient errors (429, 503): retry with Retry-After-aware backoff
        const isTransient = [429, 503, 504].includes(error.status);
        if (isTransient && attempt < this.maxRetries) {
          const retryAfterSec = error.responseHeaders['retry-after'];
          const delay = retryAfterSec ? parseInt(retryAfterSec, 10) * 1000 : Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry(fn, attempt + 1);
        }
      }

      throw this.formatError(error);
    }
  }

  private formatError(error: unknown): Error {
    if (error instanceof HttpError) {
      const dvError = (error.data as { error?: { message?: string; code?: string } } | undefined)?.error;
      if (dvError) {
        return new Error(`Dataverse error ${dvError.code ?? ''}: ${dvError.message ?? 'Unknown error'}`);
      }
      if (error.code === 'ECONNABORTED') {
        return new Error('Request timed out. Check your Dataverse environment URL.');
      }
      return error;
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async whoAmI(): Promise<{
    UserId: string;
    BusinessUnitId: string;
    OrganizationId: string;
    OrganizationName: string;
    EnvironmentUrl: string;
  }> {
    return this.requestWithRetry(async () => {
      const whoAmIResp = await this.http.get<WhoAmIResponse>('WhoAmI');
      const { UserId, BusinessUnitId, OrganizationId } = whoAmIResp.data;

      let OrganizationName = '';
      try {
        const orgResp = await this.http.get<{ name: string }>(
          `organizations(${OrganizationId})?$select=name`
        );
        OrganizationName = orgResp.data.name ?? '';
      } catch {
        OrganizationName = '';
      }

      const EnvironmentUrl = this.authProvider.environmentUrl;
      return { UserId, BusinessUnitId, OrganizationId, OrganizationName, EnvironmentUrl };
    });
  }

  // ─── Metadata ────────────────────────────────────────────────────────────

  async listTables(includeCustomOnly = false): Promise<EntityMetadata[]> {
    const filter = includeCustomOnly ? '$filter=IsCustomEntity eq true' : '';
    const select = '$select=LogicalName,SchemaName,DisplayName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity';
    const query = [select, filter].filter(Boolean).join('&');
    return this.requestWithRetry(() =>
      this.http.get<ODataResponse<EntityMetadata>>(`EntityDefinitions?${query}`).then(r => r.data.value)
    );
  }

  async getTableMetadata(logicalName: string, includeAttributes = true): Promise<EntityMetadata> {
    const expand = includeAttributes ? '$expand=Attributes' : '';
    const url = `EntityDefinitions(LogicalName='${esc(logicalName)}')${expand ? '?' + expand : ''}`;
    return this.requestWithRetry(() =>
      this.http.get<EntityMetadata>(url).then(r => r.data)
    );
  }

  async getRelationships(logicalName: string): Promise<RelationshipMetadata[]> {
    const escaped = esc(logicalName);
    const [oneToMany, manyToOne, manyToMany] = await Promise.all([
      this.requestWithRetry(() =>
        this.http
          .get<ODataResponse<RelationshipMetadata>>(
            `EntityDefinitions(LogicalName='${escaped}')/OneToManyRelationships`
          )
          .then(r => r.data.value)
      ),
      this.requestWithRetry(() =>
        this.http
          .get<ODataResponse<RelationshipMetadata>>(
            `EntityDefinitions(LogicalName='${escaped}')/ManyToOneRelationships`
          )
          .then(r => r.data.value)
      ),
      this.requestWithRetry(() =>
        this.http
          .get<ODataResponse<RelationshipMetadata>>(
            `EntityDefinitions(LogicalName='${escaped}')/ManyToManyRelationships`
          )
          .then(r => r.data.value)
      ),
    ]);
    return [...oneToMany, ...manyToOne, ...manyToMany];
  }

  // ─── Query ───────────────────────────────────────────────────────────────

  async query<T = Record<string, unknown>>(
    entitySetName: string,
    options: {
      select?: string[];
      filter?: string;
      orderby?: string;
      top?: number;
      expand?: string;
      count?: boolean;
      apply?: string;
    } = {}
  ): Promise<ODataResponse<T>> {
    const params: string[] = [];
    if (options.select?.length) params.push(`$select=${options.select.join(',')}`);
    if (options.filter) params.push(`$filter=${options.filter}`);
    if (options.orderby) params.push(`$orderby=${options.orderby}`);
    if (options.top) params.push(`$top=${options.top}`);
    if (options.expand) params.push(`$expand=${options.expand}`);
    if (options.count) params.push('$count=true');
    if (options.apply) params.push(`$apply=${options.apply}`);

    const url = `${entitySetName}${params.length ? '?' + params.join('&') : ''}`;
    return this.requestWithRetry(() =>
      this.http.get<ODataResponse<T>>(url).then(r => r.data)
    );
  }

  async executeFetchXml<T = Record<string, unknown>>(
    entitySetName: string,
    fetchXml: string
  ): Promise<ODataResponse<T>> {
    const encoded = encodeURIComponent(fetchXml);
    return this.requestWithRetry(() =>
      this.http
        .get<ODataResponse<T>>(`${entitySetName}?fetchXml=${encoded}`)
        .then(r => r.data)
    );
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async getRecord(
    entitySetName: string,
    id: string,
    select?: string[]
  ): Promise<{ record: Record<string, unknown>; etag: string | null }> {
    const params = select ? `?$select=${select.join(',')}` : '';
    return this.requestWithRetry(async () => {
      const response = await this.http.get<Record<string, unknown>>(`${entitySetName}(${id})${params}`, {
        headers: { Prefer: 'odata.include-annotations="*"' },
      });
      const etag =
        (response.headers['odata-etag'] as string | undefined) ??
        (response.data['@odata.etag'] as string | undefined) ??
        null;
      return { record: response.data as Record<string, unknown>, etag };
    });
  }

  async createRecord(entitySetName: string, data: Record<string, unknown>): Promise<string> {
    return this.requestWithRetry(async () => {
      const response = await this.http.post(entitySetName, data, {
        headers: { 'Prefer': 'return=representation' },
      });
      // 1. OData-EntityId header (standard, most reliable)
      const locationHeader = response.headers['odata-entityid'] as string | undefined;
      const fromHeader = locationHeader?.match(/\(([^)]+)\)/)?.[1];
      if (fromHeader) return fromHeader;
      // 2. @odata.id in body (collection response shape)
      const body = response.data as Record<string, unknown>;
      const fromOdataId = (body['@odata.id'] as string | undefined)?.match(/\(([^)]+)\)/)?.[1];
      if (fromOdataId) return fromOdataId;
      // 3. Primary key field in body (when return=representation and no OData-EntityId header)
      //    Use known irregular pluralizations; fall back to simple s-strip convention.
      const pkGuess = ENTITY_SET_TO_PK[entitySetName] ?? (entitySetName.replace(/s$/, '') + 'id');
      const fromPk = body[pkGuess] as string | undefined;
      if (fromPk) return fromPk;
      // 4. Location header fallback
      const location = response.headers['location'] as string | undefined;
      return location?.match(/\(([^)]+)\)/)?.[1] ?? '';
    });
  }

  async updateRecord(
    entitySetName: string,
    id: string,
    data: Record<string, unknown>,
    etag?: string
  ): Promise<void> {
    await this.requestWithRetry(() =>
      this.http.patch(`${entitySetName}(${id})`, data, {
        headers: { 'If-Match': etag ?? '*' },
      })
    );
  }

  async deleteRecord(entitySetName: string, id: string): Promise<void> {
    await this.requestWithRetry(() =>
      this.http.delete(`${entitySetName}(${id})`)
    );
  }

  async upsertRecord(
    entitySetName: string,
    alternateKey: string,
    alternateKeyValue: string,
    data: Record<string, unknown>,
    mode: 'upsert' | 'createOnly' | 'updateOnly' = 'upsert',
    keySegment?: string
  ): Promise<{ operation: 'created' | 'updated'; id: string }> {
    return this.requestWithRetry(async () => {
      const url = keySegment
        ? `${entitySetName}(${keySegment})`
        : `${entitySetName}(${esc(alternateKey)}='${esc(alternateKeyValue)}')`;
      const headers: Record<string, string> = { Prefer: 'return=representation' };
      if (mode === 'createOnly') headers['If-None-Match'] = '*';
      if (mode === 'updateOnly') headers['If-Match'] = '*';
      try {
        const response = await this.http.put(url, data, { headers });
        const operation = response.status === 201 ? 'created' : 'updated';
        const locationHeader = response.headers['odata-entityid'] as string | undefined;
        const fromHeader = locationHeader?.match(/\(([^)]+)\)/)?.[1];
        const body = response.data as Record<string, unknown> | undefined;
        const pkGuess = ENTITY_SET_TO_PK[entitySetName] ?? (entitySetName.replace(/s$/, '') + 'id');
        const id = fromHeader ?? (body?.[pkGuess] as string) ?? alternateKeyValue;
        return { operation, id };
      } catch (err: unknown) {
        if (err instanceof HttpError && err.status === 412) {
          if (mode === 'createOnly') throw new Error('Record already exists');
          if (mode === 'updateOnly') throw new Error('Record not found');
        }
        throw err;
      }
    });
  }

  // ─── Relations ───────────────────────────────────────────────────────────

  async associate(
    entitySetName: string,
    id: string,
    relationshipName: string,
    relatedEntitySetName: string,
    relatedId: string
  ): Promise<void> {
    const relatedUrl = `${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${relatedEntitySetName}(${relatedId})`;
    await this.requestWithRetry(() =>
      this.http.post(
        `${entitySetName}(${id})/${relationshipName}/$ref`,
        { '@odata.id': relatedUrl }
      )
    );
  }

  async disassociate(
    entitySetName: string,
    id: string,
    relationshipName: string,
    relatedId?: string,
    relatedEntitySetName?: string
  ): Promise<void> {
    const suffix = relatedId
      ? `?$id=${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${relatedEntitySetName ?? entitySetName}(${relatedId})`
      : '';
    await this.requestWithRetry(() =>
      this.http.delete(`${entitySetName}(${id})/${relationshipName}/$ref${suffix}`)
    );
  }

  // ─── Actions & Functions ─────────────────────────────────────────────────

  async executeAction(actionName: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    return this.requestWithRetry(() =>
      this.http.post(actionName, parameters).then(r => r.data)
    );
  }

  async executeFunction(functionName: string, parameters: Record<string, string> = {}): Promise<unknown> {
    const paramStr = Object.entries(parameters)
      .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
      .join(',');
    const url = paramStr ? `${functionName}(${paramStr})` : `${functionName}()`;
    return this.requestWithRetry(() =>
      this.http.get(url).then(r => r.data)
    );
  }

  async executeBoundAction(
    entitySetName: string,
    id: string,
    actionName: string,
    parameters: Record<string, unknown> = {}
  ): Promise<unknown> {
    return this.requestWithRetry(() =>
      this.http
        .post(`${entitySetName}(${id})/Microsoft.Dynamics.CRM.${actionName}`, parameters)
        .then(r => r.data)
    );
  }

  // ─── Batch ───────────────────────────────────────────────────────────────

  async batchExecute(requests: BatchRequest[], useChangeset = false): Promise<unknown[]> {
    const batchId = `batch_${Date.now()}`;
    let body = '';

    if (useChangeset) {
      const changesetId = `changeset_${Date.now() + 1}`;
      const getOps = requests.filter(r => r.method === 'GET');
      const mutatingOps = requests.filter(r => r.method !== 'GET');

      for (const req of getOps) {
        body += `--${batchId}\n`;
        body += `Content-Type: application/http\n`;
        body += `Content-Transfer-Encoding: binary\n\n`;
        body += `${req.method} ${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${req.url} HTTP/1.1\n`;
        body += `Accept: application/json\n\n\n`;
      }

      if (mutatingOps.length > 0) {
        body += `--${batchId}\n`;
        body += `Content-Type: multipart/mixed; boundary=${changesetId}\n\n`;
        let contentIdCounter = 1;
        for (const op of mutatingOps) {
          body += `--${changesetId}\n`;
          body += `Content-Type: application/http\n`;
          body += `Content-Transfer-Encoding: binary\n`;
          body += `Content-ID: ${op.contentId ?? contentIdCounter++}\n\n`;
          body += `${op.method} ${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${op.url} HTTP/1.1\n`;
          body += `Content-Type: application/json\n\n`;
          if (op.body) body += JSON.stringify(op.body);
          body += '\n\n';
        }
        body += `--${changesetId}--\n`;
      }
    } else {
      requests.forEach((req) => {
        body += `--${batchId}\n`;
        body += `Content-Type: application/http\n`;
        body += `Content-Transfer-Encoding: binary\n\n`;
        body += `${req.method} ${this.authProvider.environmentUrl}/api/data/v${API_VERSION}/${req.url} HTTP/1.1\n`;
        body += `Content-Type: application/json\n\n`;
        if (req.body) body += JSON.stringify(req.body);
        body += '\n';
      });
    }

    body += `--${batchId}--`;

    const response = await this.requestWithRetry(() =>
      this.http.post('$batch', body, {
        headers: { 'Content-Type': `multipart/mixed;boundary=${batchId}` },
        responseType: 'text',
      })
    );

    try {
      const contentType = (response.headers['content-type'] as string | undefined) ?? '';
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;"\s]+))/);
      const responseBoundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];

      if (!responseBoundary) {
        process.stderr.write('[batchExecute] No multipart boundary in response Content-Type; returning raw data.\n');
        return [response.data];
      }

      return parseMultipartResponse(response.data as string, responseBoundary);
    } catch (err) {
      process.stderr.write(`[batchExecute] Failed to parse multipart response; returning raw data. ${String(err)}\n`);
      return [response.data];
    }
  }

}
