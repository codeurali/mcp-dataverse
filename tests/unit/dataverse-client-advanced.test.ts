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
import { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';
import type { AuthProvider } from '../../src/auth/auth-provider.interface.js';

const ENV_URL = 'https://myorg.crm.dynamics.com';

describe('DataverseAdvancedClient', () => {
  let mockGet: jest.Mock;
  let mockAuthProvider: AuthProvider;

  beforeEach(() => {
    mockGet = jest.fn();

    const mockHttp = {
      get: mockGet,
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      put: jest.fn(),
      defaultHeaders: {},
    };

    (HttpClient as unknown as jest.Mock).mockImplementation(() => mockHttp);

    mockAuthProvider = {
      environmentUrl: ENV_URL,
      getToken: jest.fn().mockResolvedValue('mock-token'),
      invalidateToken: jest.fn(),
      isAuthenticated: jest.fn().mockResolvedValue(true),
    };
  });

  // ── executeBoundFunction ──────────────────────────────────────────────────

  describe('executeBoundFunction', () => {
    it('calls GET with entity, record id, and function name (no params)', async () => {
      mockGet.mockResolvedValueOnce({ data: { result: 'ok' } });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.executeBoundFunction('accounts', 'acc-id', 'GetStatus');

      expect(result).toEqual({ result: 'ok' });
      expect(mockGet).toHaveBeenCalledWith('accounts(acc-id)/GetStatus()');
    });

    it('builds URL with function parameters correctly', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: 42 } });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      await client.executeBoundFunction('contacts', 'con-id', 'CalculateScore', {
        Type: 'full',
        Region: 'eu',
      });

      const calledUrl = mockGet.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('contacts(con-id)/CalculateScore(');
      expect(calledUrl).toContain("Type='full'");
      expect(calledUrl).toContain("Region='eu'");
    });
  });

  // ── getChangedRecords ─────────────────────────────────────────────────────

  describe('getChangedRecords', () => {
    it('initial sync (deltaToken=null): sends Prefer header and returns newAndModified with nextDeltaToken', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          value: [{ id: '1', name: 'Acc A' }, { id: '2', name: 'Acc B' }],
          '@odata.deltaLink': `${ENV_URL}/api/data/v9.2/accounts?$deltatoken=dt-init`,
        },
      });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.getChangedRecords('accounts', null);

      expect(result.newAndModified).toHaveLength(2);
      expect(result.deleted).toHaveLength(0);
      expect(result.nextDeltaToken).toBe('dt-init');

      const [url, options] = mockGet.mock.calls[0]! as [string, { headers?: Record<string, string> }];
      expect(url).toBe('accounts');
      expect(options.headers?.['Prefer']).toBe('odata.track-changes');
    });

    it('initial sync with select: appends $select to URL', async () => {
      mockGet.mockResolvedValueOnce({
        data: { value: [], '@odata.deltaLink': `${ENV_URL}/accounts?$deltatoken=dt-x` },
      });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      await client.getChangedRecords('accounts', null, ['name', 'accountid']);

      const [url] = mockGet.mock.calls[0]! as [string, unknown];
      expect(url).toBe('accounts?$select=name,accountid');
    });

    it('delta sync (deltaToken set): uses deltatoken URL without Prefer header', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          value: [{ id: '3', name: 'Updated' }],
          '@odata.deltaLink': `${ENV_URL}/api/data/v9.2/accounts?$deltatoken=dt-next`,
        },
      });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.getChangedRecords('accounts', 'dt-prev');

      expect(result.newAndModified).toHaveLength(1);
      expect(result.nextDeltaToken).toBe('dt-next');

      const [url, options] = mockGet.mock.calls[0]! as [string, { headers?: Record<string, string> }];
      expect(url).toContain('$deltatoken=dt-prev');
      expect(options.headers?.['Prefer']).toBeUndefined();
    });

    it('detects deleted records via @removed annotation', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          value: [
            { id: '1', name: 'Active' },
            { '@removed': { reason: 'deleted' }, '@id': `${ENV_URL}/api/data/v9.2/accounts(del-guid-123)` },
          ],
          '@odata.deltaLink': `${ENV_URL}/accounts?$deltatoken=dt-d`,
        },
      });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.getChangedRecords('accounts', 'dt-prev');

      expect(result.newAndModified).toHaveLength(1);
      expect(result.deleted).toHaveLength(1);
      expect(result.deleted[0]!.id).toBe('del-guid-123');
    });

    it('returns nextDeltaToken=null when no deltaLink in response', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: [] } });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.getChangedRecords('accounts', 'dt-prev');

      expect(result.nextDeltaToken).toBeNull();
    });

    it('delta sync with select: appends $select to delta URL', async () => {
      mockGet.mockResolvedValueOnce({ data: { value: [], '@odata.deltaLink': '' } });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      await client.getChangedRecords('contacts', 'dt-abc', ['firstname', 'lastname']);

      const [url] = mockGet.mock.calls[0]! as [string, unknown];
      expect(url).toContain('$deltatoken=dt-abc');
      expect(url).toContain('$select=firstname,lastname');
    });

    it('handles empty delta response with no value array', async () => {
      mockGet.mockResolvedValueOnce({
        data: { '@odata.deltaLink': `${ENV_URL}/accounts?$deltatoken=dt-empty` },
      });

      const client = new DataverseAdvancedClient(mockAuthProvider);
      const result = await client.getChangedRecords('accounts', 'dt-prev');

      expect(result.newAndModified).toHaveLength(0);
      expect(result.deleted).toHaveLength(0);
      expect(result.nextDeltaToken).toBe('dt-empty');
    });
  });
});
