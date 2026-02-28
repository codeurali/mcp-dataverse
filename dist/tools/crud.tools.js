import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
import { safeEntitySetName } from "./validation.utils.js";
export const crudTools = [
    {
        name: "dataverse_get",
        description: "Retrieves a single Dataverse record by its GUID. Use when you already know the exact record ID and want specific fields — faster and more precise than dataverse_query with a GUID filter. Specify select to limit returned columns and reduce payload size. WHEN TO USE: You have the exact record GUID and want specific fields. BEST PRACTICES: Always specify select; use the returned etag for subsequent optimistic-concurrency updates. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
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
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_create",
        description: 'Creates a new record in a Dataverse table and returns the new record\'s GUID. Use dataverse_get_table_metadata first to confirm correct logical field names and required fields. For setting lookup fields, use the format "_fieldname_value" with the related record GUID. For bulk creation of multiple records, consider dataverse_batch_execute to reduce HTTP round-trips. WHEN TO USE: Creating a single new record in a known table. BEST PRACTICES: Validate field names via dataverse_get_table_metadata first; use dataverse_batch_execute for bulk inserts. WORKFLOW: create_record.',
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: { type: "string", description: "OData entity set name" },
                data: {
                    type: "object",
                    description: "Record data as key-value pairs using logical names",
                },
            },
            required: ["entitySetName", "data"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_update",
        description: "Updates an existing Dataverse record using PATCH semantics — only the fields provided in data are changed, all other fields remain unchanged. Requires the record GUID. Use dataverse_upsert instead if you want to create-or-update using an alternate key without knowing the GUID upfront. WHEN TO USE: Modifying specific fields on an existing record with a known GUID. BEST PRACTICES: Pass etag for optimistic concurrency; include only changed fields in data. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: { type: "string" },
                id: { type: "string", description: "Record GUID" },
                data: { type: "object", description: "Fields to update" },
                etag: {
                    type: "string",
                    description: "ETag value from a prior dataverse_get response. When provided, the update only succeeds if the record has not been modified since (optimistic concurrency). Prevents lost updates.",
                },
            },
            required: ["entitySetName", "id", "data"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_delete",
        description: "Permanently deletes a Dataverse record by its GUID. This operation is irreversible — you MUST set confirm=true to proceed. Use dataverse_list_dependencies to check if the record is referenced by workflows, plugins, or other components before deleting shared or configuration records. WHEN TO USE: Permanently removing a record you are certain should be deleted. BEST PRACTICES: Call dataverse_list_dependencies first for shared records; always set confirm=true. WORKFLOW: delete_record.",
        inputSchema: {
            type: "object",
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
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_upsert",
        description: 'Creates or updates a Dataverse record using an alternate key (no GUID needed). Returns operation="created" or "updated". Use mode="createOnly" to fail with an error if the record already exists, or mode="updateOnly" to fail if the record does not exist. Default mode="upsert" creates or updates. Supports compound alternate keys via the alternateKeys parameter. WHEN TO USE: Create-or-update when you have an alternate key but no GUID. BEST PRACTICES: Verify alternate keys with dataverse_get_entity_key first; use mode to control behavior. WORKFLOW: create_record.',
        inputSchema: {
            type: "object",
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
                    description: 'Compound alternate key as key-value map (e.g., {"key1":"val1","key2":"val2"}). Use instead of alternateKey/alternateKeyValue for multi-field keys.',
                },
                data: { type: "object", description: "Record data" },
                mode: {
                    type: "string",
                    enum: ["upsert", "createOnly", "updateOnly"],
                    description: "upsert=create or update (default), createOnly=fail if exists, updateOnly=fail if not found",
                },
            },
            required: ["entitySetName", "data"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_assign",
        description: "Assigns a Dataverse record to a different user or team owner. Sets the ownerid lookup field using the OData bind syntax. WHEN TO USE: Changing the owner of a record to a different user or team. BEST PRACTICES: Use dataverse_list_users or dataverse_list_teams to find valid owner GUIDs first. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: "OData entity set name of the record to assign",
                },
                id: { type: "string", description: "Record GUID" },
                ownerType: {
                    type: "string",
                    enum: ["systemuser", "team"],
                    description: 'Type of the new owner: "systemuser" for a user, "team" for a team',
                },
                ownerId: {
                    type: "string",
                    description: "GUID of the user or team to assign the record to",
                },
            },
            required: ["entitySetName", "id", "ownerType", "ownerId"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
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
        .describe("upsert=create or update (default), createOnly=fail if exists, updateOnly=fail if not found"),
})
    .refine((d) => (d.alternateKey && d.alternateKeyValue) ||
    (d.alternateKeys && Object.keys(d.alternateKeys).length > 0), {
    message: "Provide either (alternateKey + alternateKeyValue) or alternateKeys",
});
const AssignInput = z.object({
    entitySetName: safeEntitySetName,
    id: z.string().uuid(),
    ownerType: z.enum(["systemuser", "team"]),
    ownerId: z.string().uuid(),
});
export async function handleCrudTool(name, args, client) {
    switch (name) {
        case "dataverse_get": {
            const { entitySetName, id, select } = GetInput.parse(args);
            const { record, etag } = await client.getRecord(entitySetName, id, select);
            return formatData(`Retrieved record ${id} from ${entitySetName}`, { id, record, etag }, [
                "Use dataverse_update to modify this record",
                "Use dataverse_get_relationships to explore related records",
            ]);
        }
        case "dataverse_create": {
            const { entitySetName, data } = CreateInput.parse(args);
            const id = await client.createRecord(entitySetName, data);
            return formatData(`Created record ${id} in ${entitySetName}`, { id, message: "Record created successfully" }, [
                "Use dataverse_get to retrieve the full record",
                "Use dataverse_associate to link related records",
            ]);
        }
        case "dataverse_update": {
            const { entitySetName, id, data, etag } = UpdateInput.parse(args);
            await client.updateRecord(entitySetName, id, data, etag);
            return formatData(`Updated record ${id} in ${entitySetName}`, { message: "Record updated successfully" }, [
                "Use dataverse_get to verify the update",
                "Use etag parameter for optimistic concurrency",
            ]);
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
            return formatData(`Deleted record ${id} from ${entitySetName}`, { message: "Record deleted successfully" }, ["This operation is irreversible"]);
        }
        case "dataverse_upsert": {
            const parsed = UpsertInput.parse(args);
            const { entitySetName, alternateKey, alternateKeyValue, alternateKeys, data, mode = "upsert", } = parsed;
            let keySegment;
            if (alternateKeys && Object.keys(alternateKeys).length > 0) {
                keySegment = Object.entries(alternateKeys)
                    .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
                    .join(",");
            }
            const result = await client.upsertRecord(entitySetName, alternateKey ?? "", alternateKeyValue ?? "", data, mode, keySegment);
            return formatData(`Upsert ${result.operation}: record in ${entitySetName}`, {
                operation: result.operation,
                id: result.id,
                message: `Record ${result.operation} successfully`,
            }, ["Use dataverse_get_entity_key to verify alternate key definitions"]);
        }
        case "dataverse_assign": {
            const { entitySetName, id, ownerType, ownerId } = AssignInput.parse(args);
            const entityRef = ownerType === "systemuser" ? "systemusers" : "teams";
            await client.updateRecord(entitySetName, id, {
                "ownerid@odata.bind": `/${entityRef}(${ownerId})`,
            });
            return formatData(`Assigned record ${id} in ${entitySetName} to new owner`, { message: "Record assigned successfully" }, [
                "Use dataverse_list_users or dataverse_list_teams to find valid owners",
            ]);
        }
        default:
            throw new Error(`Unknown CRUD tool: ${name}`);
    }
}
//# sourceMappingURL=crud.tools.js.map