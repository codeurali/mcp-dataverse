import { formatData } from "./output.utils.js";
export const authTools = [
    {
        name: "dataverse_whoami",
        description: "Returns the current authenticated user context from Dataverse WhoAmI: userId, businessUnitId, organizationId, organizationName, and environmentUrl. Use this to verify authentication is working, retrieve the current user context, or obtain IDs needed for subsequent operations. WHEN TO USE: Verifying authentication, getting current user/org context, or obtaining IDs for downstream operations. BEST PRACTICES: Call first to confirm connectivity before other tools. WORKFLOW: query_data.",
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
];
export async function handleAuthTool(name, _args, client) {
    if (name === "dataverse_whoami") {
        const result = await client.whoAmI();
        const data = {
            userId: result.UserId,
            businessUnitId: result.BusinessUnitId,
            organizationId: result.OrganizationId,
            organizationName: result.OrganizationName,
            environmentUrl: result.EnvironmentUrl,
        };
        return formatData(`Authenticated as ${result.OrganizationName}`, data, [
            "Use dataverse_list_tables to discover available tables",
            "Use dataverse_get_table_metadata to inspect a table schema",
        ]);
    }
    throw new Error(`Unknown auth tool: ${name}`);
}
//# sourceMappingURL=auth.tools.js.map