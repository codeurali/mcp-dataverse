import { DataverseBatchClient } from './dataverse-client.batch.js';
import type { ODataResponse } from './types.js';
import { esc } from './dataverse-client.utils.js';

const COMPONENT_TYPE_MAP: Record<number, string> = {
  1: 'Entity', 2: 'Attribute', 3: 'Relationship', 9: 'OptionSet',
  29: 'Workflow', 61: 'SystemForm', 71: 'SiteMap', 90: 'PluginAssembly',
  92: 'PluginType', 97: 'WebResource', 95: 'ServiceEndpoint', 79: 'ConnectionRole',
};

/** Escapes a string for safe embedding inside an XML element value. */
function xmlEscape(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extends DataverseMetadataClient with advanced query capabilities:
 * bound functions, server-side paging, and change tracking (delta queries).
 */
export class DataverseAdvancedClient extends DataverseBatchClient {

  // ─── Advanced Actions & Functions ────────────────────────────────────────

  async executeBoundFunction<T = unknown>(
    entitySetName: string,
    recordId: string,
    functionName: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const paramStr = Object.entries(params)
      .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
      .join(',');
    const url = `${entitySetName}(${recordId})/${functionName}(${paramStr})`;
    return this.requestWithRetry(() =>
      this.http.get<T>(url).then(r => r.data)
    );
  }

  // ─── Paging ──────────────────────────────────────────────────────────────

  async queryWithPaging<T = Record<string, unknown>>(
    entitySetName: string,
    options: {
      select?: string[];
      filter?: string;
      orderby?: string;
      expand?: string;
      maxTotal?: number;
    } = {}
  ): Promise<{ records: T[]; totalRetrieved: number; pageCount: number }> {
    const maxTotal = Math.min(options.maxTotal ?? 5000, 50000);
    const records: T[] = [];
    let pageCount = 0;

    const queryOptions: Parameters<typeof this.query<T>>[1] = {};
    if (options.select !== undefined) queryOptions.select = options.select;
    if (options.filter !== undefined) queryOptions.filter = options.filter;
    if (options.orderby !== undefined) queryOptions.orderby = options.orderby;
    if (options.expand !== undefined) queryOptions.expand = options.expand;

    let response = await this.query<T>(entitySetName, queryOptions);
    records.push(...response.value);
    pageCount++;

    while (response['@odata.nextLink'] && records.length < maxTotal) {
      const nextLink = response['@odata.nextLink'];
      response = await this.requestWithRetry(() =>
        this.http.get<ODataResponse<T>>(nextLink).then(r => r.data)
      );
      records.push(...response.value);
      pageCount++;
    }

    const trimmed = records.slice(0, maxTotal);
    return { records: trimmed, totalRetrieved: trimmed.length, pageCount };
  }

  // ─── Change Tracking ─────────────────────────────────────────────────────

  async getChangedRecords<T = Record<string, unknown>>(
    entitySetName: string,
    deltaToken: string | null,
    select?: string[]
  ): Promise<{
    newAndModified: T[];
    deleted: Array<{ id: string }>;
    nextDeltaToken: string | null;
  }> {
    type DeltaResponse = ODataResponse<Record<string, unknown>> & { '@odata.deltaLink'?: string };

    let url: string;
    const extraHeaders: Record<string, string> = {};

    if (deltaToken === null) {
      const selectStr = select?.length ? `?$select=${select.join(',')}` : '';
      url = `${entitySetName}${selectStr}`;
      extraHeaders['Prefer'] = 'odata.track-changes';
    } else {
      const selectStr = select?.length ? `&$select=${select.join(',')}` : '';
      url = `${entitySetName}?$deltatoken=${deltaToken}${selectStr}`;
    }

    const response = await this.requestWithRetry(() =>
      this.http
        .get<DeltaResponse>(url, { headers: extraHeaders })
        .then(r => r.data)
    );

    const value = response.value ?? [];
    const newAndModified: T[] = [];
    const deleted: Array<{ id: string }> = [];

    for (const record of value) {
      if ('@removed' in record) {
        const idUrl = String(record['@id'] ?? '');
        const match = idUrl.match(/\(([^)]+)\)$/);
        deleted.push({ id: match ? match[1]! : idUrl });
      } else {
        newAndModified.push(record as T);
      }
    }

    const deltaLink = response['@odata.deltaLink'];
    let nextDeltaToken: string | null = null;
    if (deltaLink) {
      const match = deltaLink.match(/\$deltatoken=([^&]+)/);
      nextDeltaToken = match ? decodeURIComponent(match[1]!) : null;
    }

    return { newAndModified, deleted, nextDeltaToken };
  }

  // ─── Solution ────────────────────────────────────────────────────────────

  async getSolutionComponents(
    solutionName: string,
    componentType?: number,
    top = 200
  ): Promise<{
    solutionName: string;
    solutionId: string;
    friendlyName: string;
    version: string;
    components: Array<{ componentType: number; componentTypeName: string; objectId: string }>;
    count: number;
  }> {
    return this.requestWithRetry(async () => {
      const solResp = await this.http.get<{ value: Array<Record<string, unknown>> }>(
        `solutions?$filter=uniquename eq '${esc(solutionName)}'&$select=solutionid,uniquename,friendlyname,version&$top=1`
      );
      const solutions = solResp.data.value;
      if (!solutions.length) throw new Error(`Solution '${solutionName}' not found`);
      const sol = solutions[0]!;
      const solutionId = sol['solutionid'] as string;

      let filter = `_solutionid_value eq ${solutionId}`;
      if (componentType !== undefined) filter += ` and componenttype eq ${componentType}`;
      const compResp = await this.http.get<{ value: Array<Record<string, unknown>> }>(
        `solutioncomponents?$filter=${filter}&$select=componenttype,objectid&$top=${top}&$orderby=componenttype`
      );
      const components = compResp.data.value.map(c => ({
        componentType: c['componenttype'] as number,
        componentTypeName: COMPONENT_TYPE_MAP[c['componenttype'] as number] ?? `Type${c['componenttype']}`,
        objectId: c['objectid'] as string,
      }));
      return {
        solutionName: sol['uniquename'] as string,
        solutionId,
        friendlyName: sol['friendlyname'] as string,
        version: sol['version'] as string,
        components,
        count: components.length,
      };
    });
  }

  async publishCustomizations(components?: {
    entities?: string[] | undefined;
    webResources?: string[] | undefined;
    optionSets?: string[] | undefined;
  }): Promise<{ published: boolean; message: string }> {
    return this.requestWithRetry(async () => {
      const hasComponents =
        components &&
        ((components.entities?.length ?? 0) > 0 ||
          (components.webResources?.length ?? 0) > 0 ||
          (components.optionSets?.length ?? 0) > 0);

      if (!hasComponents) {
        await this.http.post('PublishAllXml', {});
        return { published: true, message: 'All customizations published successfully' };
      }

      let paramXml = '<importexportxml>';
      if (components!.entities?.length) {
        paramXml += '<entities>' + components!.entities.map(e => `<entity>${xmlEscape(e)}</entity>`).join('') + '</entities>';
      }
      if (components!.webResources?.length) {
        paramXml += '<webresources>' + components!.webResources.map(r => `<webresource>${xmlEscape(r)}</webresource>`).join('') + '</webresources>';
      }
      if (components!.optionSets?.length) {
        paramXml += '<optionsets>' + components!.optionSets.map(o => `<optionset>${xmlEscape(o)}</optionset>`).join('') + '</optionsets>';
      }
      paramXml += '</importexportxml>';

      await this.http.post('PublishXml', { ParameterXml: paramXml });
      return { published: true, message: 'Selected customizations published successfully' };
    });
  }
}
