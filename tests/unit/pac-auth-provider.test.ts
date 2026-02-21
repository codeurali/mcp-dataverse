import { PublicClientApplication } from "@azure/msal-node";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { PacAuthProvider } from "../../src/auth/pac-auth-provider.js";

// ── Mock @azure/msal-node so no real MSAL/network calls are made ──────────
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("@azure/msal-node", () => ({
  PublicClientApplication: jest.fn(),
}));

const MockedPCA = PublicClientApplication as jest.MockedClass<
  typeof PublicClientApplication
>;

// ── Minimal account stub matching AccountInfo shape ───────────────────────
const MOCK_ACCOUNT = {
  homeAccountId: "home-acc-id",
  localAccountId: "local-acc-id",
  environment: "login.microsoftonline.com",
  tenantId: "tenant-id",
  username: "user@test.com",
};

describe("PacAuthProvider (MSAL)", () => {
  const ENV_URL = "https://myorg.crm.dynamics.com";

  let mockGetAllAccounts: jest.Mock;
  let mockAcquireTokenSilent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllAccounts = jest.fn();
    mockAcquireTokenSilent = jest.fn();

    MockedPCA.mockImplementation(
      () =>
        ({
          getAllAccounts: mockGetAllAccounts,
          acquireTokenSilent: mockAcquireTokenSilent,
          acquireTokenByDeviceCode: jest.fn(),
        }) as unknown as PublicClientApplication,
    );
  });

  // ── environmentUrl ────────────────────────────────────────────────────────

  it("should expose environmentUrl", () => {
    const provider = new PacAuthProvider(ENV_URL);
    expect(provider.environmentUrl).toBe(ENV_URL);
  });

  it("should strip trailing slash from environmentUrl", () => {
    const provider = new PacAuthProvider(`${ENV_URL}/`);
    expect(provider.environmentUrl).toBe(ENV_URL);
  });

  // ── getToken – success ────────────────────────────────────────────────────

  it("should return access token when account is found and silent auth succeeds", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue({
      accessToken: "token-xyz",
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new PacAuthProvider(ENV_URL);
    const token = await provider.getToken();

    expect(token).toBe("token-xyz");
    expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1);
  });

  // ── getToken – in-memory cache ────────────────────────────────────────────

  it("should return cached token on second call without re-acquiring", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue({
      accessToken: "cached-token",
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new PacAuthProvider(ENV_URL);
    const first = await provider.getToken();
    const second = await provider.getToken();

    expect(first).toBe("cached-token");
    expect(second).toBe("cached-token");
    expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1);
  });

  // ── invalidateToken ───────────────────────────────────────────────────────

  it("should re-acquire token after invalidateToken()", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue({
      accessToken: "fresh-token",
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new PacAuthProvider(ENV_URL);
    await provider.getToken();
    provider.invalidateToken();
    await provider.getToken();

    expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(2);
  });

  // ── getToken – no accounts ────────────────────────────────────────────────

  it("should throw with clear message when no MSAL accounts are found", async () => {
    mockGetAllAccounts.mockReturnValue([]);

    const provider = new PacAuthProvider(ENV_URL);
    await expect(provider.getToken()).rejects.toThrow(
      "No authenticated account found",
    );
  });

  // ── getToken – empty token result (lines 104-105) ────────────────────────

  it("should throw when acquireTokenSilent returns empty accessToken", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue({
      accessToken: "",
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new PacAuthProvider(ENV_URL);
    await expect(provider.getToken()).rejects.toThrow("Token refresh failed");
  });

  it("should throw when acquireTokenSilent returns null", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue(null);

    const provider = new PacAuthProvider(ENV_URL);
    await expect(provider.getToken()).rejects.toThrow("Token refresh failed");
  });

  // ── getToken – acquireTokenSilent throws (lines 110-116) ────────────────

  it("should throw with re-authenticate message when acquireTokenSilent throws", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockRejectedValue(new Error("interaction_required"));

    const provider = new PacAuthProvider(ENV_URL);
    await expect(provider.getToken()).rejects.toThrow("Token refresh failed");
  });

  // ── isAuthenticated (lines 62-68) ─────────────────────────────────────

  it("isAuthenticated returns true when getToken succeeds", async () => {
    mockGetAllAccounts.mockReturnValue([MOCK_ACCOUNT]);
    mockAcquireTokenSilent.mockResolvedValue({
      accessToken: "token-abc",
      expiresOn: new Date(Date.now() + 3_600_000),
    });

    const provider = new PacAuthProvider(ENV_URL);
    expect(await provider.isAuthenticated()).toBe(true);
  });

  it("isAuthenticated returns false when getToken throws", async () => {
    mockGetAllAccounts.mockReturnValue([]);

    const provider = new PacAuthProvider(ENV_URL);
    expect(await provider.isAuthenticated()).toBe(false);
  });

  // ── setupViaDeviceCode (lines 75-84) ────────────────────────────────

  it("setupViaDeviceCode acquires token and caches it", async () => {
    const mockAcquireByDeviceCode = jest.fn().mockResolvedValue({
      accessToken: "device-token",
      expiresOn: new Date(Date.now() + 3_600_000),
    });
    MockedPCA.mockImplementation(
      () =>
        ({
          getAllAccounts: mockGetAllAccounts,
          acquireTokenSilent: mockAcquireTokenSilent,
          acquireTokenByDeviceCode: mockAcquireByDeviceCode,
        }) as unknown as PublicClientApplication,
    );

    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const provider = new PacAuthProvider(ENV_URL);
    await provider.setupViaDeviceCode();

    expect(mockAcquireByDeviceCode).toHaveBeenCalled();
    // Verify the deviceCodeCallback writes to stderr
    const callArg = mockAcquireByDeviceCode.mock.calls[0]![0] as {
      deviceCodeCallback: (r: { message: string }) => void;
    };
    callArg.deviceCodeCallback({ message: "Use code XYZ" });
    expect(stderrSpy).toHaveBeenCalledWith("\nUse code XYZ\n");
    stderrSpy.mockRestore();
  });

  it("setupViaDeviceCode does not throw when acquireTokenByDeviceCode returns null", async () => {
    const mockAcquireByDeviceCode = jest.fn().mockResolvedValue(null);
    MockedPCA.mockImplementation(
      () =>
        ({
          getAllAccounts: mockGetAllAccounts,
          acquireTokenSilent: mockAcquireTokenSilent,
          acquireTokenByDeviceCode: mockAcquireByDeviceCode,
        }) as unknown as PublicClientApplication,
    );

    const provider = new PacAuthProvider(ENV_URL);
    await expect(provider.setupViaDeviceCode()).resolves.toBeUndefined();
  });

  // ── createCachePlugin (lines 18-25) ──────────────────────────────────

  it("beforeCacheAccess deserializes cache file when it exists", async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue('{"Account":{}}');

    new PacAuthProvider(ENV_URL);

    const ctorArg = MockedPCA.mock.calls[0]![0] as {
      cache: {
        cachePlugin: { beforeCacheAccess: (ctx: unknown) => Promise<void> };
      };
    };
    const tokenCacheMock = { deserialize: jest.fn(), serialize: jest.fn() };
    await ctorArg.cache.cachePlugin.beforeCacheAccess({
      tokenCache: tokenCacheMock,
    });

    expect(tokenCacheMock.deserialize).toHaveBeenCalledWith('{"Account":{}}');
  });

  it("beforeCacheAccess skips deserialization when cache file does not exist", async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    new PacAuthProvider(ENV_URL);

    const ctorArg = MockedPCA.mock.calls[0]![0] as {
      cache: {
        cachePlugin: { beforeCacheAccess: (ctx: unknown) => Promise<void> };
      };
    };
    const tokenCacheMock = { deserialize: jest.fn(), serialize: jest.fn() };
    await ctorArg.cache.cachePlugin.beforeCacheAccess({
      tokenCache: tokenCacheMock,
    });

    expect(tokenCacheMock.deserialize).not.toHaveBeenCalled();
  });

  it("afterCacheAccess writes serialized cache when cacheHasChanged is true", async () => {
    new PacAuthProvider(ENV_URL);

    const ctorArg = MockedPCA.mock.calls[0]![0] as {
      cache: {
        cachePlugin: { afterCacheAccess: (ctx: unknown) => Promise<void> };
      };
    };
    const tokenCacheMock = {
      deserialize: jest.fn(),
      serialize: jest.fn().mockReturnValue('{"serialized":true}'),
    };
    await ctorArg.cache.cachePlugin.afterCacheAccess({
      tokenCache: tokenCacheMock,
      cacheHasChanged: true,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".msal-cache.json"),
      expect.stringMatching(/"v":1.*"iv":.*"tag":.*"d":/s),
      { encoding: "utf-8", mode: 0o600 },
    );
  });

  it("afterCacheAccess does not write when cacheHasChanged is false", async () => {
    new PacAuthProvider(ENV_URL);

    const ctorArg = MockedPCA.mock.calls[0]![0] as {
      cache: {
        cachePlugin: { afterCacheAccess: (ctx: unknown) => Promise<void> };
      };
    };
    const tokenCacheMock = { deserialize: jest.fn(), serialize: jest.fn() };
    await ctorArg.cache.cachePlugin.afterCacheAccess({
      tokenCache: tokenCacheMock,
      cacheHasChanged: false,
    });

    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
