import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";

const TEAM_TYPE_LABELS: Record<number, string> = {
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
    description:
      "Lists Dataverse teams in the environment. Useful for finding team owners for record assignment and sharing. " +
      "teamtype: 0=Owner, 1=Access, 2=AAD Office Group, 3=AAD Security Group.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: {
          type: "number",
          description: "Maximum number of teams to return (1–200, default 50)",
        },
        teamType: {
          type: "number",
          enum: [0, 1, 2, 3],
          description:
            "Filter by team type: 0=Owner, 1=Access, 2=Office Group, 3=Security Group",
        },
      },
      required: [],
    },
  },
];

export async function handleTeamTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
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
      const queryOptions: {
        select: string[];
        top: number;
        orderby: string;
        filter?: string;
      } = { select, top, orderby: "name asc" };
      if (teamType !== undefined) {
        queryOptions.filter = `teamtype eq ${teamType}`;
      }
      const result = await client.query<Record<string, unknown>>(
        "teams",
        queryOptions,
      );
      const teams = result.value.map((team) => ({
        ...team,
        teamTypeName: TEAM_TYPE_LABELS[team["teamtype"] as number] ?? "Unknown",
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ teams, count: teams.length }, null, 2),
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown team tool: ${name}`);
  }
}
