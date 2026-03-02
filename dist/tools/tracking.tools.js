import { z } from "zod";
import { safeEntitySetName } from "./validation.utils.js";
import { formatData, formatPrerequisiteError } from "./output.utils.js";
export const trackingTools = [
    {
        name: "dataverse_change_detection",
        description: "Detects new, modified, and deleted records since a previous sync using Dataverse change tracking (delta queries). On first call, pass deltaToken=null to get an initial snapshot and receive a token. On subsequent calls, pass the returned token to retrieve only changes since last sync. Change tracking must be enabled on the table in Dataverse settings. Returns newAndModified records, deleted record IDs, and the nextDeltaToken for the next call. WHEN TO USE: Incremental sync — detecting records created, updated, or deleted since a previous snapshot. BEST PRACTICES: Store the deltaToken persistently; always specify $select to minimize payload. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name (e.g., "accounts")',
                },
                deltaToken: {
                    anyOf: [{ type: "string" }, { type: "null" }],
                    description: "Delta token from a previous call, or null for the initial sync",
                },
                select: {
                    type: "array",
                    items: { type: "string" },
                    description: "Columns to return (recommended to minimise payload)",
                },
            },
            required: ["entitySetName", "deltaToken"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const ChangeDetectionInput = z.object({
    entitySetName: safeEntitySetName,
    deltaToken: z.string().nullable(),
    select: z.array(z.string()).optional(),
});
export async function handleTrackingTool(name, args, client) {
    if (name === "dataverse_change_detection") {
        const { entitySetName, deltaToken, select } = ChangeDetectionInput.parse(args);
        let result;
        try {
            result = await client.getChangedRecords(entitySetName, deltaToken, select);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (/change.?track|0x80072491/i.test(msg)) {
                return formatPrerequisiteError({
                    type: "feature_disabled",
                    feature: "Change Tracking",
                    cannotProceedBecause: `Change tracking is not enabled on '${entitySetName}', so delta queries cannot be executed.`,
                    adminPortal: "Power Apps Maker Portal",
                    steps: [
                        `Open Power Apps maker portal (make.powerapps.com)`,
                        `Navigate to Tables → search for '${entitySetName}'`,
                        `Open the table → click the Settings (gear) icon`,
                        `Enable "Track changes"`,
                        `Save the table, then publish customizations`,
                    ],
                    fixableViaToolName: "dataverse_update_entity",
                });
            }
            throw err;
        }
        const changed = Array.isArray(result?.newAndModified)
            ? result.newAndModified
            : [];
        return formatData(`${changed.length} changed records detected`, result, [
            "Store the returned deltaToken for subsequent incremental sync",
        ]);
    }
    throw new Error(`Unknown tracking tool: ${name}`);
}
//# sourceMappingURL=tracking.tools.js.map