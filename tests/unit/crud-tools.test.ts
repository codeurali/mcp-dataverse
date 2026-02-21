import { handleCrudTool } from "../../src/tools/crud.tools.js";
import { handleQueryTool } from "../../src/tools/query.tools.js";
import type { DataverseAdvancedClient } from "../../src/dataverse/dataverse-client-advanced.js";

describe("CRUD tool handlers", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      createRecord: jest.fn(),
      getRecord: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
      upsertRecord: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  describe("dataverse_create", () => {
    it("returns created record id on success", async () => {
      mockClient.createRecord!.mockResolvedValue("new-record-id-abc123");

      const result = await handleCrudTool(
        "dataverse_create",
        {
          entitySetName: "accounts",
          data: { name: "Test Account", revenue: 50000 },
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as { id: string };
      expect(parsed.id).toBe("new-record-id-abc123");
      expect(mockClient.createRecord).toHaveBeenCalledWith("accounts", {
        name: "Test Account",
        revenue: 50000,
      });
    });
  });

  describe("dataverse_get", () => {
    it("throws on invalid UUID for id", async () => {
      await expect(
        handleCrudTool(
          "dataverse_get",
          { entitySetName: "accounts", id: "not-a-valid-uuid" },
          dvClient(),
        ),
      ).rejects.toThrow();
    });

    it("returns record data when given a valid UUID", async () => {
      const mockRecord = {
        accountid: "00000000-0000-0000-0000-000000000001",
        name: "Contoso Ltd",
      };
      mockClient.getRecord!.mockResolvedValue({
        record: mockRecord,
        etag: 'W/"12345"',
      });

      const result = await handleCrudTool(
        "dataverse_get",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        record: typeof mockRecord;
        etag: string | null;
      };
      expect(parsed.record.name).toBe("Contoso Ltd");
    });

    it("includes etag in response when present", async () => {
      const mockRecord = {
        accountid: "00000000-0000-0000-0000-000000000002",
        name: "Fabrikam",
      };
      mockClient.getRecord!.mockResolvedValue({
        record: mockRecord,
        etag: 'W/"67890"',
      });

      const result = await handleCrudTool(
        "dataverse_get",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000002",
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        id: string;
        record: typeof mockRecord;
        etag: string | null;
      };
      expect(parsed.etag).toBe('W/"67890"');
      expect(parsed.id).toBe("00000000-0000-0000-0000-000000000002");
    });

    it("returns etag as null when not present", async () => {
      const mockRecord = {
        accountid: "00000000-0000-0000-0000-000000000003",
        name: "No ETag Corp",
      };
      mockClient.getRecord!.mockResolvedValue({
        record: mockRecord,
        etag: null,
      });

      const result = await handleCrudTool(
        "dataverse_get",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000003",
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        etag: string | null;
      };
      expect(parsed.etag).toBeNull();
    });
  });

  describe("dataverse_update", () => {
    it("calls updateRecord and returns success message", async () => {
      mockClient.updateRecord!.mockResolvedValue(undefined);

      const result = await handleCrudTool(
        "dataverse_update",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          data: { name: "Updated Name", revenue: 100000 },
        },
        dvClient(),
      );

      expect(result.content[0]!.text).toContain("updated successfully");
      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        "accounts",
        "00000000-0000-0000-0000-000000000001",
        { name: "Updated Name", revenue: 100000 },
        undefined,
      );
    });

    it("throws ZodError when id is not a valid UUID", async () => {
      await expect(
        handleCrudTool(
          "dataverse_update",
          { entitySetName: "accounts", id: "not-a-guid", data: { name: "X" } },
          dvClient(),
        ),
      ).rejects.toThrow();

      expect(mockClient.updateRecord).not.toHaveBeenCalled();
    });

    it("throws ZodError when entitySetName is empty", async () => {
      await expect(
        handleCrudTool(
          "dataverse_update",
          {
            entitySetName: "",
            id: "00000000-0000-0000-0000-000000000001",
            data: { name: "X" },
          },
          dvClient(),
        ),
      ).rejects.toThrow();
    });

    it("throws ZodError when data is missing", async () => {
      await expect(
        handleCrudTool(
          "dataverse_update",
          {
            entitySetName: "accounts",
            id: "00000000-0000-0000-0000-000000000001",
          },
          dvClient(),
        ),
      ).rejects.toThrow();
    });

    it("propagates server error from client.updateRecord", async () => {
      mockClient.updateRecord!.mockRejectedValue(new Error("Record not found"));

      await expect(
        handleCrudTool(
          "dataverse_update",
          {
            entitySetName: "accounts",
            id: "00000000-0000-0000-0000-000000000001",
            data: { name: "X" },
          },
          dvClient(),
        ),
      ).rejects.toThrow("Record not found");
    });

    it("uses provided etag for optimistic concurrency", async () => {
      mockClient.updateRecord!.mockResolvedValue(undefined);

      await handleCrudTool(
        "dataverse_update",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          data: { name: "Concurrent Update" },
          etag: 'W/"12345"',
        },
        dvClient(),
      );

      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        "accounts",
        "00000000-0000-0000-0000-000000000001",
        { name: "Concurrent Update" },
        'W/"12345"',
      );
    });

    it("passes undefined etag when no etag provided (If-Match: * regression)", async () => {
      mockClient.updateRecord!.mockResolvedValue(undefined);

      await handleCrudTool(
        "dataverse_update",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          data: { name: "No Etag Update" },
        },
        dvClient(),
      );

      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        "accounts",
        "00000000-0000-0000-0000-000000000001",
        { name: "No Etag Update" },
        undefined,
      );
    });
  });

  describe("dataverse_delete", () => {
    it("calls deleteRecord and returns success message when confirm=true", async () => {
      mockClient.deleteRecord!.mockResolvedValue(undefined);

      const result = await handleCrudTool(
        "dataverse_delete",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          confirm: true,
        },
        dvClient(),
      );

      expect(result.content[0]!.text).toContain("deleted successfully");
      expect(mockClient.deleteRecord).toHaveBeenCalledWith(
        "accounts",
        "00000000-0000-0000-0000-000000000001",
      );
    });

    it("blocks deletion and makes no API call when confirm=false", async () => {
      mockClient.deleteRecord!.mockResolvedValue(undefined);

      const result = await handleCrudTool(
        "dataverse_delete",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          confirm: false,
        },
        dvClient(),
      );

      expect(result.content[0]!.text).toContain("confirm");
      expect(mockClient.deleteRecord).not.toHaveBeenCalled();
    });
  });

  describe("dataverse_upsert", () => {
    it('returns operation="created" and id on new upsert', async () => {
      mockClient.upsertRecord!.mockResolvedValue({
        operation: "created",
        id: "new-record-id-xyz",
      });

      const result = await handleCrudTool(
        "dataverse_upsert",
        {
          entitySetName: "accounts",
          alternateKey: "new_externalid",
          alternateKeyValue: "EXT-001",
          data: { name: "Test Account" },
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        operation: string;
        id: string;
        message: string;
      };
      expect(parsed.operation).toBe("created");
      expect(parsed.id).toBe("new-record-id-xyz");
      expect(parsed.message).toContain("created successfully");
      expect(mockClient.upsertRecord).toHaveBeenCalledWith(
        "accounts",
        "new_externalid",
        "EXT-001",
        { name: "Test Account" },
        "upsert",
        undefined,
      );
    });

    it('returns operation="updated" when record already existed', async () => {
      mockClient.upsertRecord!.mockResolvedValue({
        operation: "updated",
        id: "existing-id-abc",
      });

      const result = await handleCrudTool(
        "dataverse_upsert",
        {
          entitySetName: "contacts",
          alternateKey: "new_externalid",
          alternateKeyValue: "CONT-099",
          data: { firstname: "Jane" },
        },
        dvClient(),
      );

      const parsed = JSON.parse(result.content[0]!.text) as {
        operation: string;
        id: string;
        message: string;
      };
      expect(parsed.operation).toBe("updated");
      expect(parsed.message).toContain("updated successfully");
    });

    it('propagates "Record already exists" error for mode=createOnly', async () => {
      mockClient.upsertRecord!.mockRejectedValue(
        new Error("Record already exists"),
      );

      await expect(
        handleCrudTool(
          "dataverse_upsert",
          {
            entitySetName: "accounts",
            alternateKey: "new_externalid",
            alternateKeyValue: "EXT-001",
            data: { name: "Test" },
            mode: "createOnly",
          },
          dvClient(),
        ),
      ).rejects.toThrow("Record already exists");

      expect(mockClient.upsertRecord).toHaveBeenCalledWith(
        "accounts",
        "new_externalid",
        "EXT-001",
        { name: "Test" },
        "createOnly",
        undefined,
      );
    });

    it('propagates "Record not found" error for mode=updateOnly', async () => {
      mockClient.upsertRecord!.mockRejectedValue(new Error("Record not found"));

      await expect(
        handleCrudTool(
          "dataverse_upsert",
          {
            entitySetName: "contacts",
            alternateKey: "new_externalid",
            alternateKeyValue: "CONT-001",
            data: { firstname: "Jane" },
            mode: "updateOnly",
          },
          dvClient(),
        ),
      ).rejects.toThrow("Record not found");

      expect(mockClient.upsertRecord).toHaveBeenCalledWith(
        "contacts",
        "new_externalid",
        "CONT-001",
        { firstname: "Jane" },
        "updateOnly",
        undefined,
      );
    });
  });

  describe("dataverse_assign", () => {
    it("assigns record to a systemuser via ownerid@odata.bind", async () => {
      mockClient.updateRecord!.mockResolvedValue(undefined);

      const result = await handleCrudTool(
        "dataverse_assign",
        {
          entitySetName: "accounts",
          id: "00000000-0000-0000-0000-000000000001",
          ownerType: "systemuser",
          ownerId: "00000000-0000-0000-0000-000000000002",
        },
        dvClient(),
      );

      expect(result.content[0]!.text).toContain("assigned successfully");
      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        "accounts",
        "00000000-0000-0000-0000-000000000001",
        {
          "ownerid@odata.bind":
            "/systemusers(00000000-0000-0000-0000-000000000002)",
        },
      );
    });

    it("assigns record to a team via ownerid@odata.bind", async () => {
      mockClient.updateRecord!.mockResolvedValue(undefined);

      await handleCrudTool(
        "dataverse_assign",
        {
          entitySetName: "incidents",
          id: "00000000-0000-0000-0000-000000000003",
          ownerType: "team",
          ownerId: "00000000-0000-0000-0000-000000000004",
        },
        dvClient(),
      );

      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        "incidents",
        "00000000-0000-0000-0000-000000000003",
        {
          "ownerid@odata.bind": "/teams(00000000-0000-0000-0000-000000000004)",
        },
      );
    });

    it("rejects invalid ownerId UUID", async () => {
      await expect(
        handleCrudTool(
          "dataverse_assign",
          {
            entitySetName: "accounts",
            id: "00000000-0000-0000-0000-000000000001",
            ownerType: "systemuser",
            ownerId: "not-a-valid-uuid",
          },
          dvClient(),
        ),
      ).rejects.toThrow();

      expect(mockClient.updateRecord).not.toHaveBeenCalled();
    });
  });
});

describe("Query tool handlers", () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = { query: jest.fn() };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  describe("dataverse_query", () => {
    it("throws on top > 5000 (exceeds Dataverse limit)", async () => {
      await expect(
        handleQueryTool(
          "dataverse_query",
          { entitySetName: "accounts", top: 5001 },
          dvClient(),
        ),
      ).rejects.toThrow();
    });

    it("defaults top to 50 and passes options to client.query", async () => {
      mockClient.query!.mockResolvedValue({
        value: [],
        "@odata.context": "test-ctx",
      });

      const result = await handleQueryTool(
        "dataverse_query",
        { entitySetName: "contacts", select: ["fullname", "emailaddress1"] },
        dvClient(),
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          top: 50,
          select: ["fullname", "emailaddress1"],
        }),
      );
      expect(result.content[0]!.text).toContain("value");
    });
  });
});
