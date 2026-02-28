import { z } from "zod";
import { formatData } from "./output.utils.js";
export const qualityTools = [
    {
        name: "dataverse_detect_duplicates",
        description: "Checks for potential duplicate records before creating. Uses Dataverse built-in duplicate detection rules. Pass the prospective record fields to check against existing records. WHEN TO USE: Before creating a new record to check if a duplicate already exists. BEST PRACTICES: Duplicate detection rules must be configured in Dataverse admin; pass key identifying fields only. WORKFLOW: create_record.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: 'Table to check, e.g., "account"',
                },
                record: {
                    type: "object",
                    description: "The prospective record fields to check for duplicates",
                },
                top: {
                    type: "number",
                    description: "Maximum number of duplicates to return (default 5, max 20)",
                },
            },
            required: ["entityLogicalName", "record"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const DetectDuplicatesInput = z.object({
    entityLogicalName: z
        .string()
        .min(1)
        .regex(/^[a-z_][a-z0-9_]*$/i, "Must be a valid Dataverse logical name"),
    record: z.record(z.string(), z.unknown()),
    top: z.number().int().positive().max(20).optional().default(5),
});
export async function handleQualityTool(name, args, client) {
    switch (name) {
        case "dataverse_detect_duplicates": {
            const params = DetectDuplicatesInput.parse(args);
            const body = {
                BusinessEntity: {
                    "@odata.type": `Microsoft.Dynamics.CRM.${params.entityLogicalName}`,
                    ...params.record,
                },
                MatchingEntityName: params.entityLogicalName,
                PagingInfo: {
                    PageNumber: 1,
                    Count: params.top,
                },
            };
            const raw = (await client.executeAction("RetrieveDuplicates", body));
            const duplicates = (raw["value"] ?? []);
            const result = {
                hasDuplicates: duplicates.length > 0,
                duplicateCount: duplicates.length,
                duplicates: duplicates.map((d) => {
                    const clean = {};
                    for (const [key, val] of Object.entries(d)) {
                        if (!key.startsWith("@"))
                            clean[key] = val;
                    }
                    return clean;
                }),
            };
            return formatData(`Duplicate detection: ${result.hasDuplicates ? "duplicates found" : "no duplicates"}`, result, ["Review duplicate records before creating new ones"]);
        }
        default:
            throw new Error(`Unknown quality tool: ${name}`);
    }
}
//# sourceMappingURL=quality.tools.js.map