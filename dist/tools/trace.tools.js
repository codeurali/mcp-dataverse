import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const OPERATION_TYPE_NAMES = {
    0: "Execute",
    1: "Create",
    2: "Retrieve",
    3: "RetrieveMultiple",
    4: "GetParent",
    5: "Update",
    6: "Delete",
    7: "Assign",
};
const STATUS_CODE_NAMES = {
    0: "Waiting",
    10: "WaitingForResources",
    20: "InProgress",
    21: "Pausing",
    22: "Canceling",
    30: "Succeeded",
    31: "Failed",
    32: "Canceled",
};
const STATE_CODE_NAMES = {
    0: "ReadyToRun",
    1: "Suspended",
    2: "Locked",
    3: "Completed",
};
const PLUGIN_TRACE_SELECT = [
    "plugintracelogid",
    "typename",
    "messagename",
    "primaryentity",
    "depth",
    "operationtype",
    "exceptiondetails",
    "messageblock",
    "createdon",
    "performanceexecutionduration",
    "correlationid",
    "requestid",
];
const WORKFLOW_TRACE_SELECT = [
    "asyncoperationid",
    "name",
    "operationtype",
    "statuscode",
    "statecode",
    "message",
    "createdon",
    "startedon",
    "completedon",
    "regardingobjecttypecode",
];
export const traceTools = [
    {
        name: "dataverse_get_plugin_trace_logs",
        description: "Retrieves recent plugin and custom workflow activity trace logs from Dataverse. Shows execution details including plugin type name, triggering message, entity, execution duration, trace messages written by the developer, and exception details if the plugin failed. Requires the Plugin Trace Log feature to be enabled in Dataverse settings (Settings > Administration > System Settings > Customization tab > 'Enable logging to plugin trace log'). Essential for debugging plugin failures in production. WHEN TO USE: Debugging plugin failures or performance issues in production. BEST PRACTICES: Enable Plugin Trace Log in Dataverse settings first; filter by plugin name or entity to narrow results. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                top: {
                    type: "number",
                    description: "Max records to return (default 50, max 200)",
                },
                pluginTypeFilter: {
                    type: "string",
                    description: "Filter by plugin type name (substring match, e.g. 'AccountValidation')",
                },
                messageFilter: {
                    type: "string",
                    description: "Filter by message name (e.g. 'Create', 'Update')",
                },
                entityFilter: {
                    type: "string",
                    description: "Filter by entity logical name (e.g. 'account')",
                },
                exceptionsOnly: {
                    type: "boolean",
                    description: "Return only traces where an exception occurred (default false)",
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
        name: "dataverse_get_workflow_trace_logs",
        description: "Retrieves background workflow (Power Automate classic / legacy workflow engine) execution records from Dataverse. These are the AsyncOperation records for workflow-type operations, useful for diagnosing failures in background workflows and real-time workflows running asynchronously. Note: For modern cloud flows (Power Automate), use the Power Automate portal instead. WHEN TO USE: Diagnosing failures in classic/legacy background workflows. BEST PRACTICES: Use failedOnly=true to focus on errors; for modern cloud flows use Power Automate portal. WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                top: {
                    type: "number",
                    description: "Max records (default 50, max 200)",
                },
                failedOnly: {
                    type: "boolean",
                    description: "Return only failed workflows (statuscode eq 31, default false)",
                },
                entityFilter: {
                    type: "string",
                    description: "Filter by regarding entity type (e.g. 'account')",
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
const GetPluginTraceInput = z.object({
    top: z.number().int().positive().max(200).optional().default(50),
    pluginTypeFilter: z.string().optional(),
    messageFilter: z.string().optional(),
    entityFilter: z.string().optional(),
    exceptionsOnly: z.boolean().optional().default(false),
});
const GetWorkflowTraceInput = z.object({
    top: z.number().int().positive().max(200).optional().default(50),
    failedOnly: z.boolean().optional().default(false),
    entityFilter: z.string().optional(),
});
function str(val) {
    return typeof val === "string" ? val : "";
}
function numOrNull(val) {
    return typeof val === "number" ? val : null;
}
export async function handleTraceTool(name, args, client) {
    switch (name) {
        case "dataverse_get_plugin_trace_logs": {
            const params = GetPluginTraceInput.parse(args);
            const filterParts = [];
            if (params.pluginTypeFilter) {
                filterParts.push(`contains(typename,'${esc(params.pluginTypeFilter)}')`);
            }
            if (params.messageFilter) {
                filterParts.push(`messagename eq '${esc(params.messageFilter)}'`);
            }
            if (params.entityFilter) {
                filterParts.push(`primaryentity eq '${esc(params.entityFilter)}'`);
            }
            if (params.exceptionsOnly) {
                filterParts.push("exceptiondetails ne null");
            }
            const filter = filterParts.length > 0 ? filterParts.join(" and ") : undefined;
            const response = await client.query("plugintracelog", {
                select: PLUGIN_TRACE_SELECT,
                orderby: "createdon desc",
                top: params.top,
                ...(filter !== undefined ? { filter } : {}),
            });
            const rows = (response.value ?? []);
            const logs = rows.map((row) => {
                const opType = typeof row["operationtype"] === "number" ? row["operationtype"] : 0;
                const exceptionDetails = row["exceptiondetails"];
                return {
                    id: str(row["plugintracelogid"]),
                    typeName: str(row["typename"]),
                    message: str(row["messagename"]),
                    entity: str(row["primaryentity"]),
                    depth: typeof row["depth"] === "number" ? row["depth"] : 0,
                    operationType: opType,
                    operationTypeName: OPERATION_TYPE_NAMES[opType] ?? String(opType),
                    createdOn: str(row["createdon"]),
                    durationMs: numOrNull(row["performanceexecutionduration"]),
                    correlationId: str(row["correlationid"]),
                    requestId: str(row["requestid"]),
                    hasException: exceptionDetails != null && exceptionDetails !== "",
                    exceptionDetails: typeof exceptionDetails === "string" ? exceptionDetails : null,
                    messageBlock: typeof row["messageblock"] === "string"
                        ? row["messageblock"]
                        : null,
                };
            });
            const result = { total: logs.length, logs };
            return formatData(`${logs.length} plugin trace logs found`, result, [
                "Filter by plugin name or correlation ID for specific traces",
            ]);
        }
        case "dataverse_get_workflow_trace_logs": {
            const params = GetWorkflowTraceInput.parse(args);
            const filterParts = ["operationtype eq 10"];
            if (params.failedOnly) {
                filterParts.push("statuscode eq 31");
            }
            if (params.entityFilter) {
                filterParts.push(`regardingobjecttypecode eq '${esc(params.entityFilter)}'`);
            }
            const filter = filterParts.join(" and ");
            const response = await client.query("asyncoperations", {
                select: WORKFLOW_TRACE_SELECT,
                filter,
                orderby: "createdon desc",
                top: params.top,
            });
            const rows = (response.value ?? []);
            const workflows = rows.map((row) => {
                const statusCode = typeof row["statuscode"] === "number" ? row["statuscode"] : 0;
                const stateCode = typeof row["statecode"] === "number" ? row["statecode"] : 0;
                const errorMsg = row["message"];
                return {
                    id: str(row["asyncoperationid"]),
                    name: str(row["name"]),
                    statusCode,
                    statusName: STATUS_CODE_NAMES[statusCode] ?? String(statusCode),
                    stateCode,
                    stateName: STATE_CODE_NAMES[stateCode] ?? String(stateCode),
                    createdOn: str(row["createdon"]),
                    startedOn: typeof row["startedon"] === "string"
                        ? row["startedon"]
                        : null,
                    completedOn: typeof row["completedon"] === "string"
                        ? row["completedon"]
                        : null,
                    regardingEntityType: typeof row["regardingobjecttypecode"] === "string"
                        ? row["regardingobjecttypecode"]
                        : null,
                    errorMessage: typeof errorMsg === "string" ? errorMsg : null,
                };
            });
            const result = { total: workflows.length, workflows };
            return formatData(`${workflows.length} workflow trace logs found`, result, ["Filter by status or entity type for specific workflow traces"]);
        }
        default:
            throw new Error(`Unknown trace tool: ${name}`);
    }
}
//# sourceMappingURL=trace.tools.js.map