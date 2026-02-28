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
        default:
            throw new Error(`Unknown team tool: ${name}`);
    }
}
//# sourceMappingURL=teams.tools.js.map