import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import { esc } from "../dataverse/dataverse-client.utils.js";

const ListViewsInput = z.object({
  entityLogicalName: z.string().min(1),
  includePersonal: z.boolean().optional().default(false),
  top: z.number().int().positive().max(100).optional().default(20),
});

export const viewTools = [
  {
    name: "dataverse_list_views",
    description:
      "Lists saved views (system and optionally personal) for a Dataverse table. System views come from savedqueries; personal views come from userqueries. Returns view name, ID, default flag, query type, and description.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entityLogicalName: {
          type: "string",
          description:
            'Logical name of the entity to list views for (e.g., "account")',
        },
        includePersonal: {
          type: "boolean",
          description:
            "Include personal (user) views in addition to system views (default false)",
        },
        top: {
          type: "number",
          description:
            "Maximum number of results per category (default 20, max 100)",
        },
      },
      required: ["entityLogicalName"],
    },
  },
];

interface SystemView {
  savedqueryid: string;
  name: string;
  isdefault: boolean;
  querytype: number;
  description: string | null;
}

interface PersonalView {
  userqueryid: string;
  name: string;
  description: string | null;
}

export async function handleViewTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "dataverse_list_views": {
      const { entityLogicalName, includePersonal, top } =
        ListViewsInput.parse(args);
      const escaped = esc(entityLogicalName);

      const systemResult = await client.query<SystemView>("savedqueries", {
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
        viewType: "system" as const,
      }));

      let personalViews: Array<{
        id: string;
        name: string;
        description: string | null;
        viewType: "personal";
      }> = [];

      if (includePersonal) {
        const personalResult = await client.query<PersonalView>("userqueries", {
          filter: `returnedtypecode eq '${escaped}'`,
          select: ["userqueryid", "name", "description"],
          orderby: "name asc",
          top,
        });

        personalViews = personalResult.value.map((v) => ({
          id: v.userqueryid,
          name: v.name,
          description: v.description ?? null,
          viewType: "personal" as const,
        }));
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                entityLogicalName,
                systemViews,
                systemViewCount: systemViews.length,
                personalViews: includePersonal ? personalViews : undefined,
                personalViewCount: includePersonal
                  ? personalViews.length
                  : undefined,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown view tool: ${name}`);
  }
}
