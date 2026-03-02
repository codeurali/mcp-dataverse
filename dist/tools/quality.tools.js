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
            function xmlEsc(v) {
                return String(v)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&apos;");
            }
            const conditions = Object.entries(params.record)
                .filter(([, v]) => v !== null && v !== undefined)
                .map(([key, value]) => `<condition attribute="${xmlEsc(key)}" operator="eq" value="${xmlEsc(String(value))}" />`)
                .join("\n      ");
            if (!conditions) {
                return formatData("No fields provided for duplicate detection", { hasDuplicates: false, duplicateCount: 0, duplicates: [] }, ["Provide at least one field value to check for duplicates"]);
            }
            const entitySetName = params.entityLogicalName + "s";
            const fetchXml = `<fetch top="${params.top}" distinct="true">
  <entity name="${xmlEsc(params.entityLogicalName)}">
    <all-attributes />
    <filter type="or">
      ${conditions}
    </filter>
  </entity>
</fetch>`;
            const rawResult = await client.executeFetchXml(entitySetName, fetchXml);
            const duplicates = (Array.isArray(rawResult)
                ? rawResult
                : Array.isArray(rawResult?.value)
                    ? rawResult.value
                    : []);
            const cleaned = duplicates.map((d) => {
                const clean = {};
                for (const [key, val] of Object.entries(d)) {
                    if (!key.startsWith("@"))
                        clean[key] = val;
                }
                return clean;
            });
            return formatData(`Duplicate detection: ${cleaned.length > 0 ? `${cleaned.length} potential duplicate(s) found` : "no duplicates found"}`, {
                hasDuplicates: cleaned.length > 0,
                duplicateCount: cleaned.length,
                duplicates: cleaned,
                note: "Field exact-match candidates (OR across provided fields). Dataverse duplicate detection rules are not applied via REST API.",
            }, [
                "Review candidate records before creating",
                "For rule-based duplicate detection, configure rules in Dataverse admin",
            ]);
        }
        default:
            throw new Error(`Unknown quality tool: ${name}`);
    }
}
//# sourceMappingURL=quality.tools.js.map