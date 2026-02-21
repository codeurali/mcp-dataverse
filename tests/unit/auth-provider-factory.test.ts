jest.mock("@azure/msal-node", () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenByClientCredential: jest.fn(),
  })),
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    getAllAccounts: jest.fn().mockReturnValue([]),
    acquireTokenSilent: jest.fn(),
    acquireTokenByDeviceCode: jest.fn(),
  })),
}));

import { createAuthProvider } from "../../src/auth/auth-provider.factory.js";
import { PacAuthProvider } from "../../src/auth/pac-auth-provider.js";
import { MsalAuthProvider } from "../../src/auth/msal-auth-provider.js";
import type { Config } from "../../src/config/config.schema.js";

const BASE_CONFIG: Config = {
  environmentUrl: "https://myorg.crm.dynamics.com",
  authMode: "pac",
  pacProfileName: "default",
  requestTimeoutMs: 30000,
  maxRetries: 3,
};

describe("createAuthProvider (factory)", () => {
  it('returns a PacAuthProvider when authMode is "pac"', () => {
    const provider = createAuthProvider({ ...BASE_CONFIG, authMode: "pac" });
    expect(provider).toBeInstanceOf(PacAuthProvider);
  });

  it('returns a MsalAuthProvider when authMode is "msal"', () => {
    const provider = createAuthProvider({
      ...BASE_CONFIG,
      authMode: "msal",
      tenantId: "tid",
      clientId: "cid",
      clientSecret: "csecret",
    });
    expect(provider).toBeInstanceOf(MsalAuthProvider);
  });

  it("provider exposes correct environmentUrl", () => {
    const provider = createAuthProvider({ ...BASE_CONFIG, authMode: "pac" });
    expect(provider.environmentUrl).toBe("https://myorg.crm.dynamics.com");
  });
});
