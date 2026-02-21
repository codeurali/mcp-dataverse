import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";

const ListBusinessUnitsInput = z.object({
  top: z.number().int().positive().max(200).optional().default(50),
  includeDisabled: z.boolean().optional().default(false),
});

export const orgTools = [
  {
    name: "dataverse_list_business_units",
    description:
      "Lists business units in the Dataverse environment. Returns name, ID, parent business unit ID, disabled status, and creation date. By default only active business units are returned.",
    inputSchema: {
      type: "object" as const,
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
  },
];

interface BusinessUnit {
  businessunitid: string;
  name: string;
  parentbusinessunitid: string | null;
  isdisabled: boolean;
  createdon: string;
}

export async function handleOrgTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "dataverse_list_business_units": {
      const { top, includeDisabled } = ListBusinessUnitsInput.parse(args ?? {});

      const filter = includeDisabled ? undefined : "isdisabled eq false";

      const result = await client.query<BusinessUnit>("businessunits", {
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { businessUnits: units, count: units.length },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown org tool: ${name}`);
  }
}
