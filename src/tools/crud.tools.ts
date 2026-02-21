import { z } from "zod";
import type { DataverseClient } from "../dataverse/dataverse-client.js";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { safeEntitySetName } from "./validation.utils.js";

export const crudTools = [
  {
    name: "dataverse_get",
    description:
      "Retrieves a single Dataverse record by its GUID. Use when you already know the exact record ID and want specific fields — faster and more precise than dataverse_query with a GUID filter. Specify select to limit returned columns and reduce payload size.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: { type: "string", description: "OData entity set name" },
        id: { type: "string", description: "Record GUID" },
        select: {
          type: "array",
          items: { type: "string" },
          description: "Columns to return",
        },
      },
      required: ["entitySetName", "id"],
    },
  },
  {
    name: "dataverse_create",
    description:
      'Creates a new record in a Dataverse table and returns the new record\'s GUID. Use dataverse_get_table_metadata first to confirm correct logical field names and required fields. For setting lookup fields, use the format "_fieldname_value" with the related record GUID. For bulk creation of multiple records, consider dataverse_batch_execute to reduce HTTP round-trips.',
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: { type: "string", description: "OData entity set name" },
        data: {
          type: "object",
          description: "Record data as key-value pairs using logical names",
        },
      },
      required: ["entitySetName", "data"],
    },
  },
  {
    name: "dataverse_update",
    description:
      "Updates an existing Dataverse record using PATCH semantics — only the fields provided in data are changed, all other fields remain unchanged. Requires the record GUID. Use dataverse_upsert instead if you want to create-or-update using an alternate key without knowing the GUID upfront.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: { type: "string" },
        id: { type: "string", description: "Record GUID" },
        data: { type: "object", description: "Fields to update" },
        etag: {
          type: "string",
          description:
            "ETag value from a prior dataverse_get response. When provided, the update only succeeds if the record has not been modified since (optimistic concurrency). Prevents lost updates.",
        },
      },
      required: ["entitySetName", "id", "data"],
    },
  },
  {
    name: "dataverse_delete",
    description:
      "Permanently deletes a Dataverse record by its GUID. This operation is irreversible — you MUST set confirm=true to proceed. Use dataverse_list_dependencies to check if the record is referenced by workflows, plugins, or other components before deleting shared or configuration records.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: { type: "string" },
        id: { type: "string", description: "Record GUID" },
        confirm: {
          type: "boolean",
          description: "Must be explicitly true to proceed with deletion",
        },
      },
      required: ["entitySetName", "id", "confirm"],
    },
  },
  {
    name: "dataverse_upsert",
    description:
      'Creates or updates a Dataverse record using an alternate key (no GUID needed). Returns operation="created" or "updated". Use mode="createOnly" to fail with an error if the record already exists, or mode="updateOnly" to fail if the record does not exist. Default mode="upsert" creates or updates. Supports compound alternate keys via the alternateKeys parameter.',
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: { type: "string" },
        alternateKey: {
          type: "string",
          description: "Alternate key attribute name (for single key)",
        },
        alternateKeyValue: {
          type: "string",
          description: "Alternate key value (for single key)",
        },
        alternateKeys: {
          type: "object",
          description:
            'Compound alternate key as key-value map (e.g., {"key1":"val1","key2":"val2"}). Use instead of alternateKey/alternateKeyValue for multi-field keys.',
        },
        data: { type: "object", description: "Record data" },
        mode: {
          type: "string",
          enum: ["upsert", "createOnly", "updateOnly"],
          description:
            "upsert=create or update (default), createOnly=fail if exists, updateOnly=fail if not found",
        },
      },
      required: ["entitySetName", "data"],
    },
  },
  {
    name: "dataverse_assign",
    description:
      "Assigns a Dataverse record to a different user or team owner. Sets the ownerid lookup field using the OData bind syntax.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entitySetName: {
          type: "string",
          description: "OData entity set name of the record to assign",
        },
        id: { type: "string", description: "Record GUID" },
        ownerType: {
          type: "string",
          enum: ["systemuser", "team"],
          description:
            'Type of the new owner: "systemuser" for a user, "team" for a team',
        },
        ownerId: {
          type: "string",
          description: "GUID of the user or team to assign the record to",
        },
      },
      required: ["entitySetName", "id", "ownerType", "ownerId"],
    },
  },
];

const GetInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  select: z.array(z.string()).optional(),
});

const CreateInput = z.object({
  entitySetName: safeEntitySetName,
  data: z.record(z.unknown()),
});

const UpdateInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  data: z.record(z.unknown()),
  etag: z.string().optional(),
});

const DeleteInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  confirm: z.boolean(),
});

const UpsertInput = z
  .object({
    entitySetName: safeEntitySetName,
    alternateKey: z.string().min(1).optional(),
    alternateKeyValue: z.string().min(1).optional(),
    alternateKeys: z.record(z.string()).optional(),
    data: z.record(z.unknown()),
    mode: z
      .enum(["upsert", "createOnly", "updateOnly"])
      .default("upsert")
      .optional()
      .describe(
        "upsert=create or update (default), createOnly=fail if exists, updateOnly=fail if not found",
      ),
  })
  .refine(
    (d) =>
      (d.alternateKey && d.alternateKeyValue) ||
      (d.alternateKeys && Object.keys(d.alternateKeys).length > 0),
    {
      message:
        "Provide either (alternateKey + alternateKeyValue) or alternateKeys",
    },
  );

const AssignInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  ownerType: z.enum(["systemuser", "team"]),
  ownerId: z.string().uuid(),
});

export async function handleCrudTool(
  name: string,
  args: unknown,
  client: DataverseClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "dataverse_get": {
      const { entitySetName, id, select } = GetInput.parse(args);
      const { record, etag } = await client.getRecord(
        entitySetName,
        id,
        select,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ id, record, etag }, null, 2),
          },
        ],
      };
    }
    case "dataverse_create": {
      const { entitySetName, data } = CreateInput.parse(args);
      const id = await client.createRecord(entitySetName, data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id, message: "Record created successfully" },
              null,
              2,
            ),
          },
        ],
      };
    }
    case "dataverse_update": {
      const { entitySetName, id, data, etag } = UpdateInput.parse(args);
      await client.updateRecord(entitySetName, id, data, etag);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: "Record updated successfully" }),
          },
        ],
      };
    }
    case "dataverse_delete": {
      const { entitySetName, id, confirm } = DeleteInput.parse(args);
      if (!confirm) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: `Deletion not performed. Set 'confirm: true' to delete record '${id}' from '${entitySetName}'.`,
              }),
            },
          ],
        };
      }
      await client.deleteRecord(entitySetName, id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: "Record deleted successfully" }),
          },
        ],
      };
    }
    case "dataverse_upsert": {
      const parsed = UpsertInput.parse(args);
      const {
        entitySetName,
        alternateKey,
        alternateKeyValue,
        alternateKeys,
        data,
        mode = "upsert",
      } = parsed;
      let keySegment: string | undefined;
      if (alternateKeys && Object.keys(alternateKeys).length > 0) {
        keySegment = Object.entries(alternateKeys)
          .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
          .join(",");
      }
      const result = await client.upsertRecord(
        entitySetName,
        alternateKey ?? "",
        alternateKeyValue ?? "",
        data,
        mode,
        keySegment,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                operation: result.operation,
                id: result.id,
                message: `Record ${result.operation} successfully`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case "dataverse_assign": {
      const { entitySetName, id, ownerType, ownerId } = AssignInput.parse(args);
      const entityRef = ownerType === "systemuser" ? "systemusers" : "teams";
      await client.updateRecord(entitySetName, id, {
        "ownerid@odata.bind": `/${entityRef}(${ownerId})`,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: "Record assigned successfully" }),
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown CRUD tool: ${name}`);
  }
}
