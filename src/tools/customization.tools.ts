import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import { esc } from "../dataverse/dataverse-client.utils.js";

const STAGE_NAMES: Record<number, string> = {
  10: "Pre-validation",
  20: "Pre-operation",
  40: "Post-operation",
  45: "Post-operation (deprecated)",
};

const MODE_NAMES: Record<number, string> = {
  0: "Synchronous",
  1: "Asynchronous",
};

const SetWorkflowStateInput = z.object({
  workflowId: z.string().uuid(),
  activate: z.boolean(),
});

export const customizationTools = [
  {
    name: "dataverse_list_custom_actions",
    description:
      "Lists all custom actions (custom API / SDK messages) registered in the environment. Returns the message name, category, bound entity (if any), execute privilege, and whether it is customizable. Useful for discovering available automation entry points and agent-callable actions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: {
          type: "number",
          description: "Max records (default 100, max 500)",
        },
        nameFilter: {
          type: "string",
          description: "Filter by name (substring match)",
        },
      },
      required: [],
    },
  },
  {
    name: "dataverse_list_plugin_steps",
    description:
      "Lists plugin steps (SdkMessageProcessingStep registrations) in the environment. Shows plugin assembly, step name, message (Create/Update/Delete/…), entity, stage (pre/post), mode (sync/async), and state (enabled/disabled). Essential for understanding what custom business logic fires on Dataverse operations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: {
          type: "number",
          description: "Max records (default 100, max 500)",
        },
        activeOnly: {
          type: "boolean",
          description: "Return only enabled steps (default: true)",
        },
        entityLogicalName: {
          type: "string",
          description: "Filter by entity logical name (e.g. 'account')",
        },
      },
      required: [],
    },
  },
  {
    name: "dataverse_set_workflow_state",
    description:
      "Activates or deactivates a Dataverse workflow (classic workflow / real-time workflow / action). Set activate=true to activate (statecode 1, statuscode 2) or activate=false to deactivate (statecode 0, statuscode 1). Returns the new state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflowId: {
          type: "string",
          description: "The workflow GUID",
        },
        activate: {
          type: "boolean",
          description: "true = activate, false = deactivate (draft)",
        },
      },
      required: ["workflowId", "activate"],
    },
  },
];

const ListCustomActionsInput = z.object({
  top: z.number().positive().max(500).optional().default(100),
  nameFilter: z.string().optional(),
});

const ListPluginStepsInput = z.object({
  top: z.number().positive().max(500).optional().default(100),
  activeOnly: z.boolean().optional().default(true),
  entityLogicalName: z.string().optional(),
});

interface SdkMessage {
  sdkmessageid: string;
  name: string;
  categoryname: string | null;
  isprivate: boolean;
  isreadonly: boolean;
  isvalidforexecuteasync: boolean;
}

interface PluginStepRaw {
  sdkmessageprocessingstepid: string;
  name: string;
  stage: number;
  mode: number;
  rank: number;
  statecode: number;
  filteringattributes: string | null;
  asyncautodelete: boolean;
  sdkmessageid_sdkmessage?: { name: string } | null;
  plugintypeid?: { name: string; assemblyname: string } | null;
  sdkmessagefilterid?: { primaryobjecttypecode: string } | null;
}

export async function handleCustomizationTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "dataverse_list_custom_actions": {
      const { top, nameFilter } = ListCustomActionsInput.parse(args ?? {});

      const filters: string[] = ["isprivate eq false"];
      if (nameFilter) {
        filters.push(`contains(name,'${esc(nameFilter)}')`);
      }

      const result = await client.query<SdkMessage>("sdkmessages", {
        select: [
          "sdkmessageid",
          "name",
          "categoryname",
          "isprivate",
          "isreadonly",
          "isvalidforexecuteasync",
        ],
        filter: filters.join(" and "),
        top,
      });

      const messages = result.value.map((m) => ({
        id: m.sdkmessageid,
        name: m.name,
        category: m.categoryname ?? "",
        isPrivate: m.isprivate,
        isReadOnly: m.isreadonly,
        asyncSupported: m.isvalidforexecuteasync,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ total: messages.length, messages }, null, 2),
          },
        ],
      };
    }

    case "dataverse_list_plugin_steps": {
      const { top, activeOnly, entityLogicalName } = ListPluginStepsInput.parse(
        args ?? {},
      );

      const stepQueryOptions: {
        select: string[];
        expand: string;
        top: number;
        filter?: string;
      } = {
        select: [
          "sdkmessageprocessingstepid",
          "name",
          "stage",
          "mode",
          "rank",
          "statecode",
          "filteringattributes",
          "asyncautodelete",
        ],
        expand:
          "sdkmessageid_sdkmessage($select=name),plugintypeid($select=name,assemblyname),sdkmessagefilterid($select=primaryobjecttypecode)",
        top,
      };
      if (activeOnly) {
        stepQueryOptions.filter = "statecode eq 0";
      }

      const result = await client.query<PluginStepRaw>(
        "sdkmessageprocessingsteps",
        stepQueryOptions,
      );

      let steps = result.value;

      if (entityLogicalName) {
        const lname = entityLogicalName.toLowerCase();
        steps = steps.filter(
          (s) =>
            s.sdkmessagefilterid?.primaryobjecttypecode?.toLowerCase() ===
            lname,
        );
      }

      const mapped = steps.map((s) => ({
        id: s.sdkmessageprocessingstepid,
        name: s.name,
        message: s.sdkmessageid_sdkmessage?.name ?? "",
        entity: s.sdkmessagefilterid?.primaryobjecttypecode ?? "",
        assembly: s.plugintypeid?.assemblyname ?? "",
        pluginType: s.plugintypeid?.name ?? "",
        stage: s.stage,
        stageName: STAGE_NAMES[s.stage] ?? `Stage ${s.stage}`,
        mode: s.mode,
        modeName: MODE_NAMES[s.mode] ?? `Mode ${s.mode}`,
        rank: s.rank,
        isActive: s.statecode === 0,
        filteringAttributes: s.filteringattributes ?? null,
        asyncAutoDelete: s.asyncautodelete,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total: mapped.length, steps: mapped },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "dataverse_set_workflow_state": {
      const { workflowId, activate } = SetWorkflowStateInput.parse(args);

      await client.updateRecord("workflows", workflowId, {
        statecode: activate ? 1 : 0,
        statuscode: activate ? 2 : 1,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                workflowId,
                newState: activate ? "Activated" : "Draft",
                statecode: activate ? 1 : 0,
                statuscode: activate ? 2 : 1,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown customization tool: ${name}`);
  }
}
