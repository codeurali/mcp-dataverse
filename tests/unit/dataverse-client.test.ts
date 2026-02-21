jest.mock('../../src/dataverse/http-client.js', () => {
  class HttpError extends Error {
    status: number;
    data: unknown;
    code: string | undefined;
    responseHeaders: Record<string, string>;
    constructor(message: string, status: number, data: unknown, code?: string, responseHeaders: Record<string, string> = {}) {
      super(message);
      this.name = 'HttpError';
      this.status = status;
      this.data = data;
      this.code = code ?? undefined;
      this.responseHeaders = responseHeaders;
    }
  }
  return { HttpClient: jest.fn(), HttpError };
});

import { HttpClient, HttpError } from '../../src/dataverse/http-client.js';
import { DataverseClient } from '../../src/dataverse/dataverse-client.js';
import { DataverseMetadataClient } from '../../src/dataverse/dataverse-client.metadata.js';
import type { AuthProvider } from '../../src/auth/auth-provider.interface.js';

function createHttpError(status: number, responseData?: unknown, code?: string): HttpError {
  return new HttpError(`Request failed with status ${status}`, status, responseData ?? {}, code);
}

describe('DataverseClient', () => {
  let mockGet: jest.Mock;
  let mockPost: jest.Mock;
  let mockPatch: jest.Mock;
  let mockPut: jest.Mock;
  let mockDelete: jest.Mock;
  let mockAuthProvider: AuthProvider;

  const whoAmIData = {
    UserId: 'user-guid-123',
    BusinessUnitId: 'bu-guid-456',
    OrganizationId: 'org-guid-789',
  };

  const ENV_URL = 'https://myorg.crm.dynamics.com';

  beforeEach(() => {
    mockGet = jest.fn();
    mockPost = jest.fn();
    mockPatch = jest.fn();
    mockPut = jest.fn();
    mockDelete = jest.fn();

    const mockHttp = {
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      put: mockPut,
      delete: mockDelete,
      defaultHeaders: {},
    };

    (HttpClient as unknown as jest.Mock).mockImplementation(() => mockHttp);

    mockAuthProvider = {
      environmentUrl: ENV_URL,
      getToken: jest.fn().mockResolvedValue('mock-bearer-token'),
      invalidateToken: jest.fn(),
      isAuthenticated: jest.fn().mockResolvedValue(true),
    };
  });

  describe('whoAmI', () => {
    it('returns all 5 WhoAmI fields including OrganizationName and EnvironmentUrl', async () => {
      mockGet
        .mockResolvedValueOnce({ data: whoAmIData })
        .mockResolvedValueOnce({ data: { name: 'Test Org' } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.whoAmI();

      expect(result).toEqual({
        ...whoAmIData,
        OrganizationName: 'Test Org',
        EnvironmentUrl: 'https://myorg.crm.dynamics.com',
      });
      expect(mockGet).toHaveBeenCalledWith('WhoAmI');
      expect(mockGet).toHaveBeenCalledWith(`organizations(${whoAmIData.OrganizationId})?$select=name`);
    });

    it('invalidates token and retries once on 401', async () => {
      mockGet
        .mockRejectedValueOnce(createHttpError(401))
        .mockResolvedValueOnce({ data: whoAmIData })
        .mockResolvedValueOnce({ data: { name: 'Test Org' } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.whoAmI();

      expect(result).toMatchObject(whoAmIData);
      expect(mockAuthProvider.invalidateToken).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(3);
    });

    it('does not retry 401 a second time (attempt > 0)', async () => {
      mockGet.mockRejectedValue(createHttpError(401));

      const client = new DataverseClient(mockAuthProvider, 1);
      await expect(client.whoAmI()).rejects.toBeDefined();
      // First call fails → retry once → second call also 401 → throws (not looping)
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('retries with backoff on 429 and succeeds', async () => {
      jest.useFakeTimers();
      try {
        mockGet
          .mockRejectedValueOnce(createHttpError(429))
          .mockResolvedValueOnce({ data: whoAmIData })
          .mockResolvedValueOnce({ data: { name: 'Test Org' } });

        const client = new DataverseClient(mockAuthProvider, 1);
        const promise = client.whoAmI();

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toMatchObject(whoAmIData);
        expect(mockGet).toHaveBeenCalledTimes(3);
      } finally {
        jest.useRealTimers();
      }
    });

    it('formats Dataverse error body into a readable message', async () => {
      const dvBody = {
        error: { message: 'Resource does not exist', code: 'ObjectDoesNotExist' },
      };
      mockGet.mockRejectedValueOnce(createHttpError(404, dvBody));

      const client = new DataverseClient(mockAuthProvider, 0);
      await expect(client.whoAmI()).rejects.toThrow(
        'Dataverse error ObjectDoesNotExist: Resource does not exist'
      );
    });

    it('returns ECONNABORTED error as timeout message', async () => {
      mockGet.mockRejectedValueOnce(createHttpError(0, undefined, 'ECONNABORTED'));

      const client = new DataverseClient(mockAuthProvider, 0);
      await expect(client.whoAmI()).rejects.toThrow('timed out');
    });
  });

  // ── listTables ──────────────────────────────────────────────────────────

  describe('listTables', () => {
    it('returns table list without filter by default', async () => {
      const tables = [{ LogicalName: 'account' }];
      mockGet.mockResolvedValueOnce({ data: { value: tables } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.listTables();

      expect(result).toEqual(tables);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('EntityDefinitions'));
      expect(mockGet).toHaveBeenCalledWith(expect.not.stringContaining('IsCustomEntity eq true'));
    });

    it('adds filter when includeCustomOnly=true', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: [] } });

      const client = new DataverseClient(mockAuthProvider);
      await client.listTables(true);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('IsCustomEntity eq true'));
    });
  });

  // ── getTableMetadata ────────────────────────────────────────────────────

  describe('getTableMetadata', () => {
    it('returns metadata with attributes expanded by default', async () => {
      const meta = { LogicalName: 'account', Attributes: [] };
      mockGet.mockResolvedValueOnce({ data: meta });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.getTableMetadata('account');

      expect(result).toEqual(meta);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("EntityDefinitions(LogicalName='account')")
      );
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('$expand=Attributes'));
    });

    it('omits $expand when includeAttributes=false', async () => {
      mockGet.mockResolvedValueOnce({ data: { LogicalName: 'account' } });

      const client = new DataverseClient(mockAuthProvider);
      await client.getTableMetadata('account', false);

      const calledUrl = mockGet.mock.calls[0]![0] as string;
      expect(calledUrl).not.toContain('$expand');
    });
  });

  // ── getRelationships ────────────────────────────────────────────────────

  describe('getRelationships', () => {
    it('returns merged relationships from all three types', async () => {
      const oneToMany = [{ SchemaName: 'rel1' }];
      const manyToOne = [{ SchemaName: 'rel2' }];
      const manyToMany: unknown[] = [];

      mockGet
        .mockResolvedValueOnce({ data: { value: oneToMany } })
        .mockResolvedValueOnce({ data: { value: manyToOne } })
        .mockResolvedValueOnce({ data: { value: manyToMany } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.getRelationships('account');

      expect(result).toHaveLength(2);
      expect(result[0]!.SchemaName).toBe('rel1');
      expect(result[1]!.SchemaName).toBe('rel2');
    });
  });

  // ── query ───────────────────────────────────────────────────────────────

  describe('query', () => {
    it('builds OData URL from all options', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: [], '@odata.context': 'ctx' } });

      const client = new DataverseClient(mockAuthProvider);
      await client.query('accounts', {
        select: ['name', 'revenue'],
        filter: "statecode eq 0",
        orderby: 'name asc',
        top: 10,
        expand: 'contacts',
        count: true,
      });

      const calledUrl = mockGet.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('$select=name,revenue');
      expect(calledUrl).toContain('$filter=statecode eq 0');
      expect(calledUrl).toContain('$orderby=name asc');
      expect(calledUrl).toContain('$top=10');
      expect(calledUrl).toContain('$expand=contacts');
      expect(calledUrl).toContain('$count=true');
    });

    it('returns plain URL with no params when options are empty', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: [] } });

      const client = new DataverseClient(mockAuthProvider);
      await client.query('contacts');

      expect(mockGet).toHaveBeenCalledWith('contacts');
    });
  });

  // ── executeFetchXml ─────────────────────────────────────────────────────

  describe('executeFetchXml', () => {
    it('encodes fetchXml in query string', async () => {
      const fetchXml = '<fetch><entity name="account"/></fetch>';
      mockGet.mockResolvedValueOnce({ data: { value: [] } });

      const client = new DataverseClient(mockAuthProvider);
      await client.executeFetchXml('accounts', fetchXml);

      const calledUrl = mockGet.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('fetchXml=');
      expect(calledUrl).toContain(encodeURIComponent(fetchXml));
    });
  });

  // ── getRecord ───────────────────────────────────────────────────────────

  describe('getRecord', () => {
    it('fetches record by id', async () => {
      const record = { accountid: 'id-123', name: 'Contoso' };
      mockGet.mockResolvedValueOnce({ data: record, headers: { 'odata-etag': 'W/"1"' } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.getRecord('accounts', 'id-123');

      expect(result).toEqual({ record, etag: 'W/"1"' });
      expect(mockGet).toHaveBeenCalledWith(
        'accounts(id-123)',
        expect.objectContaining({ headers: expect.objectContaining({ Prefer: expect.any(String) }) })
      );
    });

    it('adds $select when columns provided', async () => {
      mockGet.mockResolvedValueOnce({ data: { name: 'Test' }, headers: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.getRecord('accounts', 'id-123', ['name', 'revenue']);

      expect(mockGet).toHaveBeenCalledWith(
        'accounts(id-123)?$select=name,revenue',
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });
  });

  // ── createRecord ────────────────────────────────────────────────────────

  describe('createRecord', () => {
    it('extracts id from OData-EntityId header', async () => {
      mockPost.mockResolvedValueOnce({
        data: {},
        headers: { 'odata-entityid': `${ENV_URL}/api/data/v9.2/accounts(new-id-123)` },
      });

      const client = new DataverseClient(mockAuthProvider);
      const id = await client.createRecord('accounts', { name: 'Test' });

      expect(id).toBe('new-id-123');
    });

    it('extracts id from @odata.id in response body', async () => {
      mockPost.mockResolvedValueOnce({
        data: { '@odata.id': `${ENV_URL}/api/data/v9.2/accounts(body-id-456)` },
        headers: {},
      });

      const client = new DataverseClient(mockAuthProvider);
      const id = await client.createRecord('accounts', { name: 'Test' });

      expect(id).toBe('body-id-456');
    });

    it('extracts id from primary key convention in body', async () => {
      mockPost.mockResolvedValueOnce({
        data: { accountid: 'pk-id-789' },
        headers: {},
      });

      const client = new DataverseClient(mockAuthProvider);
      const id = await client.createRecord('accounts', { name: 'Test' });

      expect(id).toBe('pk-id-789');
    });

    it('falls back to Location header if no id in body', async () => {
      mockPost.mockResolvedValueOnce({
        data: {},
        headers: { location: `${ENV_URL}/api/data/v9.2/contacts(loc-id-000)` },
      });

      const client = new DataverseClient(mockAuthProvider);
      const id = await client.createRecord('contacts', {});

      expect(id).toBe('loc-id-000');
    });
  });

  // ── updateRecord ────────────────────────────────────────────────────────

  describe('updateRecord', () => {
    it('calls PATCH on entitySetName(id) with If-Match header', async () => {
      mockPatch.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.updateRecord('accounts', 'id-xyz', { name: 'Updated' });

      expect(mockPatch).toHaveBeenCalledWith(
        'accounts(id-xyz)',
        { name: 'Updated' },
        expect.objectContaining({ headers: expect.objectContaining({ 'If-Match': '*' }) })
      );
    });
  });

  // ── deleteRecord ────────────────────────────────────────────────────────

  describe('deleteRecord', () => {
    it('calls DELETE on entitySetName(id)', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.deleteRecord('accounts', 'del-id');

      expect(mockDelete).toHaveBeenCalledWith('accounts(del-id)');
    });
  });

  // ── upsertRecord ────────────────────────────────────────────────────────

  describe('upsertRecord', () => {
    it('uses PUT with Prefer header and returns { operation: "created", id } on 201', async () => {
      mockPut.mockResolvedValueOnce({
        status: 201,
        headers: { 'odata-entityid': "https://myorg.crm.dynamics.com/api/data/v9.2/accounts(new-id-123)" },
        data: {},
      });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.upsertRecord('accounts', 'alternatekey', 'myvalue', { name: 'Test' });

      expect(result).toEqual({ operation: 'created', id: 'new-id-123' });
      expect(mockPut).toHaveBeenCalledWith(
        "accounts(alternatekey='myvalue')",
        { name: 'Test' },
        expect.objectContaining({
          headers: expect.objectContaining({ 'Prefer': 'return=representation' }),
        })
      );
    });

    it('returns { operation: "updated", id } falling back to alternateKeyValue on 204', async () => {
      mockPut.mockResolvedValueOnce({ status: 204, headers: {}, data: {} });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.upsertRecord('accounts', 'alternatekey', 'existing-key', { name: 'Updated' });

      expect(result).toEqual({ operation: 'updated', id: 'existing-key' });
    });
  });

  // ── associate / disassociate ────────────────────────────────────────────

  describe('associate', () => {
    it('POST to $ref endpoint with @odata.id body', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.associate('accounts', 'acc-id', 'account_contacts', 'contacts', 'con-id');

      expect(mockPost).toHaveBeenCalledWith(
        'accounts(acc-id)/account_contacts/$ref',
        expect.objectContaining({ '@odata.id': expect.stringContaining('contacts(con-id)') })
      );
    });
  });

  describe('disassociate', () => {
    it('DELETE from $ref endpoint with relatedId query', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.disassociate('accounts', 'acc-id', 'account_contacts', 'con-id');

      const calledUrl = mockDelete.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('accounts(acc-id)/account_contacts/$ref');
      expect(calledUrl).toContain('$id=');
    });

    it('DELETE from $ref endpoint without relatedId when omitted', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.disassociate('accounts', 'acc-id', 'account_contacts');

      const calledUrl = mockDelete.mock.calls[0]![0] as string;
      expect(calledUrl).toBe('accounts(acc-id)/account_contacts/$ref');
    });
  });

  // ── executeAction / executeFunction / executeBoundAction ───────────────

  describe('executeAction', () => {
    it('POST to named action and returns response data', async () => {
      mockPost.mockResolvedValueOnce({ data: { result: 'ok' } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.executeAction('SendEmail', { target: 'email-id' });

      expect(result).toEqual({ result: 'ok' });
      expect(mockPost).toHaveBeenCalledWith('SendEmail', { target: 'email-id' });
    });

    it('POST with empty params by default', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.executeAction('MyAction');

      expect(mockPost).toHaveBeenCalledWith('MyAction', {});
    });
  });

  describe('executeFunction', () => {
    it('GET with no params when empty', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: 42 } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.executeFunction('GetTotalCount');

      expect(mockGet).toHaveBeenCalledWith('GetTotalCount()');
      expect(result).toEqual({ value: 42 });
    });

    it('builds param string from provided parameters', async () => {
      mockGet.mockResolvedValueOnce({ data: {} });

      const client = new DataverseClient(mockAuthProvider);
      await client.executeFunction('MyFunction', { EntityName: 'account', Status: 'active' });

      const calledUrl = mockGet.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("EntityName='account'");
      expect(calledUrl).toContain("Status='active'");
    });
  });

  describe('executeBoundAction', () => {
    it('POST to bound action URL on specific record', async () => {
      mockPost.mockResolvedValueOnce({ data: { Success: true } });

      const client = new DataverseClient(mockAuthProvider);
      const result = await client.executeBoundAction('accounts', 'acc-id', 'SetState', { state: 1 });

      expect(result).toEqual({ Success: true });
      expect(mockPost).toHaveBeenCalledWith(
        'accounts(acc-id)/Microsoft.Dynamics.CRM.SetState',
        { state: 1 }
      );
    });
  });

  // ── batchExecute ────────────────────────────────────────────────────────

  describe('batchExecute', () => {
    it('parses multipart response using boundary from content-type header', async () => {
      const boundary = 'batchresponse_abc';
      const multipartBody = [
        `--${boundary}`,
        'Content-Type: application/http',
        'Content-Transfer-Encoding: binary',
        '',
        'HTTP/1.1 200 OK',
        'Content-Type: application/json',
        '',
        JSON.stringify({ value: [{ name: 'Test' }] }),
        `--${boundary}--`,
      ].join('\r\n');

      mockPost.mockResolvedValueOnce({
        data: multipartBody,
        headers: { 'content-type': `multipart/mixed;boundary=${boundary}` },
      });

      const client = new DataverseClient(mockAuthProvider);
      const results = await client.batchExecute([{ method: 'GET', url: 'accounts' }]);

      expect(results).toHaveLength(1);
    });

    it('returns raw data when no boundary in content-type header', async () => {
      mockPost.mockResolvedValueOnce({
        data: 'raw response',
        headers: { 'content-type': 'text/plain' },
      });

      const client = new DataverseClient(mockAuthProvider);
      const results = await client.batchExecute([{ method: 'GET', url: 'accounts' }]);

      expect(results).toEqual(['raw response']);
    });

    it('returns raw data when multipart parse throws', async () => {
      // Malformed content-type that causes boundary extraction to fail
      mockPost.mockResolvedValueOnce({
        data: null,
        headers: { 'content-type': 'multipart/mixed;boundary=test' },
      });

      const client = new DataverseClient(mockAuthProvider);
      // null body will cause parseMultipartResponse to throw; should fallback gracefully
      const results = await client.batchExecute([{ method: 'GET', url: 'accounts' }]);

      expect(Array.isArray(results)).toBe(true);
    });
  });

  // ── listDependencies ────────────────────────────────────────────────────

  describe('listDependencies', () => {
    it('returns array of dependencies', async () => {
      const deps = [{ DependentComponentObjectId: 'dep-1' }];
      mockGet.mockResolvedValueOnce({ data: { value: deps } });

      const client = new DataverseMetadataClient(mockAuthProvider);
      const result = await client.listDependencies(1, 'obj-id');

      expect(result).toEqual(deps);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('RetrieveDependenciesForDelete')
      );
    });
  });

  // ── listTableDependencies ───────────────────────────────────────────────

  describe('listTableDependencies', () => {
    it('returns structured dependency report for a table', async () => {
      const workflows = [
        {
          workflowid: 'wf-1',
          name: 'On Account Create',
          statecode: 1,
          category: 0,
          triggeroncreate: true,
          triggerondelete: false,
          triggeronupdateattributelist: null,
        },
      ];
      mockGet.mockResolvedValueOnce({ data: { value: workflows } });

      const client = new DataverseMetadataClient(mockAuthProvider);
      const result = await client.listTableDependencies('account');

      expect(result.tableName).toBe('account');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0]!.name).toBe('On Account Create');
      expect(result.dependencies[0]!.componentType).toBe('Workflow');
      expect(result.dependencies[0]!.state).toBe('Active');
      expect(result.dependencies[0]!.triggerEvent).toBe('Create');
      expect(result.count).toBe(1);
    });

    it('filters by type when types array is provided', async () => {
      const workflows = [
        {
          workflowid: 'wf-1',
          name: 'Flow 1',
          statecode: 1,
          category: 5,
          triggeroncreate: true,
          triggerondelete: false,
          triggeronupdateattributelist: null,
        },
        {
          workflowid: 'wf-2',
          name: 'Business Rule 1',
          statecode: 1,
          category: 2,
          triggeroncreate: false,
          triggerondelete: false,
          triggeronupdateattributelist: null,
        },
      ];
      mockGet.mockResolvedValueOnce({ data: { value: workflows } });

      const client = new DataverseMetadataClient(mockAuthProvider);
      const result = await client.listTableDependencies('account', ['Flow']);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0]!.componentType).toBe('Flow');
    });
  });

  // ── listGlobalOptionSets / getOptionSet ─────────────────────────────────

  describe('listGlobalOptionSets', () => {
    it('returns option sets array', async () => {
      const optSets = [{ Name: 'status', MetadataId: 'os-1' }];
      mockGet.mockResolvedValueOnce({ data: { value: optSets } });

      const client = new DataverseMetadataClient(mockAuthProvider);
      const result = await client.listGlobalOptionSets();

      expect(result).toEqual(optSets);
    });
  });

  describe('getOptionSet', () => {
    it('fetches option set by name with proper escaping', async () => {
      const optSet = { Name: 'my_status', Options: [] };
      mockGet.mockResolvedValueOnce({ data: optSet });

      const client = new DataverseMetadataClient(mockAuthProvider);
      const result = await client.getOptionSet("my_status");

      expect(result).toEqual(optSet);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("GlobalOptionSetDefinitions(Name='my_status')")
      );
    });
  });
});
