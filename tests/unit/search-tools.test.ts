import { handleSearchTool, searchTools } from "../../src/tools/search.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

describe("search tool definitions", () => {
  it("exports dataverse_search", () => {
    expect(searchTools.map((t) => t.name)).toContain("dataverse_search");
  });
});

function buildClient(executeActionMock: jest.Mock): DataverseAdvancedClient {
  return {
    executeAction: executeActionMock,
  } as unknown as DataverseAdvancedClient;
}

describe("dataverse_search", () => {
  const sampleResponse = {
    totalrecordcount: 2,
    value: [
      {
        entityname: "account",
        objectid: "acc-001",
        score: 0.97,
        highlights: { name: ["<em>Contoso</em>"] },
        attributes: { name: "Contoso Ltd" },
      },
      {
        entityname: "contact",
        objectid: "con-001",
        score: 0.82,
        highlights: {},
        attributes: { fullname: "John Contoso" },
      },
    ],
  };

  it("calls executeAction with relative search URL", async () => {
    const mock = jest.fn().mockResolvedValue(sampleResponse);
    await handleSearchTool(
      "dataverse_search",
      { query: "Contoso" },
      buildClient(mock),
    );
    expect(mock).toHaveBeenCalledWith(
      "../../search/v1.0/query",
      expect.objectContaining({ search: "Contoso" }),
    );
  });

  it("returns mapped results with correct shape", async () => {
    const mock = jest.fn().mockResolvedValue(sampleResponse);
    const result = await handleSearchTool(
      "dataverse_search",
      { query: "Contoso" },
      buildClient(mock),
    );
    const parsed = JSON.parse(result.content[0]!.text) as {
      totalRecordCount: number;
      results: Array<{ entityName: string; objectId: string; score: number }>;
    };
    expect(parsed.totalRecordCount).toBe(2);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0]!.entityName).toBe("account");
    expect(parsed.results[0]!.objectId).toBe("acc-001");
    expect(parsed.results[0]!.score).toBe(0.97);
  });

  it("passes entities array when provided", async () => {
    const mock = jest
      .fn()
      .mockResolvedValue({ totalrecordcount: 0, value: [] });
    await handleSearchTool(
      "dataverse_search",
      { query: "test", entities: ["account", "contact"] },
      buildClient(mock),
    );
    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect(body.entities).toEqual(["account", "contact"]);
  });

  it("does not include entities key when not provided", async () => {
    const mock = jest
      .fn()
      .mockResolvedValue({ totalrecordcount: 0, value: [] });
    await handleSearchTool(
      "dataverse_search",
      { query: "test" },
      buildClient(mock),
    );
    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("entities");
  });

  it("passes searchMode and top", async () => {
    const mock = jest
      .fn()
      .mockResolvedValue({ totalrecordcount: 0, value: [] });
    await handleSearchTool(
      "dataverse_search",
      { query: "test", searchMode: "all", top: 25 },
      buildClient(mock),
    );
    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect(body.searchMode).toBe("all");
    expect(body.top).toBe(25);
  });

  it("defaults top to 10 and searchMode to any", async () => {
    const mock = jest
      .fn()
      .mockResolvedValue({ totalrecordcount: 0, value: [] });
    await handleSearchTool(
      "dataverse_search",
      { query: "test" },
      buildClient(mock),
    );
    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect(body.top).toBe(10);
    expect(body.searchMode).toBe("any");
  });

  it("rejects top > 50", async () => {
    const mock = jest.fn();
    await expect(
      handleSearchTool(
        "dataverse_search",
        { query: "test", top: 100 },
        buildClient(mock),
      ),
    ).rejects.toThrow();
  });

  it("rejects empty query", async () => {
    const mock = jest.fn();
    await expect(
      handleSearchTool("dataverse_search", { query: "" }, buildClient(mock)),
    ).rejects.toThrow();
  });

  it("returns clear error when Relevance Search is not enabled (404)", async () => {
    const mock = jest
      .fn()
      .mockRejectedValue(new Error("Request failed with status 404"));
    const result = await handleSearchTool(
      "dataverse_search",
      { query: "test" },
      buildClient(mock),
    );
    const parsed = JSON.parse(result.content[0]!.text) as {
      isError: boolean;
      error: string;
    };
    expect(parsed.isError).toBe(true);
    expect(parsed.error).toContain("Relevance Search is not enabled");
  });

  it("rethrows non-404 errors", async () => {
    const mock = jest
      .fn()
      .mockRejectedValue(new Error("Request failed with status 500"));
    await expect(
      handleSearchTool(
        "dataverse_search",
        { query: "test" },
        buildClient(mock),
      ),
    ).rejects.toThrow("500");
  });

  it("includes returntotalrecordcount in body", async () => {
    const mock = jest
      .fn()
      .mockResolvedValue({ totalrecordcount: 0, value: [] });
    await handleSearchTool(
      "dataverse_search",
      { query: "test" },
      buildClient(mock),
    );
    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect(body.returntotalrecordcount).toBe(true);
  });
});

describe("handleSearchTool unknown", () => {
  it("throws on unknown tool name", async () => {
    const mock = jest.fn();
    await expect(
      handleSearchTool("dataverse_unknown", {}, buildClient(mock)),
    ).rejects.toThrow("Unknown search tool");
  });
});
