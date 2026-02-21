import { handleMetadataTool } from "../../src/tools/metadata.tools.js";
import type { DataverseMetadataClient } from "../../src/dataverse/dataverse-client.metadata.js";

describe("handleMetadataTool", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      listTables: jest.fn(),
      getTableMetadata: jest.fn(),
      getRelationships: jest.fn(),
      listGlobalOptionSets: jest.fn(),
      getOptionSet: jest.fn(),
    };
  });

  const client = () => mockClient as unknown as DataverseMetadataClient;

  // ── dataverse_list_tables ─────────────────────────────────────────────────

  describe("dataverse_list_tables", () => {
    it("returns JSON list with table data", async () => {
      const tables = [
        {
          LogicalName: "account",
          DisplayName: "Account",
          EntitySetName: "accounts",
        },
      ];
      mockClient.listTables!.mockResolvedValue(tables);

      const result = await handleMetadataTool(
        "dataverse_list_tables",
        {},
        client(),
      );
      const parsed = JSON.parse(result.content[0]!.text) as typeof tables;

      expect(parsed[0]!.LogicalName).toBe("account");
      expect(mockClient.listTables).toHaveBeenCalledWith(true);
    });

    it("passes customOnly=true when includeSystemTables=false", async () => {
      mockClient.listTables!.mockResolvedValue([]);

      await handleMetadataTool(
        "dataverse_list_tables",
        { includeSystemTables: false },
        client(),
      );

      expect(mockClient.listTables).toHaveBeenCalledWith(true);
    });

    it("passes customOnly=false when includeSystemTables=true", async () => {
      mockClient.listTables!.mockResolvedValue([]);

      await handleMetadataTool(
        "dataverse_list_tables",
        { includeSystemTables: true },
        client(),
      );

      expect(mockClient.listTables).toHaveBeenCalledWith(false);
    });

    it("works with no args — defaults to custom tables only (customOnly=true)", async () => {
      mockClient.listTables!.mockResolvedValue([]);

      await handleMetadataTool("dataverse_list_tables", undefined, client());

      expect(mockClient.listTables).toHaveBeenCalledWith(true);
    });
  });

  // ── dataverse_get_table_metadata ──────────────────────────────────────────

  describe("dataverse_get_table_metadata", () => {
    it("returns metadata JSON with attributes", async () => {
      const metadata = {
        LogicalName: "account",
        Attributes: [
          { LogicalName: "accountid", AttributeType: "Uniqueidentifier" },
        ],
      };
      mockClient.getTableMetadata!.mockResolvedValue(metadata);

      const result = await handleMetadataTool(
        "dataverse_get_table_metadata",
        { logicalName: "account" },
        client(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as typeof metadata;
      expect(parsed.LogicalName).toBe("account");
      expect(parsed.Attributes).toHaveLength(1);
      expect(mockClient.getTableMetadata).toHaveBeenCalledWith("account", true);
    });

    it("passes includeAttributes=false when specified", async () => {
      mockClient.getTableMetadata!.mockResolvedValue({
        LogicalName: "account",
      });

      await handleMetadataTool(
        "dataverse_get_table_metadata",
        { logicalName: "account", includeAttributes: false },
        client(),
      );

      expect(mockClient.getTableMetadata).toHaveBeenCalledWith(
        "account",
        false,
      );
    });

    it("throws ZodError when logicalName is empty", async () => {
      await expect(
        handleMetadataTool(
          "dataverse_get_table_metadata",
          { logicalName: "" },
          client(),
        ),
      ).rejects.toThrow();

      expect(mockClient.getTableMetadata).not.toHaveBeenCalled();
    });

    it("throws ZodError when logicalName is missing", async () => {
      await expect(
        handleMetadataTool("dataverse_get_table_metadata", {}, client()),
      ).rejects.toThrow();
    });
  });

  // ── dataverse_get_relationships ───────────────────────────────────────────

  describe("dataverse_get_relationships", () => {
    const makeRels = () => [
      {
        SchemaName: "1N_rel",
        RelationshipType: "OneToManyRelationship",
        ReferencedEntity: "account",
        ReferencingEntity: "contact",
      },
      {
        SchemaName: "N1_rel",
        RelationshipType: "OneToManyRelationship",
        ReferencedEntity: "contact",
        ReferencingEntity: "account",
      },
      { SchemaName: "NN_rel", RelationshipType: "ManyToManyRelationship" },
    ];

    it("returns structured relationship data with tableName", async () => {
      mockClient.getRelationships!.mockResolvedValue(makeRels());

      const result = await handleMetadataTool(
        "dataverse_get_relationships",
        { logicalName: "account" },
        client(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        tableName: string;
        oneToMany: unknown[];
        manyToOne: unknown[];
        manyToMany: unknown[];
      };
      expect(parsed.tableName).toBe("account");
      expect(parsed.oneToMany).toHaveLength(1);
      expect(parsed.manyToOne).toHaveLength(1);
      expect(parsed.manyToMany).toHaveLength(1);
      expect(mockClient.getRelationships).toHaveBeenCalledWith("account");
    });

    it("filters to only oneToMany when relationshipType is OneToMany", async () => {
      mockClient.getRelationships!.mockResolvedValue(makeRels());

      const result = await handleMetadataTool(
        "dataverse_get_relationships",
        { logicalName: "account", relationshipType: "OneToMany" },
        client(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as Record<
        string,
        unknown
      >;
      expect(parsed["oneToMany"]).toHaveLength(1);
      expect(parsed["manyToOne"]).toBeUndefined();
      expect(parsed["manyToMany"]).toBeUndefined();
    });

    it("filters to only manyToMany when relationshipType is ManyToMany", async () => {
      mockClient.getRelationships!.mockResolvedValue(makeRels());

      const result = await handleMetadataTool(
        "dataverse_get_relationships",
        { logicalName: "account", relationshipType: "ManyToMany" },
        client(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as Record<
        string,
        unknown
      >;
      expect(parsed["manyToMany"]).toHaveLength(1);
      expect(parsed["oneToMany"]).toBeUndefined();
      expect(parsed["manyToOne"]).toBeUndefined();
    });

    it("throws ZodError when logicalName is empty", async () => {
      await expect(
        handleMetadataTool(
          "dataverse_get_relationships",
          { logicalName: "" },
          client(),
        ),
      ).rejects.toThrow();
    });
  });

  // ── dataverse_list_global_option_sets ─────────────────────────────────────

  describe("dataverse_list_global_option_sets", () => {
    it("returns option sets as JSON", async () => {
      const optionSets = [{ Name: "my_status", MetadataId: "guid-1" }];
      mockClient.listGlobalOptionSets!.mockResolvedValue(optionSets);

      const result = await handleMetadataTool(
        "dataverse_list_global_option_sets",
        {},
        client(),
      );
      const parsed = JSON.parse(result.content[0]!.text) as typeof optionSets;

      expect(parsed[0]!.Name).toBe("my_status");
      expect(mockClient.listGlobalOptionSets).toHaveBeenCalledTimes(1);
    });
  });

  // ── dataverse_get_option_set ──────────────────────────────────────────────

  describe("dataverse_get_option_set", () => {
    it("returns option set values as JSON", async () => {
      const optionSet = {
        Name: "my_status",
        Options: [
          { Value: 1, Label: "Active" },
          { Value: 2, Label: "Inactive" },
        ],
      };
      mockClient.getOptionSet!.mockResolvedValue(optionSet);

      const result = await handleMetadataTool(
        "dataverse_get_option_set",
        { name: "my_status" },
        client(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as typeof optionSet;
      expect(parsed.Options).toHaveLength(2);
      expect(mockClient.getOptionSet).toHaveBeenCalledWith("my_status");
    });

    it("throws ZodError when name is empty", async () => {
      await expect(
        handleMetadataTool("dataverse_get_option_set", { name: "" }, client()),
      ).rejects.toThrow();
    });

    it("throws ZodError when name is missing", async () => {
      await expect(
        handleMetadataTool("dataverse_get_option_set", {}, client()),
      ).rejects.toThrow();
    });
  });

  // ── unknown tool ──────────────────────────────────────────────────────────

  it("throws on unknown tool name", async () => {
    await expect(
      handleMetadataTool("dataverse_unknown", {}, client()),
    ).rejects.toThrow("Unknown metadata tool");
  });
});
