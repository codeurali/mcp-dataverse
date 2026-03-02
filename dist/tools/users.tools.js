import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const GetUserRolesInput = z.object({
    userId: z.string().uuid(),
});
const ListUsersInput = z.object({
    search: z.string().optional(),
    businessUnitId: z.string().optional(),
    includeDisabled: z.boolean().optional().default(false),
    includeApplicationUsers: z.boolean().optional().default(false),
    top: z.number().int().positive().max(100).optional().default(20),
});
const ListRolesInput = z.object({
    nameContains: z.string().optional(),
    businessUnitId: z.string().optional(),
    top: z.number().int().positive().max(200).optional().default(50),
});
const AssignRoleToUserInput = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    confirm: z.literal(true, {
        errorMap: () => ({ message: "confirm must be true to assign a role" }),
    }),
});
const RemoveRoleFromUserInput = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    confirm: z.literal(true, {
        errorMap: () => ({ message: "confirm must be true to remove a role" }),
    }),
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
    {
        name: "dataverse_list_roles",
        description: "Lists security roles in the Dataverse environment. Returns role ID, name, business unit, and managed status. " +
            "Use this to discover role GUIDs before assigning roles to users or teams via dataverse_assign_role_to_user or dataverse_assign_role_to_team. " +
            "WHEN TO USE: Looking up security role GUIDs before RBAC assignment. " +
            "BEST PRACTICES: Filter by businessUnitId or nameContains to narrow results. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                nameContains: {
                    type: "string",
                    description: "Filter roles by name (case-insensitive substring match)",
                },
                businessUnitId: {
                    type: "string",
                    description: "Filter roles to a specific business unit (GUID)",
                },
                top: {
                    type: "number",
                    description: "Maximum number of roles to return (default 50, max 200)",
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
        name: "dataverse_assign_role_to_user",
        description: "Assigns a security role to a Dataverse system user. " +
            "Use dataverse_list_roles to find the role GUID and dataverse_list_users to find the user GUID. " +
            "Requires System Administrator or System Customizer privileges. " +
            "WARNING: This operation modifies user permissions. Set confirm=true to proceed. " +
            "WHEN TO USE: Granting a security role to a user during onboarding or permission changes. " +
            "BEST PRACTICES: Verify role and user GUIDs first; check existing roles with dataverse_get_user_roles. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string", description: "GUID of the system user" },
                roleId: {
                    type: "string",
                    description: "GUID of the security role to assign",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true to proceed with role assignment",
                },
            },
            required: ["userId", "roleId", "confirm"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_remove_role_from_user",
        description: "Removes a security role from a Dataverse system user. " +
            "Uses the same N:N disassociation pattern as dataverse_disassociate. " +
            "WARNING: This modifies user permissions. Set confirm=true to proceed. " +
            "WHEN TO USE: Revoking access by removing a security role from a user. " +
            "BEST PRACTICES: Verify the role is assigned first with dataverse_get_user_roles. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string", description: "GUID of the system user" },
                roleId: {
                    type: "string",
                    description: "GUID of the security role to remove",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true to proceed with role removal",
                },
            },
            required: ["userId", "roleId", "confirm"],
        },
        annotations: {
            readOnlyHint: false,
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
        case "dataverse_list_roles": {
            const { nameContains, businessUnitId, top } = ListRolesInput.parse(args);
            const filters = [];
            if (nameContains)
                filters.push(`contains(name,'${esc(nameContains)}')`);
            if (businessUnitId)
                filters.push(`_businessunitid_value eq ${businessUnitId}`);
            const rolesFilter = filters.length ? filters.join(" and ") : undefined;
            const response = await client.query("roles", {
                select: [
                    "roleid",
                    "name",
                    "description",
                    "ismanaged",
                    "_businessunitid_value",
                ],
                ...(rolesFilter !== undefined ? { filter: rolesFilter } : {}),
                orderby: "name asc",
                top,
            });
            const roles = (response.value ?? []).map((r) => ({
                id: r["roleid"] ?? "",
                name: r["name"] ?? "",
                businessUnitId: r["_businessunitid_value"] ?? null,
                isManaged: r["ismanaged"] === true,
                description: r["description"] ?? "",
            }));
            return formatData(`${roles.length} security roles found`, { roles, count: roles.length }, [
                "Use dataverse_assign_role_to_user or dataverse_assign_role_to_team with the role ID",
            ]);
        }
        case "dataverse_assign_role_to_user": {
            const { userId, roleId } = AssignRoleToUserInput.parse(args);
            // Pre-check: is the role already assigned?
            const checkAssign = await client.query("systemusers", {
                filter: `systemuserid eq ${userId}`,
                select: ["systemuserid"],
                expand: `systemuserroles_association($select=roleid;$filter=roleid eq ${roleId};$top=1)`,
                top: 1,
            });
            const assignUsers = (checkAssign.value ?? []);
            const existingRoles = (assignUsers[0]?.["systemuserroles_association"] ?? []);
            if (existingRoles.length > 0) {
                return formatData("Role is already assigned to this user.", { userId, roleId, status: "already_assigned" }, ["Use dataverse_get_user_roles to see current role assignments"]);
            }
            await client.associate("systemusers", userId, "systemuserroles_association", "roles", roleId);
            return formatData("Role assigned to user successfully.", { userId, roleId, status: "assigned" }, ["Use dataverse_get_user_roles to verify the new assignment"]);
        }
        case "dataverse_remove_role_from_user": {
            const { userId, roleId } = RemoveRoleFromUserInput.parse(args);
            // Pre-check: is the role currently assigned?
            const checkRemove = await client.query("systemusers", {
                filter: `systemuserid eq ${userId}`,
                select: ["systemuserid"],
                expand: `systemuserroles_association($select=roleid;$filter=roleid eq ${roleId};$top=1)`,
                top: 1,
            });
            const removeUsers = (checkRemove.value ?? []);
            const assignedRoles = (removeUsers[0]?.["systemuserroles_association"] ?? []);
            if (assignedRoles.length === 0) {
                return formatData("This role is not currently assigned to the user.", { userId, roleId, status: "not_assigned" }, ["Use dataverse_get_user_roles to see current role assignments"]);
            }
            await client.disassociate("systemusers", userId, "systemuserroles_association", roleId, "roles");
            return formatData("Role removed from user successfully.", { userId, roleId, status: "removed" }, ["Use dataverse_get_user_roles to verify the updated assignments"]);
        }
        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
//# sourceMappingURL=users.tools.js.map