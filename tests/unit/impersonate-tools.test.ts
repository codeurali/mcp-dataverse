import { handleImpersonateTool } from "../../src/tools/impersonate.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

describe("handleImpersonateTool", () => {
  const VALID_UUID = "00000000-0000-0000-0000-000000000001";

  let mockHeaders: Record<string, string>;
  let mockClient: DataverseAdvancedClient;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockHeaders = {};
    mockClient = {
      http: {
        defaultHeaders: mockHeaders,
      },
      // Security guard passes when query returns no sysadmin roles
      query: jest.fn().mockResolvedValue({ value: [] }),
    } as unknown as DataverseAdvancedClient;

    mockDispatch = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ result: "ok" }) }],
    });
  });

  // ── happy path ─────────────────────────────────────────────────────────────

  it("injects MSCRMCallerId during dispatch and removes it afterwards", async () => {
    let headerDuringDispatch: string | undefined;
    mockDispatch.mockImplementation(async () => {
      headerDuringDispatch = mockHeaders["MSCRMCallerId"];
      return {
        content: [{ type: "text", text: JSON.stringify({ result: "ok" }) }],
      };
    });

    await handleImpersonateTool(
      "dataverse_impersonate",
      {
        callerId: VALID_UUID,
        toolName: "dataverse_query",
        toolArgs: { entitySetName: "accounts" },
      },
      mockClient,
      mockDispatch,
    );

    expect(headerDuringDispatch).toBe(VALID_UUID);
    expect(mockHeaders["MSCRMCallerId"]).toBeUndefined();
  });

  it("calls dispatch with the correct toolName and toolArgs", async () => {
    await handleImpersonateTool(
      "dataverse_impersonate",
      {
        callerId: VALID_UUID,
        toolName: "dataverse_create",
        toolArgs: { entitySetName: "contacts", data: { firstname: "Jane" } },
      },
      mockClient,
      mockDispatch,
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      "dataverse_create",
      { entitySetName: "contacts", data: { firstname: "Jane" } },
      mockClient,
    );
  });

  it("wraps the result with impersonatedAs metadata", async () => {
    const result = await handleImpersonateTool(
      "dataverse_impersonate",
      {
        callerId: VALID_UUID,
        toolName: "dataverse_query",
        toolArgs: { entitySetName: "accounts" },
      },
      mockClient,
      mockDispatch,
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      impersonatedAs: string;
      tool: string;
      result: unknown;
    };
    expect(parsed.impersonatedAs).toBe(VALID_UUID);
    expect(parsed.tool).toBe("dataverse_query");
    expect(parsed.result).toEqual({ result: "ok" });
  });

  it("restores a pre-existing MSCRMCallerId after dispatch", async () => {
    mockHeaders["MSCRMCallerId"] = "existing-caller-id";

    await handleImpersonateTool(
      "dataverse_impersonate",
      { callerId: VALID_UUID, toolName: "dataverse_query", toolArgs: {} },
      mockClient,
      mockDispatch,
    );

    expect(mockHeaders["MSCRMCallerId"]).toBe("existing-caller-id");
  });

  it("removes MSCRMCallerId in finally even when dispatch throws", async () => {
    mockDispatch.mockRejectedValue(new Error("dispatch error"));

    await expect(
      handleImpersonateTool(
        "dataverse_impersonate",
        { callerId: VALID_UUID, toolName: "dataverse_query", toolArgs: {} },
        mockClient,
        mockDispatch,
      ),
    ).rejects.toThrow("dispatch error");

    expect(mockHeaders["MSCRMCallerId"]).toBeUndefined();
  });

  // ── validation errors ───────────────────────────────────────────────────────

  it("throws ZodError when callerId is not a UUID", async () => {
    await expect(
      handleImpersonateTool(
        "dataverse_impersonate",
        { callerId: "not-a-uuid", toolName: "dataverse_query", toolArgs: {} },
        mockClient,
        mockDispatch,
      ),
    ).rejects.toThrow();

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("throws ZodError when toolName is an empty string", async () => {
    await expect(
      handleImpersonateTool(
        "dataverse_impersonate",
        { callerId: VALID_UUID, toolName: "", toolArgs: {} },
        mockClient,
        mockDispatch,
      ),
    ).rejects.toThrow();

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  // ── routing guard ───────────────────────────────────────────────────────────

  it("throws on unknown impersonate tool name", async () => {
    await expect(
      handleImpersonateTool("dataverse_unknown", {}, mockClient, mockDispatch),
    ).rejects.toThrow("Unknown impersonate tool: dataverse_unknown");
  });
});
