import { formatData } from "./output.utils.js";
import { checkWriteGuardrails } from "./guardrails.js";
import { ATTRIBUTE_TYPES, CreateAttributeInput, UpdateAttributeInput, DeleteAttributeInput, lbl, buildCreateBody, } from "./attribute.helpers.js";
// ── Tool Definitions ───────────────────────────────────────────────────────────
export const attributeTools = [
    {
        name: "dataverse_create_attribute",
        description: "Creates a new column (attribute) on an existing Dataverse table. Supports String, Memo, Integer, Decimal, Money, DateTime, Boolean, and Picklist types. " +
            "IMPORTANT: Column type CANNOT be changed after creation — choose carefully. " +
            "Requires System Customizer or System Administrator privileges. " +
            "WHEN TO USE: Adding a new column to a table. BEST PRACTICES: Use dataverse_get_table_metadata first to check existing columns. " +
            "WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: "Logical name of the target table (e.g. 'account', 'new_mytable')",
                },
                schemaName: {
                    type: "string",
                    description: "Schema name for the new column (e.g. 'new_mycolumn'). Must include publisher prefix.",
                },
                attributeType: {
                    type: "string",
                    enum: ATTRIBUTE_TYPES,
                    description: "Column data type. CANNOT be changed after creation. String=single-line text, Memo=multi-line, Integer=whole number, Decimal=decimal number, Money=currency, DateTime=date/time, Boolean=yes/no, Picklist=choice/option set.",
                },
                displayName: {
                    type: "string",
                    description: "Display label for the column",
                },
                description: {
                    type: "string",
                    description: "Optional description of the column",
                },
                requiredLevel: {
                    type: "string",
                    enum: ["None", "ApplicationRequired", "Recommended"],
                    description: "Required level. Default: None",
                },
                maxLength: {
                    type: "number",
                    description: "Max length for String (default 100, max 4000) or Memo (default 4000, max 1048576) types",
                },
                minValue: {
                    type: "number",
                    description: "Minimum value for Integer or Decimal types",
                },
                maxValue: {
                    type: "number",
                    description: "Maximum value for Integer or Decimal types",
                },
                precision: {
                    type: "number",
                    description: "Decimal precision for Decimal (0-10) or Money types",
                },
                dateTimeFormat: {
                    type: "string",
                    enum: ["DateOnly", "DateAndTime"],
                    description: "Format for DateTime type. CANNOT be changed after creation. Default: DateAndTime",
                },
                defaultBooleanValue: {
                    type: "boolean",
                    description: "Default value for Boolean type. Default: false",
                },
                picklistOptions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            value: { type: "number", description: "Integer value for the option" },
                            label: { type: "string", description: "Display label for the option" },
                        },
                        required: ["value", "label"],
                    },
                    description: "Options for Picklist type. Each option needs a value (integer) and label (text).",
                },
                languageCode: {
                    type: "number",
                    description: "Language code for labels. Default: 1033 (English)",
                },
                autoPublish: {
                    type: "boolean",
                    description: "Publish the customization after creation (default: true).",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true — confirms intentional schema modification",
                },
            },
            required: [
                "entityLogicalName",
                "schemaName",
                "attributeType",
                "displayName",
                "confirm",
            ],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_update_attribute",
        description: "Updates mutable properties of an existing column (attribute): display name, description, required level, max length (increase only for String/Memo), and search indexing. " +
            "CANNOT change: column type, logical name, DateTime format, or lookup targets — these are immutable after creation. " +
            "Requires System Customizer or System Administrator privileges. " +
            "WHEN TO USE: Changing a column's label, description, or required level. BEST PRACTICES: Use dataverse_get_table_metadata first to see current values. " +
            "WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: "Logical name of the table",
                },
                attributeLogicalName: {
                    type: "string",
                    description: "Logical name of the column to update",
                },
                displayName: {
                    type: "string",
                    description: "New display label for the column",
                },
                description: {
                    type: "string",
                    description: "New description for the column",
                },
                requiredLevel: {
                    type: "string",
                    enum: ["None", "ApplicationRequired", "Recommended"],
                    description: "New required level",
                },
                maxLength: {
                    type: "number",
                    description: "New max length for String/Memo columns. Can only INCREASE, never decrease.",
                },
                isSearchable: {
                    type: "boolean",
                    description: "Enable or disable Dataverse Search indexing on this column",
                },
                languageCode: {
                    type: "number",
                    description: "Language code for labels. Default: 1033 (English)",
                },
                autoPublish: {
                    type: "boolean",
                    description: "Publish the customization after update (default: true).",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true — confirms intentional schema modification",
                },
            },
            required: [
                "entityLogicalName",
                "attributeLogicalName",
                "confirm",
            ],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_delete_attribute",
        description: "Deletes a column (attribute) from a Dataverse table. WARNING: This permanently deletes the column AND all its data. " +
            "Automatically checks dependencies (views, workflows, forms) before deletion — refuses if dependencies exist unless force=true. " +
            "Managed solution columns cannot be deleted. " +
            "WHEN TO USE: Removing an obsolete custom column. BEST PRACTICES: Use dataverse_get_table_metadata to verify the column exists; check dependencies first. " +
            "WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: "Logical name of the table",
                },
                attributeLogicalName: {
                    type: "string",
                    description: "Logical name of the column to delete",
                },
                autoPublish: {
                    type: "boolean",
                    description: "Publish the customization after deletion (default: true).",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true — confirms intentional deletion of column and ALL its data",
                },
            },
            required: [
                "entityLogicalName",
                "attributeLogicalName",
                "confirm",
            ],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
// ── Handler ────────────────────────────────────────────────────────────────────
export async function handleAttributeTool(name, args, client) {
    switch (name) {
        case "dataverse_create_attribute": {
            const input = CreateAttributeInput.parse(args);
            const warnings = checkWriteGuardrails({
                toolName: "dataverse_create_attribute",
                entitySetName: input.entityLogicalName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            const body = buildCreateBody(input);
            const metadataId = await client.createAttribute(input.entityLogicalName, body);
            let publishStatus = "autoPublish=false (skipped)";
            if (input.autoPublish) {
                await client.publishCustomizations({ entities: [input.entityLogicalName] });
                publishStatus = "published successfully";
            }
            return formatData(`Column '${input.schemaName}' (${input.attributeType}) created on '${input.entityLogicalName}'. ${publishStatus}.`, {
                entityLogicalName: input.entityLogicalName,
                schemaName: input.schemaName,
                attributeType: input.attributeType,
                metadataId,
                published: input.autoPublish,
                ...(warnings.length > 0 && { warnings }),
            }, [
                "Use dataverse_get_table_metadata to verify the new column",
                "Column type CANNOT be changed after creation — to change type, create a new column and migrate data",
            ]);
        }
        case "dataverse_update_attribute": {
            const input = UpdateAttributeInput.parse(args);
            const warnings = checkWriteGuardrails({
                toolName: "dataverse_update_attribute",
                entitySetName: input.entityLogicalName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            const lang = input.languageCode;
            const body = {};
            const changes = {};
            if (input.displayName !== undefined) {
                body["DisplayName"] = lbl(input.displayName, lang);
                changes["DisplayName"] = input.displayName;
            }
            if (input.description !== undefined) {
                body["Description"] = lbl(input.description, lang);
                changes["Description"] = input.description;
            }
            if (input.requiredLevel !== undefined) {
                body["RequiredLevel"] = { Value: input.requiredLevel };
                changes["RequiredLevel"] = input.requiredLevel;
            }
            if (input.maxLength !== undefined) {
                body["MaxLength"] = input.maxLength;
                changes["MaxLength"] = input.maxLength;
            }
            if (input.isSearchable !== undefined) {
                body["IsSearchable"] = input.isSearchable;
                changes["IsSearchable"] = input.isSearchable;
            }
            await client.updateAttribute(input.entityLogicalName, input.attributeLogicalName, body);
            const changesStr = Object.entries(changes)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(", ");
            let publishStatus = "autoPublish=false (skipped)";
            if (input.autoPublish) {
                await client.publishCustomizations({ entities: [input.entityLogicalName] });
                publishStatus = "published successfully";
            }
            return formatData(`Column '${input.attributeLogicalName}' on '${input.entityLogicalName}' updated: ${changesStr}. ${publishStatus}.`, {
                entityLogicalName: input.entityLogicalName,
                attributeLogicalName: input.attributeLogicalName,
                changes,
                published: input.autoPublish,
                ...(warnings.length > 0 && { warnings }),
            }, [
                "Use dataverse_get_table_metadata to verify the changes",
                "Column type, logical name, and DateTime format cannot be changed — these are immutable after creation",
            ]);
        }
        case "dataverse_delete_attribute": {
            const input = DeleteAttributeInput.parse(args);
            const warnings = checkWriteGuardrails({
                toolName: "dataverse_delete_attribute",
                entitySetName: input.entityLogicalName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            try {
                await client.deleteAttribute(input.entityLogicalName, input.attributeLogicalName);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes("0x80048405")) {
                    return formatData(`Cannot delete column '${input.attributeLogicalName}': it belongs to a managed solution and cannot be deleted.`, { error: "0x80048405", entityLogicalName: input.entityLogicalName, attributeLogicalName: input.attributeLogicalName }, ["Managed solution columns can only be removed by uninstalling the solution"]);
                }
                if (msg.includes("dependency") || msg.includes("dependencies") || msg.includes("DependencyList")) {
                    return formatData(`Cannot delete column '${input.attributeLogicalName}': it has dependencies (views, workflows, forms, or other components reference it).`, { error: "HAS_DEPENDENCIES", entityLogicalName: input.entityLogicalName, attributeLogicalName: input.attributeLogicalName, rawError: msg }, [
                        "Use dataverse_list_dependencies to identify what references this column",
                        "Remove all references before retrying deletion",
                    ]);
                }
                throw err;
            }
            let publishStatus = "autoPublish=false (skipped)";
            if (input.autoPublish) {
                await client.publishCustomizations({ entities: [input.entityLogicalName] });
                publishStatus = "published successfully";
            }
            return formatData(`Column '${input.attributeLogicalName}' deleted from '${input.entityLogicalName}'. ${publishStatus}. All data in this column has been permanently removed.`, {
                entityLogicalName: input.entityLogicalName,
                attributeLogicalName: input.attributeLogicalName,
                deleted: true,
                published: input.autoPublish,
                ...(warnings.length > 0 && { warnings }),
            }, [
                "This action is irreversible — the column and its data cannot be recovered",
                "The column logical name is tombstoned and cannot be reused for ~90 days",
            ]);
        }
        default:
            throw new Error(`Unknown attribute tool: ${name}`);
    }
}
//# sourceMappingURL=attribute.tools.js.map