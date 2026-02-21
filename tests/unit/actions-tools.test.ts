import { handleActionTool } from "../../src/tools/actions.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("Action tool handlers — dataverse_execute_action", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      executeAction: jest.fn(),
      executeFunction: jest.fn(),
      executeBoundAction: jest.fn(),
      executeBoundFunction: jest.fn(),
      listDependencies: jest.fn(),
      listTableDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  // ── happy path ─────────────────────────────────────────────────────────────

  it("calls executeAction and returns JSON result on success", async () => {
    mockClient.executeAction!.mockResolvedValue({ OpportunityId: "opp-123" });

    const result = await handleActionTool(
      "dataverse_execute_action",
      { actionName: "WinOpportunity", parameters: { Status: 3 } },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      OpportunityId: string;
    };
    expect(parsed.OpportunityId).toBe("opp-123");
    expect(mockClient.executeAction).toHaveBeenCalledWith("WinOpportunity", {
      Status: 3,
    });
  });

  it("defaults parameters to empty object when omitted", async () => {
    mockClient.executeAction!.mockResolvedValue({ success: true });

    await handleActionTool(
      "dataverse_execute_action",
      { actionName: "MyAction" },
      dvClient(),
    );

    expect(mockClient.executeAction).toHaveBeenCalledWith("MyAction", {});
  });

  // ── input validation ───────────────────────────────────────────────────────

  it("throws ZodError when actionName is empty string", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_action",
        { actionName: "" },
        dvClient(),
      ),
    ).rejects.toThrow();

    expect(mockClient.executeAction).not.toHaveBeenCalled();
  });

  it("throws ZodError when actionName is missing", async () => {
    await expect(
      handleActionTool("dataverse_execute_action", {}, dvClient()),
    ).rejects.toThrow();
  });

  // ── error propagation ──────────────────────────────────────────────────────

  it("propagates server error from client.executeAction", async () => {
    mockClient.executeAction!.mockRejectedValue(
      new Error("Action WinOpportunity failed: -2147220891"),
    );

    await expect(
      handleActionTool(
        "dataverse_execute_action",
        { actionName: "WinOpportunity", parameters: { Status: 3 } },
        dvClient(),
      ),
    ).rejects.toThrow("Action WinOpportunity failed");
  });
});

describe("Action tool handlers — dataverse_execute_function", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      executeAction: jest.fn(),
      executeFunction: jest.fn(),
      executeBoundAction: jest.fn(),
      executeBoundFunction: jest.fn(),
      listDependencies: jest.fn(),
      listTableDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  // ── happy path ─────────────────────────────────────────────────────────────

  it("calls executeFunction and returns JSON result on success", async () => {
    mockClient.executeFunction!.mockResolvedValue({
      EntityRecordCountCollection: [{ Count: 1500 }],
    });

    const result = await handleActionTool(
      "dataverse_execute_function",
      {
        functionName: "RetrieveTotalRecordCount",
        parameters: { EntityNames: "['account']" },
      },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      EntityRecordCountCollection: unknown[];
    };
    expect(parsed.EntityRecordCountCollection).toHaveLength(1);
    expect(mockClient.executeFunction).toHaveBeenCalledWith(
      "RetrieveTotalRecordCount",
      { EntityNames: "['account']" },
    );
  });

  it("defaults parameters to empty object when omitted", async () => {
    mockClient.executeFunction!.mockResolvedValue({ UserId: "uid" });

    await handleActionTool(
      "dataverse_execute_function",
      { functionName: "WhoAmI" },
      dvClient(),
    );

    expect(mockClient.executeFunction).toHaveBeenCalledWith("WhoAmI", {});
  });

  // ── input validation ───────────────────────────────────────────────────────

  it("throws ZodError when functionName is empty string", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_function",
        { functionName: "" },
        dvClient(),
      ),
    ).rejects.toThrow();

    expect(mockClient.executeFunction).not.toHaveBeenCalled();
  });

  it("throws ZodError when functionName is missing", async () => {
    await expect(
      handleActionTool("dataverse_execute_function", {}, dvClient()),
    ).rejects.toThrow();
  });

  // ── error propagation ──────────────────────────────────────────────────────

  it("propagates server error from client.executeFunction", async () => {
    mockClient.executeFunction!.mockRejectedValue(
      new Error("Function not found"),
    );

    await expect(
      handleActionTool(
        "dataverse_execute_function",
        { functionName: "NonExistentFunction" },
        dvClient(),
      ),
    ).rejects.toThrow("Function not found");
  });
});

describe("Action tool handlers — dataverse_execute_bound_action", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      executeAction: jest.fn(),
      executeFunction: jest.fn(),
      executeBoundAction: jest.fn(),
      executeBoundFunction: jest.fn(),
      listDependencies: jest.fn(),
      listTableDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  // ── happy path ─────────────────────────────────────────────────────────────

  it("calls executeBoundAction and returns JSON result on success", async () => {
    mockClient.executeBoundAction!.mockResolvedValue({
      QualifiedLeadId: "lead-qualified-123",
    });

    const result = await handleActionTool(
      "dataverse_execute_bound_action",
      {
        entitySetName: "leads",
        id: VALID_UUID,
        actionName: "QualifyLead",
        parameters: { CreateAccount: true },
      },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      QualifiedLeadId: string;
    };
    expect(parsed.QualifiedLeadId).toBe("lead-qualified-123");
    expect(mockClient.executeBoundAction).toHaveBeenCalledWith(
      "leads",
      VALID_UUID,
      "QualifyLead",
      { CreateAccount: true },
    );
  });

  it("defaults parameters to empty object when omitted", async () => {
    mockClient.executeBoundAction!.mockResolvedValue({ ok: true });

    await handleActionTool(
      "dataverse_execute_bound_action",
      {
        entitySetName: "accounts",
        id: VALID_UUID,
        actionName: "CustomAction",
      },
      dvClient(),
    );

    expect(mockClient.executeBoundAction).toHaveBeenCalledWith(
      "accounts",
      VALID_UUID,
      "CustomAction",
      {},
    );
  });

  // ── input validation ───────────────────────────────────────────────────────

  it("throws ZodError when id is not a valid UUID", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_bound_action",
        { entitySetName: "leads", id: "not-a-guid", actionName: "QualifyLead" },
        dvClient(),
      ),
    ).rejects.toThrow();

    expect(mockClient.executeBoundAction).not.toHaveBeenCalled();
  });

  it("throws ZodError when entitySetName is empty", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_bound_action",
        { entitySetName: "", id: VALID_UUID, actionName: "QualifyLead" },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("throws ZodError when actionName is empty", async () => {
    await expect(
      handleActionTool(
        "dataverse_execute_bound_action",
        { entitySetName: "leads", id: VALID_UUID, actionName: "" },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("throws ZodError when required fields are missing", async () => {
    await expect(
      handleActionTool("dataverse_execute_bound_action", {}, dvClient()),
    ).rejects.toThrow();
  });

  // ── error propagation ──────────────────────────────────────────────────────

  it("propagates server error from client.executeBoundAction", async () => {
    mockClient.executeBoundAction!.mockRejectedValue(
      new Error("Bound action QualifyLead failed: insufficient privilege"),
    );

    await expect(
      handleActionTool(
        "dataverse_execute_bound_action",
        { entitySetName: "leads", id: VALID_UUID, actionName: "QualifyLead" },
        dvClient(),
      ),
    ).rejects.toThrow("insufficient privilege");
  });
});
