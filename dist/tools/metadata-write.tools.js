import { z } from "zod";
import { formatData } from "./output.utils.js";
import { checkWriteGuardrails } from "./guardrails.js";
export const metadataWriteTools = [
    {
        name: "dataverse_update_entity",
        description: "Updates configuration flags on an existing Dataverse entity definition — enables or disables Notes (HasNotes), Change Tracking, and Audit. " +
            "Requires System Customizer or System Administrator privileges. WHEN TO USE: Enabling notes/attachments support, change tracking, or audit on a table. " +
            "BEST PRACTICES: Set autoPublish=true (default) to make changes visible immediately. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: "Logical name of the entity to update (e.g. 'account', 'new_mytable')",
                },
                hasNotes: {
                    type: "boolean",
                    description: "Enable or disable the Notes/Attachments feature for this entity",
                },
                changeTrackingEnabled: {
                    type: "boolean",
                    description: "Enable or disable change tracking (required for delta sync)",
                },
                isAuditEnabled: {
                    type: "boolean",
                    description: "Enable or disable auditing on this entity",
                },
                autoPublish: {
                    type: "boolean",
                    description: "Publish the customization after update (default: true). Set false to defer publishing.",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true — confirms intentional schema modification to Dataverse entity metadata",
                },
            },
            required: ["entityLogicalName", "confirm"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
// ── Zod Schema ─────────────────────────────────────────────────────────────────
const UpdateEntityInput = z
    .object({
    entityLogicalName: z
        .string()
        .min(1)
        .regex(/^[a-z_][a-z0-9_]*$/, "Invalid logical name"),
    confirm: z.literal(true, {
        errorMap: () => ({
            message: "Set confirm: true to modify entity metadata",
        }),
    }),
    hasNotes: z.boolean().optional(),
    changeTrackingEnabled: z.boolean().optional(),
    isAuditEnabled: z.boolean().optional(),
    autoPublish: z.boolean().optional().default(true),
})
    .refine((d) => d.hasNotes !== undefined ||
    d.changeTrackingEnabled !== undefined ||
    d.isAuditEnabled !== undefined, {
    message: "At least one of hasNotes, changeTrackingEnabled, or isAuditEnabled must be provided",
});
// ── Handler ────────────────────────────────────────────────────────────────────
export async function handleMetadataWriteTool(name, args, client) {
    switch (name) {
        case "dataverse_update_entity": {
            const { entityLogicalName, hasNotes, changeTrackingEnabled, isAuditEnabled, autoPublish, } = UpdateEntityInput.parse(args);
            const writeWarnings = checkWriteGuardrails({
                toolName: "dataverse_update_entity",
                entitySetName: entityLogicalName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            const displayValues = {};
            if (hasNotes !== undefined)
                displayValues["HasNotes"] = hasNotes;
            if (changeTrackingEnabled !== undefined)
                displayValues["ChangeTrackingEnabled"] = changeTrackingEnabled;
            if (isAuditEnabled !== undefined)
                displayValues["IsAuditEnabled"] = isAuditEnabled;
            const body = {
                "@odata.type": "#Microsoft.Dynamics.CRM.EntityMetadata",
            };
            // HasNotes is Edm.Boolean (plain bool), NOT a BooleanManagedProperty
            if (hasNotes !== undefined)
                body["HasNotes"] = hasNotes;
            if (changeTrackingEnabled !== undefined)
                body["ChangeTrackingEnabled"] = changeTrackingEnabled;
            // IsAuditEnabled is a BooleanManagedProperty — requires { Value: bool } wrapper
            if (isAuditEnabled !== undefined)
                body["IsAuditEnabled"] = { Value: isAuditEnabled };
            try {
                await client.updateEntityDefinition(entityLogicalName, body);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes("0x80060888")) {
                    return formatData(`Cannot update entity '${entityLogicalName}': operation not supported by Dataverse.`, { error: "0x80060888", entityLogicalName, requestedChanges: displayValues }, [
                        "IsAuditEnabled requires organization-level auditing to be enabled first: Power Platform admin center > Settings > Audit and logs > Start Auditing",
                        "ChangeTrackingEnabled may be blocked if the entity is part of a managed solution",
                        "HasNotes=true/false should work for custom (unmanaged) entities",
                    ]);
                }
                throw err;
            }
            const changes = Object.entries(displayValues)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(", ");
            let publishStatus = "autoPublish=false (skipped)";
            if (autoPublish) {
                await client.publishCustomizations({ entities: [entityLogicalName] });
                publishStatus = "published successfully";
            }
            return formatData(`Entity '${entityLogicalName}' updated: ${changes}. ${publishStatus}.`, {
                entityLogicalName,
                changes: displayValues,
                published: autoPublish,
                ...(writeWarnings.length > 0 && { warnings: writeWarnings }),
            }, [
                "Use dataverse_get_table_metadata to verify the changes",
                "Enable HasNotes=true before using dataverse_create_annotation",
            ]);
        }
        default:
            throw new Error(`Unknown metadata tool: ${name}`);
    }
}
//# sourceMappingURL=metadata-write.tools.js.map