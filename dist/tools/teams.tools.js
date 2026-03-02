import { z } from "zod";
import { formatData } from "./output.utils.js";
const TEAM_TYPE_LABELS = {
    0: "Owner",
    1: "Access",
    2: "Office",
    3: "Security",
};
const ListTeamsInput = z.object({
    top: z.number().int().positive().max(200).optional().default(50),
    teamType: z
        .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
        .optional(),
});
const AssignRoleToTeamInput = z.object({
    teamId: z.string().uuid(),
    roleId: z.string().uuid(),
    confirm: z.literal(true, {
        errorMap: () => ({
            message: "confirm must be true to assign a role to a team",
        }),
    }),
});
export const teamTools = [
    {
        name: "dataverse_list_teams",
        description: "Lists Dataverse teams in the environment. Useful for finding team owners for record assignment and sharing. " +
            "teamtype: 0=Owner, 1=Access, 2=AAD Office Group, 3=AAD Security Group. " +
            "WHEN TO USE: Finding team IDs for record assignment or sharing. " +
            "BEST PRACTICES: Filter by teamType to distinguish owner, access, and AAD group teams. " +
            "WORKFLOW: explore_schema.",
        inputSchema: {
            type: "object",
            properties: {
                top: {
                    type: "number",
                    description: "Maximum number of teams to return (1–200, default 50)",
                },
                teamType: {
                    type: "number",
                    enum: [0, 1, 2, 3],
                    description: "Filter by team type: 0=Owner, 1=Access, 2=Office Group, 3=Security Group",
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
        name: "dataverse_assign_role_to_team",
        description: "Assigns a security role to a Dataverse team. All team members inherit the role permissions. " +
            "Use dataverse_list_roles to find the role GUID and dataverse_list_teams to find the team GUID. " +
            "WARNING: This modifies team permissions for ALL members. Set confirm=true to proceed. " +
            "WHEN TO USE: Providing role-based permissions to an entire team during configuration. " +
            "BEST PRACTICES: Prefer team-based RBAC over individual user assignments for maintainability. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                teamId: { type: "string", description: "GUID of the team" },
                roleId: {
                    type: "string",
                    description: "GUID of the security role to assign",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true to proceed with role assignment",
                },
            },
            required: ["teamId", "roleId", "confirm"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
export async function handleTeamTool(name, args, client) {
    switch (name) {
        case "dataverse_list_teams": {
            const { top, teamType } = ListTeamsInput.parse(args);
            const select = [
                "teamid",
                "name",
                "teamtype",
                "description",
                "isdefault",
                "createdon",
                "_businessunitid_value",
            ];
            const queryOptions = { select, top, orderby: "name asc" };
            if (teamType !== undefined) {
                queryOptions.filter = `teamtype eq ${teamType}`;
            }
            const result = await client.query("teams", queryOptions);
            const teams = result.value.map((team) => ({
                ...team,
                teamTypeName: TEAM_TYPE_LABELS[team["teamtype"]] ?? "Unknown",
            }));
            return formatData(`${teams.length} teams found`, { teams, count: teams.length }, ["Use dataverse_assign with a team ID to assign records to a team"]);
        }
        case "dataverse_assign_role_to_team": {
            const { teamId, roleId } = AssignRoleToTeamInput.parse(args);
            try {
                await client.associate("teams", teamId, "teamroles_association", "roles", roleId);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.toLowerCase().includes("duplicate") ||
                    msg.includes("0x80040237")) {
                    return formatData("Role is already assigned to this team.", { teamId, roleId, status: "already_assigned" }, ["Use dataverse_list_teams to view current team configuration"]);
                }
                throw err;
            }
            return formatData("Role assigned to team successfully.", { teamId, roleId, status: "assigned" }, ["All members of this team now inherit the assigned role"]);
        }
        default:
            throw new Error(`Unknown team tool: ${name}`);
    }
}
//# sourceMappingURL=teams.tools.js.map