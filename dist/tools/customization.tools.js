import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const STAGE_NAMES = {
    10: "Pre-validation",
    20: "Pre-operation",
    40: "Post-operation",
    45: "Post-operation (deprecated)",
};
const MODE_NAMES = {
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
        description: "Lists all custom actions (custom API / SDK messages) registered in the environment. Returns the message name, category, bound entity (if any), execute privilege, and whether it is customizable. Useful for discovering available automation entry points and agent-callable actions. WHEN TO USE: Discovering available custom API / SDK messages for automation. BEST PRACTICES: Use nameFilter to search; follow up with dataverse_execute_action to invoke. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
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
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_list_plugin_steps",
        description: "Lists plugin steps (SdkMessageProcessingStep registrations) in the environment. Shows plugin assembly, step name, message (Create/Update/Delete/…), entity, stage (pre/post), mode (sync/async), and state (enabled/disabled). Essential for understanding what custom business logic fires on Dataverse operations. WHEN TO USE: Understanding what custom business logic fires on CRUD operations for a table. BEST PRACTICES: Filter by entityLogicalName; check stage and mode to understand execution order and timing. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
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
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_set_workflow_state",
        description: "Activates or deactivates a Dataverse workflow (classic workflow / real-time workflow / action). Set activate=true to activate (statecode 1, statuscode 2) or activate=false to deactivate (statecode 0, statuscode 1). Returns the new state. WHEN TO USE: Activating or deactivating a classic workflow, real-time workflow, or action. BEST PRACTICES: Verify workflow ID first; deactivation stops future triggers but does not cancel in-progress runs. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
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
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_list_connection_references",
        description: "Lists all Power Automate connection references defined in the environment, showing their display name, connector ID, connection ID, and active status. " +
            "Use this before importing a solution containing flows to detect broken or unmapped connections that would cause silent import failures. " +
            "WHEN TO USE: Pre-deployment solution validation, auditing connection health, identifying broken flow connections. " +
            "BEST PRACTICES: Look for inactive (isActive=false) references — these indicate flows that will fail after deployment. " +
            "WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                connectorId: {
                    type: "string",
                    description: "Filter by connector ID substring (e.g. '/providers/Microsoft.PowerApps/apis/shared_sharepointonline')",
                },
                activeOnly: {
                    type: "boolean",
                    description: "Return only active connection references (default: false = return all)",
                },
                top: {
                    type: "number",
                    description: "Maximum records to return (default 100, max 500)",
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
const ListCustomActionsInput = z.object({
    top: z.number().positive().max(500).optional().default(100),
    nameFilter: z.string().optional(),
});
const ListPluginStepsInput = z.object({
    top: z.number().positive().max(500).optional().default(100),
    activeOnly: z.boolean().optional().default(true),
    entityLogicalName: z.string().optional(),
});
const ListConnectionReferencesInput = z.object({
    connectorId: z.string().optional(),
    activeOnly: z.boolean().optional().default(false),
    top: z.number().int().positive().max(500).optional().default(100),
});
export async function handleCustomizationTool(name, args, client) {
    switch (name) {
        case "dataverse_list_custom_actions": {
            const { top, nameFilter } = ListCustomActionsInput.parse(args ?? {});
            const filters = ["isprivate eq false"];
            if (nameFilter) {
                filters.push(`contains(name,'${esc(nameFilter)}')`);
            }
            const result = await client.query("sdkmessages", {
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
            return formatData(`${messages.length} custom actions found`, { total: messages.length, messages }, ["Use dataverse_execute_action to run an action"]);
        }
        case "dataverse_list_plugin_steps": {
            const { top, activeOnly, entityLogicalName } = ListPluginStepsInput.parse(args ?? {});
            const stepQueryOptions = {
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
                expand: "sdkmessageid($select=name,categoryname),plugintypeid($select=name,assemblyname),sdkmessagefilterid($select=primaryobjecttypecode)",
                top,
            };
            if (activeOnly) {
                stepQueryOptions.filter = "statecode eq 0";
            }
            const result = await client.query("sdkmessageprocessingsteps", stepQueryOptions);
            let steps = result.value;
            if (entityLogicalName) {
                const lname = entityLogicalName.toLowerCase();
                steps = steps.filter((s) => s.sdkmessagefilterid?.primaryobjecttypecode?.toLowerCase() ===
                    lname);
            }
            const mapped = steps.map((s) => ({
                id: s.sdkmessageprocessingstepid,
                name: s.name,
                message: s.sdkmessageid?.name ?? "",
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
            return formatData(`${mapped.length} plugin steps found`, { total: mapped.length, steps: mapped }, ["Use dataverse_get_plugin_trace_logs for debugging plugin issues"]);
        }
        case "dataverse_set_workflow_state": {
            const { workflowId, activate } = SetWorkflowStateInput.parse(args);
            try {
                await client.updateRecord("workflows", workflowId, {
                    statecode: activate ? 1 : 0,
                    statuscode: activate ? 2 : 1,
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (/0x80040203|does not refer to a valid workflow|404/i.test(msg)) {
                    throw new Error(`Workflow '${workflowId}' not found. ` +
                        `Use dataverse_list_workflows to retrieve valid workflow GUIDs in this environment. ` +
                        `Original error: ${msg}`);
                }
                throw err;
            }
            return formatData(`Workflow state updated for ${workflowId}`, {
                workflowId,
                newState: activate ? "Activated" : "Draft",
                statecode: activate ? 1 : 0,
                statuscode: activate ? 2 : 1,
            });
        }
        case "dataverse_list_connection_references": {
            const { connectorId, activeOnly, top } = ListConnectionReferencesInput.parse(args ?? {});
            const filters = [];
            if (activeOnly)
                filters.push("statecode eq 0");
            if (connectorId)
                filters.push(`contains(connectorid,'${esc(connectorId)}')`);
            const queryOptions = {
                select: [
                    "connectionreferenceid",
                    "connectionreferencelogicalname",
                    "connectionreferencedisplayname",
                    "connectorid",
                    "connectionid",
                    "statecode",
                    "statuscode",
                ],
                orderby: "connectionreferencedisplayname asc",
                top,
            };
            if (filters.length)
                queryOptions.filter = filters.join(" and ");
            const response = await client.query("connectionreferences", queryOptions);
            const refs = (response.value ?? []).map((r) => ({
                id: r["connectionreferenceid"] ?? "",
                logicalName: r["connectionreferencelogicalname"] ?? "",
                displayName: r["connectionreferencedisplayname"] ?? "",
                connectorId: r["connectorid"] ?? "",
                connectionId: r["connectionid"] ?? null,
                isActive: r["statecode"] === 0,
                statusCode: r["statuscode"] ?? null,
            }));
            const inactiveCount = refs.filter((r) => !r.isActive).length;
            const summary = inactiveCount > 0
                ? `${refs.length} connection references found (${inactiveCount} inactive — check before deploying)`
                : `${refs.length} connection references found`;
            return formatData(summary, { connectionReferences: refs, count: refs.length, inactiveCount }, [
                "Inactive references (isActive=false) indicate broken connections that will cause flow failures",
                "Use the Power Apps maker portal to reconnect or replace broken connection references before deploying",
            ]);
        }
        default:
            throw new Error(`Unknown customization tool: ${name}`);
    }
}
//# sourceMappingURL=customization.tools.js.map