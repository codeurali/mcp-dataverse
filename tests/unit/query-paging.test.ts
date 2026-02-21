jest.mock('../../src/dataverse/http-client.js', () => {
  class HttpError extends Error {
    status: number;
    data: unknown;
    code: string | undefined;
    constructor(message: string, status: number, data: unknown, code?: string) {
      super(message);
      this.name = 'HttpError';
      this.status = status;
      this.data = data;
      this.code = code ?? undefined;
    }
  }
  return { HttpClient: jest.fn(), HttpError };
});

import { HttpClient } from '../../src/dataverse/http-client.js';
import { handleQueryTool } from '../../src/tools/query.tools.js';
import { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';
import type { AuthProvider } from '../../src/auth/auth-provider.interface.js';

// ─── Tool handler tests ────────────────────────────────────────────────────

describe('Query tool handlers — dataverse_retrieve_multiple_with_paging', () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = { queryWithPaging: jest.fn(), query: jest.fn() };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it('returns JSON with records, totalRetrieved, and pageCount on a single-page result', async () => {
    mockClient.queryWithPaging!.mockResolvedValue({
      records: [{ id: '1', name: 'Contact A' }],
      totalRetrieved: 1,
      pageCount: 1,
    });

    const result = await handleQueryTool(
      'dataverse_retrieve_multiple_with_paging',
      { entitySetName: 'contacts' },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      records: unknown[];
      totalRetrieved: number;
      pageCount: number;
    };
    expect(parsed.totalRetrieved).toBe(1);
    expect(parsed.pageCount).toBe(1);
    expect(parsed.records).toHaveLength(1);
  });

  it('throws Zod validation error when maxTotal exceeds 50000', async () => {
    await expect(
      handleQueryTool(
        'dataverse_retrieve_multiple_with_paging',
        { entitySetName: 'contacts', maxTotal: 50001 },
        dvClient()
      )
    ).rejects.toThrow();
  });

  it('calls queryWithPaging without maxTotal when maxTotal is not provided (client default of 5000 applies)', async () => {
    mockClient.queryWithPaging!.mockResolvedValue({
      records: [],
      totalRetrieved: 0,
      pageCount: 1,
    });

    await handleQueryTool(
      'dataverse_retrieve_multiple_with_paging',
      { entitySetName: 'contacts' },
      dvClient()
    );

    // maxTotal is optional — when absent it is NOT forwarded to the client;
    // DataverseAdvancedClient then applies its own default of 5000 internally.
    expect(mockClient.queryWithPaging).toHaveBeenCalledWith('contacts', {});
  });

  it('returns correct totalRetrieved and pageCount for a multi-page result', async () => {
    mockClient.queryWithPaging!.mockResolvedValue({
      records: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
      totalRetrieved: 3,
      pageCount: 2,
    });

    const result = await handleQueryTool(
      'dataverse_retrieve_multiple_with_paging',
      { entitySetName: 'accounts', select: ['name', 'accountid'] },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      totalRetrieved: number;
      pageCount: number;
    };
    expect(parsed.totalRetrieved).toBe(3);
    expect(parsed.pageCount).toBe(2);
  });
});

// ─── DataverseAdvancedClient.queryWithPaging unit tests ───────────────────

describe('DataverseAdvancedClient.queryWithPaging', () => {
  let mockGet: jest.Mock;
  let mockAuthProvider: AuthProvider;

  beforeEach(() => {
    mockGet = jest.fn();
    const mockHttp = {
      get: mockGet,
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      defaultHeaders: {},
    };
    (HttpClient as unknown as jest.Mock).mockImplementation(() => mockHttp);

    mockAuthProvider = {
      environmentUrl: 'https://myorg.crm.dynamics.com',
      getToken: jest.fn().mockResolvedValue('mock-token'),
      invalidateToken: jest.fn(),
      isAuthenticated: jest.fn().mockResolvedValue(true),
    };
  });

  it('stops paginating when accumulated records reach maxTotal', async () => {
    // First GET (used by the internal query() call): 1 record, has a nextLink
    mockGet.mockResolvedValueOnce({
      data: { value: [{ id: 'x' }], '@odata.nextLink': 'http://page2' },
    });
    // Second GET (used by the while-loop): 1 more record, still has a nextLink
    mockGet.mockResolvedValueOnce({
      data: { value: [{ id: 'y' }], '@odata.nextLink': 'http://page3' },
    });

    const client = new DataverseAdvancedClient(mockAuthProvider);
    const result = await client.queryWithPaging('contacts', { maxTotal: 2 });

    expect(result.totalRetrieved).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(result.records).toEqual([{ id: 'x' }, { id: 'y' }]);
    // Third page must NOT be fetched: records.length (2) >= maxTotal (2)
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('stops paginating when response contains no nextLink', async () => {
    // First GET: 2 records, has a nextLink
    mockGet.mockResolvedValueOnce({
      data: { value: [{ id: 'a' }, { id: 'b' }], '@odata.nextLink': 'http://page2' },
    });
    // Second GET: 1 record, no nextLink → pagination ends naturally
    mockGet.mockResolvedValueOnce({
      data: { value: [{ id: 'c' }] },
    });

    const client = new DataverseAdvancedClient(mockAuthProvider);
    const result = await client.queryWithPaging('contacts');

    expect(result.totalRetrieved).toBe(3);
    expect(result.pageCount).toBe(2);
    expect(result.records).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
