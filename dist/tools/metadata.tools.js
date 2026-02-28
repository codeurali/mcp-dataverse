import { z } from "zod";
import { formatData, formatList } from "./output.utils.js";
export const metadataTools = [
    {
        name: "dataverse_list_tables",
        description: "Lists all Dataverse tables. By default returns ONLY custom (non-system) tables. Set includeSystemTables=true to include all ~1700+ system tables. WHEN TO USE: Discovering which tables exist in the environment. BEST PRACTICES: Start without includeSystemTables to focus on custom tables; use dataverse_get_table_metadata for column details. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                includeSystemTables: {
                    type: "boolean",
                    description: "Include system tables. Default false = custom tables only.",
                },
            },
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_get_table_metadata",
        description: "Returns full schema metadata for a Dataverse table: all attribute (column) logical names, display names, data types, required levels, and lookup target entities. Use this before writing queries or creating/updating records to confirm correct field names and types. Set includeAttributes=false if you only need table-level metadata without column details. WHEN TO USE: Before building queries or creating/updating records to validate field names, types, and required levels. BEST PRACTICES: Set includeAttributes=false for table-level info only; call once and reuse results. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                logicalName: {
                    type: "string",
                    description: 'The logical name of the table (e.g., "account", "contact", "new_mytable")',
                },
                includeAttributes: {
                    type: "boolean",
                    description: "Include attribute (column) definitions. Default: true",
                },
            },
            required: ["logicalName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_get_relationships",
        description: "Returns all relationship definitions (1:N, N:1, N:N) for a Dataverse table, including relationship schema names, referenced/referencing entity names, and lookup attribute names. Use to determine the correct relationshipName for dataverse_associate/dataverse_disassociate, or to map lookup fields before building FetchXML joins. Use relationshipType to filter results. WHEN TO USE: Finding relationship schema names for associate/disassociate, or mapping lookups for FetchXML joins. BEST PRACTICES: Filter by relationshipType to reduce output size. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                logicalName: {
                    type: "string",
                    description: "The logical name of the table",
                },
                relationshipType: {
                    type: "string",
                    enum: ["OneToMany", "ManyToOne", "ManyToMany", "All"],
                    description: "Filter by relationship type. Default: All",
                },
            },
            required: ["logicalName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_list_global_option_sets",
        description: "Lists all global (shared) option sets defined in the Dataverse environment, returning their names and metadata IDs. Use this to discover available option sets before calling dataverse_get_option_set to retrieve their values. Prefer this over dataverse_get_table_metadata when you need to find option sets that are reused across multiple tables. WHEN TO USE: Discovering shared option sets reused across multiple tables. BEST PRACTICES: Follow up with dataverse_get_option_set to retrieve individual option values. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_get_option_set",
        description: "Returns all option labels and their integer values for a named global option set. Use this to look up the numeric code for a picklist value before filtering records (e.g., statecode or statuscode equivalents), or to populate dropdowns with correct option values. WHEN TO USE: Looking up numeric codes for picklist filtering or record creation. BEST PRACTICES: Use the integer values in $filter expressions, not the label text. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "The name of the global option set",
                },
            },
            required: ["name"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_get_entity_key",
        description: "Returns all alternate key definitions for a Dataverse table. Useful before using dataverse_upsert to know which fields serve as alternate keys, their index status (Active/InProgress/Failed), and whether they are customizable. WHEN TO USE: Before using dataverse_upsert to verify which fields serve as alternate keys. BEST PRACTICES: Check that key index status is Active before relying on a key. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                tableName: {
                    type: "string",
                    description: 'Logical name of the table (e.g., "account", "contact")',
                },
            },
            required: ["tableName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_get_attribute_option_set",
        description: "Returns all option labels and integer values for a table-specific attribute (Picklist, Status, or State field). Use to look up the numeric codes for a column's choices before filtering or updating records. WHEN TO USE: Looking up option values for a specific table's picklist, status, or state column. BEST PRACTICES: Use the integer values in $filter and when setting fields in create/update. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: 'Logical name of the table (e.g., "account", "contact")',
                },
                attributeLogicalName: {
                    type: "string",
                    description: 'Logical name of the attribute (e.g., "statuscode", "industrycode")',
                },
            },
            required: ["entityLogicalName", "attributeLogicalName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const GetTableMetadataInput = z.object({
    logicalName: z.string().min(1),
    includeAttributes: z.boolean().optional().default(true),
});
const GetRelationshipsInput = z.object({
    logicalName: z.string().min(1),
    relationshipType: z
        .enum(["OneToMany", "ManyToOne", "ManyToMany", "All"])
        .optional(),
});
const ListTablesInput = z.object({
    includeSystemTables: z
        .boolean()
        .default(false)
        .optional()
        .describe("Include system tables. Default false = custom tables only."),
});
const GetOptionSetInput = z.object({
    name: z.string().min(1),
});
const GetEntityKeyInput = z.object({
    tableName: z
        .string()
        .min(1)
        .describe('Logical name of the table (e.g., "account", "contact")'),
});
const DV_NAME_RE = /^[a-z_][a-z0-9_]*$/;
const GetAttributeOptionSetInput = z.object({
    entityLogicalName: z
        .string()
        .min(1)
        .regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    attributeLogicalName: z
        .string()
        .min(1)
        .regex(DV_NAME_RE, "Invalid Dataverse logical name"),
});
export async function handleMetadataTool(name, args, client) {
    switch (name) {
        case "dataverse_list_tables": {
            const { includeSystemTables = false } = ListTablesInput.parse(args ?? {});
            const customOnly = !includeSystemTables;
            const result = await client.listTables(customOnly);
            const tables = Array.isArray(result) ? result : [];
            return formatList(`tables (${customOnly ? "custom only" : "including system"})`, tables, [
                "Use dataverse_get_table_metadata to inspect a specific table's columns and types",
            ]);
        }
        case "dataverse_get_table_metadata": {
            const { logicalName, includeAttributes } = GetTableMetadataInput.parse(args);
            const result = await client.getTableMetadata(logicalName, includeAttributes);
            const attributeCount = Array.isArray(result?.Attributes)
                ? result.Attributes.length
                : 0;
            return formatData(`Metadata for ${logicalName}: ${attributeCount} attributes`, result, [
                "Use dataverse_query to read records from this table",
                "Use dataverse_get_relationships to see related tables",
            ]);
        }
        case "dataverse_get_relationships": {
            const { logicalName, relationshipType } = GetRelationshipsInput.parse(args);
            const rawRelationships = await client.getRelationships(logicalName);
            const lname = logicalName.toLowerCase();
            const oneToMany = rawRelationships.filter((r) => r.RelationshipType === "OneToManyRelationship" &&
                r.ReferencedEntity?.toLowerCase() === lname);
            const manyToOne = rawRelationships.filter((r) => r.RelationshipType === "OneToManyRelationship" &&
                r.ReferencingEntity?.toLowerCase() === lname);
            const manyToMany = rawRelationships.filter((r) => r.RelationshipType === "ManyToManyRelationship");
            const includeAll = !relationshipType || relationshipType === "All";
            const allRels = [
                ...(includeAll || relationshipType === "OneToMany" ? oneToMany : []),
                ...(includeAll || relationshipType === "ManyToOne" ? manyToOne : []),
                ...(includeAll || relationshipType === "ManyToMany" ? manyToMany : []),
            ];
            return formatData(`${allRels.length} relationships found for ${logicalName}`, {
                tableName: logicalName,
                oneToMany: includeAll || relationshipType === "OneToMany"
                    ? oneToMany
                    : undefined,
                manyToOne: includeAll || relationshipType === "ManyToOne"
                    ? manyToOne
                    : undefined,
                manyToMany: includeAll || relationshipType === "ManyToMany"
                    ? manyToMany
                    : undefined,
            }, [
                "Use dataverse_associate or dataverse_disassociate to manage N:N relationships",
            ]);
        }
        case "dataverse_list_global_option_sets": {
            const result = await client.listGlobalOptionSets();
            const items = Array.isArray(result) ? result : [];
            return formatList("global option sets", items, [
                "Use dataverse_get_option_set with a name to see the values",
            ]);
        }
        case "dataverse_get_option_set": {
            const { name: optionSetName } = GetOptionSetInput.parse(args);
            const result = await client.getOptionSet(optionSetName);
            const options = Array.isArray(result?.Options)
                ? result.Options
                : [];
            return formatData(`Option set '${optionSetName}': ${options.length} options`, result, [
                "Use these values in $filter expressions or when creating/updating records",
            ]);
        }
        case "dataverse_get_entity_key": {
            const { tableName } = GetEntityKeyInput.parse(args);
            const keys = await client.getEntityKeys(tableName);
            return formatData(`${keys.length} alternate keys for ${tableName}`, { tableName, keys, count: keys.length }, [
                "Use dataverse_upsert with these keys for create-or-update operations",
            ]);
        }
        case "dataverse_get_attribute_option_set": {
            const { entityLogicalName, attributeLogicalName } = GetAttributeOptionSetInput.parse(args);
            const result = await client.getAttributeOptionSet(entityLogicalName, attributeLogicalName);
            const options = Array.isArray(result?.Options)
                ? result.Options
                : [];
            return formatData(`Attribute '${attributeLogicalName}' on '${entityLogicalName}': ${options.length} options`, result, [
                "Use these integer values in $filter or when creating/updating records",
            ]);
        }
        default:
            throw new Error(`Unknown metadata tool: ${name}`);
    }
}
//# sourceMappingURL=metadata.tools.js.map