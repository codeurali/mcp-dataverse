import { handleActionTool } from "../../src/tools/actions.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("dataverse_list_dependencies (FR-TOOL-05)", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      listTableDependencies: jest.fn(),
      listDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it("returns structured result with one BusinessRule dependency", async () => {
    const mockResult = {
      tableName: "account",
      dependencies: [
        {
          componentType: "BusinessRule",
          name: "Validate Account Name",
          id: VALID_UUID,
          state: "Active",
          triggerEvent: "Create,Update",
          solutionName: null,
        },
      ],
      count: 1,
      warning:
        "solutionName is not available in P0; solution lookup requires a complex join.",
    };
    mockClient.listTableDependencies!.mockResolvedValue(mockResult);

    const result = await handleActionTool(
      "dataverse_list_dependencies",
      { tableName: "account" },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as typeof mockResult;
    expect(parsed.tableName).toBe("account");
    expect(parsed.count).toBe(1);
    expect(parsed.dependencies[0]!.componentType).toBe("BusinessRule");
    expect(parsed.dependencies[0]!.state).toBe("Active");
    expect(mockClient.listTableDependencies).toHaveBeenCalledWith(
      "account",
      undefined,
    );
  });

  it("passes componentType filter array to client when provided", async () => {
    const mockResult = {
      tableName: "account",
      dependencies: [
        {
          componentType: "BusinessRule",
          name: "BR 1",
          id: VALID_UUID,
          state: "Active",
          triggerEvent: null,
          solutionName: null,
        },
      ],
      count: 1,
      warning: null,
    };
    mockClient.listTableDependencies!.mockResolvedValue(mockResult);

    await handleActionTool(
      "dataverse_list_dependencies",
      { tableName: "account", componentType: ["BusinessRule"] },
      dvClient(),
    );

    expect(mockClient.listTableDependencies).toHaveBeenCalledWith("account", [
      "BusinessRule",
    ]);
  });

  it("throws ZodError when tableName is empty", async () => {
    await expect(
      handleActionTool(
        "dataverse_list_dependencies",
        { tableName: "" },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("throws ZodError when tableName is missing", async () => {
    await expect(
      handleActionTool("dataverse_list_dependencies", {}, dvClient()),
    ).rejects.toThrow();
  });

  it("returns empty dependencies array when table has no dependencies", async () => {
    const mockResult = {
      tableName: "new_custom",
      dependencies: [],
      count: 0,
      warning:
        "solutionName is not available in P0; solution lookup requires a complex join.",
    };
    mockClient.listTableDependencies!.mockResolvedValue(mockResult);

    const result = await handleActionTool(
      "dataverse_list_dependencies",
      { tableName: "new_custom" },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as typeof mockResult;
    expect(parsed.count).toBe(0);
    expect(parsed.dependencies).toHaveLength(0);
    expect(mockClient.listTableDependencies).toHaveBeenCalledWith(
      "new_custom",
      undefined,
    );
  });

  it("rejects invalid componentType enum values", async () => {
    await expect(
      handleActionTool(
        "dataverse_list_dependencies",
        { tableName: "account", componentType: ["InvalidType"] },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("accepts Plugin and CustomAPI as valid componentType values (C-07)", async () => {
    const mockResult = {
      tableName: "account",
      dependencies: [],
      count: 0,
      warning:
        "solutionName is not available in P0; solution lookup requires a complex join. Plugin and CustomAPI types require additional SDK message queries - not yet implemented. The listed results show Workflow/BusinessRule/Flow dependencies only.",
    };
    mockClient.listTableDependencies!.mockResolvedValue(mockResult);

    await expect(
      handleActionTool(
        "dataverse_list_dependencies",
        { tableName: "account", componentType: ["Plugin", "CustomAPI"] },
        dvClient(),
      ),
    ).resolves.not.toThrow();

    expect(mockClient.listTableDependencies).toHaveBeenCalledWith("account", [
      "Plugin",
      "CustomAPI",
    ]);
  });
});

describe("dataverse_retrieve_dependencies_for_delete (FR-TOOL-22)", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      listDependencies: jest.fn(),
      listTableDependencies: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it("calls listDependencies with componentType and objectId", async () => {
    const mockDeps = [
      {
        DependentComponentType: 2,
        DependentComponentBaseSolutionName: "MySolution",
      },
    ];
    mockClient.listDependencies!.mockResolvedValue(mockDeps);

    const result = await handleActionTool(
      "dataverse_retrieve_dependencies_for_delete",
      { componentType: 1, objectId: VALID_UUID },
      dvClient(),
    );

    const parsed = JSON.parse(result.content[0]!.text) as typeof mockDeps;
    expect(parsed).toHaveLength(1);
    expect(mockClient.listDependencies).toHaveBeenCalledWith(1, VALID_UUID);
  });

  it("throws ZodError when componentType is negative", async () => {
    await expect(
      handleActionTool(
        "dataverse_retrieve_dependencies_for_delete",
        { componentType: -1, objectId: VALID_UUID },
        dvClient(),
      ),
    ).rejects.toThrow();
  });

  it("throws ZodError when objectId is not a valid UUID", async () => {
    await expect(
      handleActionTool(
        "dataverse_retrieve_dependencies_for_delete",
        { componentType: 1, objectId: "not-a-guid" },
        dvClient(),
      ),
    ).rejects.toThrow();
  });
});
