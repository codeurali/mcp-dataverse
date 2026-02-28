import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const GetUserRolesInput = z.object({
    userId: z.string().uuid(),
});
const ListUsersInput = z
    .object({
    search: z.string().optional(),
    businessUnitId: z.string().optional(),
    includeDisabled: z.boolean().optional().default(false),
    includeApplicationUsers: z.boolean().optional().default(false),
    top: z.number().int().positive().max(100).optional().default(20),
})
    .refine((data) => data.search || data.businessUnitId, {
    message: "At least one of search or businessUnitId is required",
});
export const userTools = [
    {
        name: "dataverse_get_user_roles",
        description: "Returns all security roles assigned to a Dataverse system user. Provide the user GUID to retrieve full name, domain name (UPN), and the list of roles with role ID, name, and managed status. WHEN TO USE: Checking what security roles a user has for permission auditing or troubleshooting. BEST PRACTICES: Use the userId from dataverse_whoami or dataverse_list_users. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                userId: {
                    type: "string",
                    description: "The system user GUID",
                },
            },
            required: ["userId"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_list_users",
        description: "Searches Dataverse system users by name or email. Returns user ID, full name, domain name (UPN), email, business unit, and disabled status. Excludes application users and disabled users by default. WHEN TO USE: Finding user GUIDs for impersonation, record assignment, or permission review. BEST PRACTICES: Search by name or email; set includeDisabled=true for former employees. WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                search: {
                    type: "string",
                    description: "Full-name or email contains-search",
                },
                businessUnitId: {
                    type: "string",
                    description: "Restrict to a business unit (GUID)",
                },
                includeDisabled: {
                    type: "boolean",
                    description: "Include disabled users (default false)",
                },
                includeApplicationUsers: {
                    type: "boolean",
                    description: "Include application/service users (default false)",
                },
                top: {
                    type: "number",
                    description: "Maximum number of results (default 20, max 100)",
                },
            },
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
export async function handleUserTool(name, args, client) {
    switch (name) {
        case "dataverse_get_user_roles": {
            const { userId } = GetUserRolesInput.parse(args);
            const response = await client.query("systemusers", {
                filter: `systemuserid eq ${userId}`,
                select: ["fullname", "domainname"],
                expand: "systemuserroles_association($select=name,roleid,ismanaged)",
                top: 1,
            });
            const rows = (response.value ?? []);
            if (rows.length === 0) {
                throw new Error(`User with ID '${userId}' not found`);
            }
            const user = rows[0];
            const rawRoles = (user["systemuserroles_association"] ?? []);
            const roles = rawRoles.map((r) => ({
                roleId: r["roleid"] ?? "",
                name: r["name"] ?? "",
                isManaged: r["ismanaged"] === true,
            }));
            return formatData(`${roles.length} roles assigned to user`, {
                userId,
                fullname: user["fullname"] ?? "",
                domainname: user["domainname"] ?? "",
                roles,
                roleCount: roles.length,
            }, ["Use dataverse_impersonate to execute operations as this user"]);
        }
        case "dataverse_list_users": {
            const params = ListUsersInput.parse(args);
            const filterParts = [];
            if (!params.includeDisabled) {
                filterParts.push("isdisabled eq false");
            }
            if (!params.includeApplicationUsers) {
                filterParts.push("applicationid eq null");
            }
            if (params.search) {
                const escaped = esc(params.search);
                filterParts.push(`(contains(fullname,'${escaped}') or contains(internalemailaddress,'${escaped}'))`);
            }
            if (params.businessUnitId) {
                filterParts.push(`_businessunitid_value eq ${params.businessUnitId}`);
            }
            const response = await client.query("systemusers", {
                select: [
                    "systemuserid",
                    "fullname",
                    "domainname",
                    "internalemailaddress",
                    "applicationid",
                    "isdisabled",
                ],
                filter: filterParts.join(" and "),
                expand: "businessunitid($select=name)",
                orderby: "fullname asc",
                top: params.top,
            });
            const rows = (response.value ?? []);
            const users = rows.map((row) => ({
                id: row["systemuserid"] ?? "",
                fullName: row["fullname"] ?? "",
                domainName: row["domainname"] ?? "",
                email: row["internalemailaddress"] ?? "",
                businessUnit: row["businessunitid"]?.["name"] ??
                    null,
                isDisabled: row["isdisabled"] === true,
                isApplicationUser: row["applicationid"] != null,
            }));
            return formatData(`${users.length} users found`, { users, count: users.length }, ["Use dataverse_get_user_roles to inspect specific user permissions"]);
        }
        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
//# sourceMappingURL=users.tools.js.map