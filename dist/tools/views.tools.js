import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const ListViewsInput = z.object({
    entityLogicalName: z.string().min(1),
    includePersonal: z.boolean().optional().default(false),
    top: z.number().int().positive().max(100).optional().default(20),
});
export const viewTools = [
    {
        name: "dataverse_list_views",
        description: "Lists saved views (system and optionally personal) for a Dataverse table. System views come from savedqueries; personal views come from userqueries. Returns view name, ID, default flag, query type, and description. WHEN TO USE: Discovering saved system or personal views for a table. BEST PRACTICES: Use the view's FetchXML with dataverse_execute_fetchxml to run it. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                entityLogicalName: {
                    type: "string",
                    description: 'Logical name of the entity to list views for (e.g., "account")',
                },
                includePersonal: {
                    type: "boolean",
                    description: "Include personal (user) views in addition to system views (default false)",
                },
                top: {
                    type: "number",
                    description: "Maximum number of results per category (default 20, max 100)",
                },
            },
            required: ["entityLogicalName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
export async function handleViewTool(name, args, client) {
    switch (name) {
        case "dataverse_list_views": {
            const { entityLogicalName, includePersonal, top } = ListViewsInput.parse(args);
            const escaped = esc(entityLogicalName);
            const systemResult = await client.query("savedqueries", {
                filter: `returnedtypecode eq '${escaped}' and statecode eq 0`,
                select: [
                    "savedqueryid",
                    "name",
                    "isdefault",
                    "querytype",
                    "description",
                ],
                orderby: "name asc",
                top,
            });
            const systemViews = systemResult.value.map((v) => ({
                id: v.savedqueryid,
                name: v.name,
                isDefault: v.isdefault,
                queryType: v.querytype,
                description: v.description ?? null,
                viewType: "system",
            }));
            let personalViews = [];
            if (includePersonal) {
                const personalResult = await client.query("userqueries", {
                    filter: `returnedtypecode eq '${escaped}'`,
                    select: ["userqueryid", "name", "description"],
                    orderby: "name asc",
                    top,
                });
                personalViews = personalResult.value.map((v) => ({
                    id: v.userqueryid,
                    name: v.name,
                    description: v.description ?? null,
                    viewType: "personal",
                }));
            }
            const totalCount = systemViews.length + personalViews.length;
            return formatData(`${totalCount} views found for ${entityLogicalName}`, {
                entityLogicalName,
                systemViews,
                systemViewCount: systemViews.length,
                personalViews: includePersonal ? personalViews : undefined,
                personalViewCount: includePersonal ? personalViews.length : undefined,
            }, ["Use the view's fetchxml with dataverse_execute_fetchxml to run it"]);
        }
        default:
            throw new Error(`Unknown view tool: ${name}`);
    }
}
//# sourceMappingURL=views.tools.js.map