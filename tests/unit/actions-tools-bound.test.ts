import { handleActionTool } from "../../src/tools/actions.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

describe("Action tool handlers — dataverse_execute_bound_function", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      executeBoundFunction: jest.fn(),
      executeAction: jest.fn(),
      executeFunction: jest.fn(),
      executeBoundAction: jest.fn(),
      listDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it("throws Zod validation error when id is not a valid UUID", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_bound_function",
        {
          entitySetName: "accounts",
          id: "not-a-guid",
          functionName: "CalculateRollupField",
        },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("returns JSON result containing the function output on success", async () => {
    mockClient.executeBoundFunction!.mockResolvedValue({ Value: 12345 });

    const result = await handleActionTool(
      "dataverse_execute_bound_function",
      {
        entitySetName: "accounts",
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        functionName: "CalculateRollupField",
        parameters: { FieldName: "'revenue'" },
      },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as { Value: number };
    expect(parsed.Value).toBe(12345);
    expect(mockClient.executeBoundFunction).toHaveBeenCalledWith(
      "accounts",
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "CalculateRollupField",
      { FieldName: "'revenue'" },
    );
  });

  it("calls executeBoundFunction with empty params object when parameters is omitted", async () => {
    mockClient.executeBoundFunction!.mockResolvedValue({ ok: true });

    await handleActionTool(
      "dataverse_execute_bound_function",
      {
        entitySetName: "accounts",
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        functionName: "CalculateRollupField",
        // parameters intentionally omitted
      },
      dvClient(),
    );

    // Zod default for the optional record<string, string> is {}
    expect(mockClient.executeBoundFunction).toHaveBeenCalledWith(
      "accounts",
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "CalculateRollupField",
      {},
    );
  });

  it("throws Zod validation error when entitySetName is empty", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_bound_function",
        {
          entitySetName: "",
          id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          functionName: "CalculateRollupField",
        },
        dvClient(),
      ),
    ).rejects.toThrow();
  });
});
