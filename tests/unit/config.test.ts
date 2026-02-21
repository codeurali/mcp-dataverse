jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

import { existsSync, readFileSync } from "fs";
import { ConfigSchema } from "../../src/config/config.schema.js";
import { loadConfig } from "../../src/config/config.loader.js";

describe("ConfigSchema", () => {
  it("should accept valid pac config", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "https://myorg.crm.dynamics.com",
      authMode: "pac",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "not-a-url",
      authMode: "pac",
    });
    expect(result.success).toBe(false);
  });

  it("should use default values", () => {
    const result = ConfigSchema.parse({
      environmentUrl: "https://myorg.crm.dynamics.com",
    });
    expect(result.authMode).toBe("pac");
    expect(result.maxRetries).toBe(3);
    expect(result.requestTimeoutMs).toBe(30000);
  });

  it("should reject invalid authMode", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "https://myorg.crm.dynamics.com",
      authMode: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept msal authMode with optional fields", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "https://myorg.crm.dynamics.com",
      authMode: "msal",
      tenantId: "tenant-id",
      clientId: "client-id",
    });
    expect(result.success).toBe(true);
  });

  it("should reject maxRetries above 10", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "https://myorg.crm.dynamics.com",
      maxRetries: 11,
    });
    expect(result.success).toBe(false);
  });

  it("should accept pacProfileName override", () => {
    const result = ConfigSchema.parse({
      environmentUrl: "https://myorg.crm.dynamics.com",
      pacProfileName: "myprofile",
    });
    expect(result.pacProfileName).toBe("myprofile");
  });

  it("should reject http:// URL (HTTPS is required)", () => {
    const result = ConfigSchema.safeParse({
      environmentUrl: "http://myorg.crm.dynamics.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("loadConfig", () => {
  beforeEach(() => {
    (existsSync as jest.Mock).mockReturnValue(false);
    (readFileSync as jest.Mock).mockReset();
    delete process.env["DATAVERSE_ENV_URL"];
    delete process.env["AUTH_MODE"];
    delete process.env["PAC_PROFILE_NAME"];
    delete process.env["TENANT_ID"];
    delete process.env["CLIENT_ID"];
    delete process.env["REQUEST_TIMEOUT_MS"];
    delete process.env["MAX_RETRIES"];
  });

  afterEach(() => {
    delete process.env["DATAVERSE_ENV_URL"];
    delete process.env["AUTH_MODE"];
    delete process.env["PAC_PROFILE_NAME"];
    delete process.env["TENANT_ID"];
    delete process.env["CLIENT_ID"];
    delete process.env["REQUEST_TIMEOUT_MS"];
    delete process.env["MAX_RETRIES"];
  });

  it("should use DATAVERSE_ENV_URL env var when no config file", () => {
    process.env["DATAVERSE_ENV_URL"] = "https://envtest.crm.dynamics.com";
    const config = loadConfig();
    expect(config.environmentUrl).toBe("https://envtest.crm.dynamics.com");
  });

  it("should use AUTH_MODE env var override", () => {
    process.env["DATAVERSE_ENV_URL"] = "https://envtest.crm.dynamics.com";
    process.env["AUTH_MODE"] = "msal";
    const config = loadConfig();
    expect(config.authMode).toBe("msal");
  });

  it("should throw Invalid configuration when no env url and no file", () => {
    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  // ── config.json file reading (lines 14-20) ──────────────────────────────

  it("should read config from config.json when file exists", () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        environmentUrl: "https://fromfile.crm.dynamics.com",
        authMode: "pac",
      }),
    );
    const config = loadConfig();
    expect(config.environmentUrl).toBe("https://fromfile.crm.dynamics.com");
    expect(config.authMode).toBe("pac");
  });

  it("should throw with clear message when config.json has invalid JSON", () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue("{invalid json}");
    expect(() => loadConfig()).toThrow("Invalid JSON in config.json");
  });

  // ── env var overrides (lines 30-46) ─────────────────────────────────────

  it("should apply PAC_PROFILE_NAME env var override", () => {
    process.env["DATAVERSE_ENV_URL"] = "https://envtest.crm.dynamics.com";
    process.env["PAC_PROFILE_NAME"] = "myprofile";
    const config = loadConfig();
    expect(config.pacProfileName).toBe("myprofile");
  });

  it("should apply TENANT_ID and CLIENT_ID env var overrides", () => {
    process.env["DATAVERSE_ENV_URL"] = "https://envtest.crm.dynamics.com";
    process.env["TENANT_ID"] = "my-tenant";
    process.env["CLIENT_ID"] = "my-client";
    const config = loadConfig();
    expect(config.tenantId).toBe("my-tenant");
    expect(config.clientId).toBe("my-client");
  });

  it("should apply REQUEST_TIMEOUT_MS and MAX_RETRIES env var overrides", () => {
    process.env["DATAVERSE_ENV_URL"] = "https://envtest.crm.dynamics.com";
    process.env["REQUEST_TIMEOUT_MS"] = "5000";
    process.env["MAX_RETRIES"] = "5";
    const config = loadConfig();
    expect(config.requestTimeoutMs).toBe(5000);
    expect(config.maxRetries).toBe(5);
  });
});
