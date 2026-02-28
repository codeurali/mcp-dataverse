import { z } from "zod";
import { formatData } from "./output.utils.js";
const ListBusinessUnitsInput = z.object({
    top: z.number().int().positive().max(200).optional().default(50),
    includeDisabled: z.boolean().optional().default(false),
});
export const orgTools = [
    {
        name: "dataverse_list_business_units",
        description: "Lists business units in the Dataverse environment. Returns name, ID, parent business unit ID, disabled status, and creation date. By default only active business units are returned. WHEN TO USE: Finding business unit IDs for user management, team setup, or security role scope. BEST PRACTICES: The root business unit is the parent of all others; filter disabled units by default. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                top: {
                    type: "number",
                    description: "Maximum number of results (default 50, max 200)",
                },
                includeDisabled: {
                    type: "boolean",
                    description: "Include disabled business units (default false)",
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
];
export async function handleOrgTool(name, args, client) {
    switch (name) {
        case "dataverse_list_business_units": {
            const { top, includeDisabled } = ListBusinessUnitsInput.parse(args ?? {});
            const filter = includeDisabled ? undefined : "isdisabled eq false";
            const result = await client.query("businessunits", {
                select: [
                    "businessunitid",
                    "name",
                    "parentbusinessunitid",
                    "isdisabled",
                    "createdon",
                ],
                ...(filter ? { filter } : {}),
                orderby: "name asc",
                top,
            });
            const units = result.value.map((bu) => ({
                id: bu.businessunitid,
                name: bu.name,
                parentBusinessUnitId: bu.parentbusinessunitid ?? null,
                isDisabled: bu.isdisabled,
                createdOn: bu.createdon,
            }));
            return formatData(`${units.length} business units found`, { businessUnits: units, count: units.length }, [
                "Use business unit IDs for user management or security role assignment",
            ]);
        }
        default:
            throw new Error(`Unknown org tool: ${name}`);
    }
}
//# sourceMappingURL=org.tools.js.map