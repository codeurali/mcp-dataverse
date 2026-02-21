import { handleBatchTool } from "../../src/tools/batch.tools.js";
import type { DataverseBatchClient } from "../../src/dataverse/dataverse-client.batch.js";

describe("handleBatchTool", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      batchExecute: jest.fn(),
    };
  });

  const client = () => mockClient as unknown as DataverseBatchClient;

  // ── dataverse_batch_execute – success ─────────────────────────────────────

  it("returns JSON with results and count on success", async () => {
    const batchResults = [{ status: 200, body: { value: [] } }];
    mockClient.batchExecute!.mockResolvedValue(batchResults);

    const result = await handleBatchTool(
      "dataverse_batch_execute",
      { requests: [{ method: "GET", url: "/accounts" }] },
      client(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      results: typeof batchResults;
      count: number;
    };
    expect(parsed.count).toBe(1);
    expect(parsed.results).toEqual(batchResults);
    expect(mockClient.batchExecute).toHaveBeenCalledWith(
      [{ method: "GET", url: "/accounts", body: undefined }],
      false,
    );
  });

  it("passes body in batch request when provided", async () => {
    mockClient.batchExecute!.mockResolvedValue([{ status: 204 }]);

    await handleBatchTool(
      "dataverse_batch_execute",
      {
        requests: [
          {
            method: "POST",
            url: "/contacts",
            body: { firstname: "Test", lastname: "User" },
          },
        ],
      },
      client(),
    );

    expect(mockClient.batchExecute).toHaveBeenCalledWith(
      [
        {
          method: "POST",
          url: "/contacts",
          body: { firstname: "Test", lastname: "User" },
        },
      ],
      false,
    );
  });

  it("handles multiple requests in one batch", async () => {
    mockClient.batchExecute!.mockResolvedValue([
      { status: 200 },
      { status: 204 },
    ]);

    const result = await handleBatchTool(
      "dataverse_batch_execute",
      {
        requests: [
          { method: "GET", url: "/accounts" },
          {
            method: "DELETE",
            url: "/contacts(00000000-0000-0000-0000-000000000001)",
          },
        ],
      },
      client(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as { count: number };
    expect(parsed.count).toBe(2);
  });

  // ── validation errors ─────────────────────────────────────────────────────

  it("throws ZodError when requests array is empty", async () => {
    await expect(
      handleBatchTool("dataverse_batch_execute", { requests: [] }, client()),
    ).rejects.toThrow();

    expect(mockClient.batchExecute).not.toHaveBeenCalled();
  });

  it("throws ZodError when requests array has more than 1000 items", async () => {
    const tooMany = Array.from({ length: 1001 }, (_, i) => ({
      method: "GET" as const,
      url: `/accounts(${i})`,
    }));

    await expect(
      handleBatchTool(
        "dataverse_batch_execute",
        { requests: tooMany },
        client(),
      ),
    ).rejects.toThrow();

    expect(mockClient.batchExecute).not.toHaveBeenCalled();
  });

  it("throws ZodError when method is not a valid HTTP verb", async () => {
    await expect(
      handleBatchTool(
        "dataverse_batch_execute",
        { requests: [{ method: "PUT", url: "/accounts" }] },
        client(),
      ),
    ).rejects.toThrow();

    expect(mockClient.batchExecute).not.toHaveBeenCalled();
  });

  it("throws ZodError when url is empty string", async () => {
    await expect(
      handleBatchTool(
        "dataverse_batch_execute",
        { requests: [{ method: "GET", url: "" }] },
        client(),
      ),
    ).rejects.toThrow();
  });

  it("passes useChangeset=true to batchExecute", async () => {
    mockClient.batchExecute!.mockResolvedValue([
      { status: 204 },
      { status: 204 },
    ]);

    await handleBatchTool(
      "dataverse_batch_execute",
      {
        requests: [
          {
            method: "PATCH",
            url: "accounts(00000000-0000-0000-0000-000000000001)",
            body: { name: "A" },
          },
          {
            method: "PATCH",
            url: "accounts(00000000-0000-0000-0000-000000000002)",
            body: { name: "B" },
          },
        ],
        useChangeset: true,
      },
      client(),
    );

    expect(mockClient.batchExecute).toHaveBeenCalledWith(
      [
        {
          method: "PATCH",
          url: "accounts(00000000-0000-0000-0000-000000000001)",
          body: { name: "A" },
        },
        {
          method: "PATCH",
          url: "accounts(00000000-0000-0000-0000-000000000002)",
          body: { name: "B" },
        },
      ],
      true,
    );
  });

  it("101 items are now valid (below the new 1000 limit)", async () => {
    mockClient.batchExecute!.mockResolvedValue(
      Array.from({ length: 101 }, () => ({ status: 200 })),
    );

    const requests = Array.from({ length: 101 }, (_, i) => ({
      method: "GET" as const,
      url: `accounts(${i})`,
    }));

    const result = await handleBatchTool(
      "dataverse_batch_execute",
      { requests },
      client(),
    );
    const parsed = JSON.parse(result.content[0]!.text) as { count: number };
    expect(parsed.count).toBe(101);
  });

  it("throws ZodError when requests property is missing", async () => {
    await expect(
      handleBatchTool("dataverse_batch_execute", {}, client()),
    ).rejects.toThrow();
  });

  // ── client error propagation ──────────────────────────────────────────────

  it("propagates error thrown by client.batchExecute", async () => {
    mockClient.batchExecute!.mockRejectedValue(
      new Error("Dataverse batch failed"),
    );

    await expect(
      handleBatchTool(
        "dataverse_batch_execute",
        { requests: [{ method: "GET", url: "/accounts" }] },
        client(),
      ),
    ).rejects.toThrow("Dataverse batch failed");
  });

  // ── unknown tool ──────────────────────────────────────────────────────────

  it("throws on unknown batch tool name", async () => {
    await expect(
      handleBatchTool("dataverse_unknown", {}, client()),
    ).rejects.toThrow("Unknown batch tool");
  });
});
