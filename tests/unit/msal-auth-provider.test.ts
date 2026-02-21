import { ConfidentialClientApplication } from '@azure/msal-node';
import { MsalAuthProvider } from '../../src/auth/msal-auth-provider.js';
import type { Config } from '../../src/config/config.schema.js';

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenByClientCredential: jest.fn(),
  })),
}));

const MockedCCA = ConfidentialClientApplication as jest.MockedClass<typeof ConfidentialClientApplication>;

const BASE_CONFIG: Config = {
  environmentUrl: 'https://myorg.crm.dynamics.com',
  authMode: 'msal',
  pacProfileName: 'default',
  tenantId: 'tenant-id-abc',
  clientId: 'client-id-abc',
  clientSecret: 'client-secret-abc',
  requestTimeoutMs: 30000,
  maxRetries: 3,
};

describe('MsalAuthProvider', () => {
  let mockAcquire: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAcquire = jest.fn();
    MockedCCA.mockImplementation(() => ({
      acquireTokenByClientCredential: mockAcquire,
    } as unknown as ConfidentialClientApplication));
  });

  // ── constructor validation ─────────────────────────────────────────────────

  it('throws when tenantId is missing', () => {
    const cfg = { ...BASE_CONFIG, tenantId: undefined };
    expect(() => new MsalAuthProvider(cfg)).toThrow('tenantId');
  });

  it('throws when clientId is missing', () => {
    const cfg = { ...BASE_CONFIG, clientId: undefined };
    expect(() => new MsalAuthProvider(cfg)).toThrow('clientId');
  });

  it('throws when clientSecret is missing', () => {
    const cfg = { ...BASE_CONFIG, clientSecret: undefined };
    expect(() => new MsalAuthProvider(cfg)).toThrow('clientSecret');
  });

  // ── environmentUrl ────────────────────────────────────────────────────────

  it('exposes environmentUrl from config', () => {
    const provider = new MsalAuthProvider(BASE_CONFIG);
    expect(provider.environmentUrl).toBe('https://myorg.crm.dynamics.com');
  });

  // ── getToken – success ────────────────────────────────────────────────────

  it('returns accessToken on successful acquire', async () => {
    mockAcquire.mockResolvedValue({
      accessToken: 'token-abc',
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    const token = await provider.getToken();

    expect(token).toBe('token-abc');
    expect(mockAcquire).toHaveBeenCalledTimes(1);
  });

  // ── getToken – cache hit ──────────────────────────────────────────────────

  it('returns cached token on second call without re-acquiring', async () => {
    mockAcquire.mockResolvedValue({
      accessToken: 'cached-token',
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    const first = await provider.getToken();
    const second = await provider.getToken();

    expect(first).toBe('cached-token');
    expect(second).toBe('cached-token');
    expect(mockAcquire).toHaveBeenCalledTimes(1);
  });

  // ── getToken – null result ────────────────────────────────────────────────

  it('throws when acquireTokenByClientCredential returns null', async () => {
    mockAcquire.mockResolvedValue(null);

    const provider = new MsalAuthProvider(BASE_CONFIG);
    await expect(provider.getToken()).rejects.toThrow('no access token');
  });

  it('throws when acquireTokenByClientCredential returns result with empty accessToken', async () => {
    mockAcquire.mockResolvedValue({ accessToken: '', expiresOn: new Date(Date.now() + 3600000) });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    await expect(provider.getToken()).rejects.toThrow('no access token');
  });

  // ── invalidateToken ───────────────────────────────────────────────────────

  it('re-acquires token after invalidateToken()', async () => {
    mockAcquire.mockResolvedValue({
      accessToken: 'fresh-token',
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    await provider.getToken();
    provider.invalidateToken();
    await provider.getToken();

    expect(mockAcquire).toHaveBeenCalledTimes(2);
  });

  // ── isAuthenticated ───────────────────────────────────────────────────────

  it('returns true when getToken succeeds', async () => {
    mockAcquire.mockResolvedValue({
      accessToken: 'tok',
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    expect(await provider.isAuthenticated()).toBe(true);
  });

  it('returns false when getToken throws', async () => {
    mockAcquire.mockResolvedValue(null);

    const provider = new MsalAuthProvider(BASE_CONFIG);
    expect(await provider.isAuthenticated()).toBe(false);
  });

  // ── token expiry fallback ─────────────────────────────────────────────────

  it('uses fallback expiry when expiresOn is null', async () => {
    mockAcquire.mockResolvedValue({ accessToken: 'tok-fallback', expiresOn: null });

    const provider = new MsalAuthProvider(BASE_CONFIG);
    const token = await provider.getToken();
    expect(token).toBe('tok-fallback');
  });
});
