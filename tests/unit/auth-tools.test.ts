import { handleAuthTool } from "../../src/tools/auth.tools.js";
import type { DataverseClient } from "../../src/dataverse/dataverse-client.js";

describe("Auth tool handlers — dataverse_whoami", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      whoAmI: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseClient;

  // ── happy path ─────────────────────────────────────────────────────────────

  it("returns formatted WhoAmI response on success", async () => {
    mockClient.whoAmI!.mockResolvedValue({
      UserId: "00000000-0000-0000-0000-000000000001",
      BusinessUnitId: "00000000-0000-0000-0000-000000000002",
      OrganizationId: "00000000-0000-0000-0000-000000000003",
      OrganizationName: "TestOrg",
      EnvironmentUrl: "https://testorg.crm.dynamics.com",
    });

    const result = await handleAuthTool("dataverse_whoami", {}, dvClient());

    const parsed = JSON.parse(result.content[0]!.text) as {
      userId: string;
      businessUnitId: string;
      organizationId: string;
      organizationName: string;
      environmentUrl: string;
    };
    expect(parsed.userId).toBe("00000000-0000-0000-0000-000000000001");
    expect(parsed.businessUnitId).toBe("00000000-0000-0000-0000-000000000002");
    expect(parsed.organizationId).toBe("00000000-0000-0000-0000-000000000003");
    expect(parsed.organizationName).toBe("TestOrg");
    expect(parsed.environmentUrl).toBe("https://testorg.crm.dynamics.com");
    expect(mockClient.whoAmI).toHaveBeenCalledTimes(1);
  });

  it("maps WhoAmI response fields from PascalCase to camelCase", async () => {
    mockClient.whoAmI!.mockResolvedValue({
      UserId: "uid",
      BusinessUnitId: "buid",
      OrganizationId: "oid",
      OrganizationName: "OrgName",
      EnvironmentUrl: "https://org.crm.dynamics.com",
    });

    const result = await handleAuthTool(
      "dataverse_whoami",
      undefined,
      dvClient(),
    );
    const parsed = JSON.parse(result.content[0]!.text) as Record<
      string,
      unknown
    >;

    // Should have camelCase keys, NOT PascalCase
    expect(parsed).toHaveProperty("userId");
    expect(parsed).toHaveProperty("businessUnitId");
    expect(parsed).toHaveProperty("organizationId");
    expect(parsed).toHaveProperty("organizationName");
    expect(parsed).toHaveProperty("environmentUrl");
    expect(parsed).not.toHaveProperty("UserId");
  });

  // ── error propagation ──────────────────────────────────────────────────────

  it("propagates error when client.whoAmI rejects", async () => {
    mockClient.whoAmI!.mockRejectedValue(
      new Error("Authentication failed: invalid token"),
    );

    await expect(
      handleAuthTool("dataverse_whoami", {}, dvClient()),
    ).rejects.toThrow("Authentication failed: invalid token");
  });

  it("propagates network error from client", async () => {
    mockClient.whoAmI!.mockRejectedValue(new Error("Network Error"));

    await expect(
      handleAuthTool("dataverse_whoami", {}, dvClient()),
    ).rejects.toThrow("Network Error");
  });

  // ── routing guard ──────────────────────────────────────────────────────────

  it("throws on unknown auth tool name", async () => {
    await expect(
      handleAuthTool("dataverse_unknown", {}, dvClient()),
    ).rejects.toThrow("Unknown auth tool: dataverse_unknown");
  });
});
