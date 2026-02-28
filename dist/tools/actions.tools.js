import { z } from "zod";
import { formatData } from "./output.utils.js";
import { safeEntitySetName } from "./validation.utils.js";
export const actionTools = [
    {
        name: "dataverse_execute_action",
        description: "Executes a global (unbound) Dataverse action that is not tied to a specific record — for example WinOpportunity, SendEmail, or custom process actions. Use dataverse_execute_bound_action when the action must operate on a particular record. Actions differ from functions in that they are state-changing operations; for read-only operations use dataverse_execute_function. WHEN TO USE: Invoking global Dataverse actions or custom process actions like WinOpportunity or SendEmail. BEST PRACTICES: Check action parameters via metadata or docs; use dataverse_execute_bound_action for record-scoped actions. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                actionName: {
                    type: "string",
                    description: 'Action logical name (e.g., "WinOpportunity")',
                },
                parameters: { type: "object", description: "Action parameters" },
            },
            required: ["actionName"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_execute_function",
        description: "Executes a global (unbound) Dataverse OData function that is read-only and returns data without side effects — for example RetrieveTotalRecordCount or InitializeFrom. Use dataverse_execute_action for state-changing operations. Use dataverse_execute_bound_action when the function/action requires a specific record context. WHEN TO USE: Calling global read-only OData functions like RetrieveTotalRecordCount or InitializeFrom. BEST PRACTICES: Functions are side-effect-free and safe to retry; use dataverse_execute_action for mutations. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
            properties: {
                functionName: {
                    type: "string",
                    description: 'Function name (e.g., "WhoAmI", "RetrieveTotalRecordCount")',
                },
                parameters: {
                    type: "object",
                    description: "Function parameters as string key-value pairs",
                },
            },
            required: ["functionName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_execute_bound_action",
        description: "Executes a Dataverse action bound to a specific record instance, passing the entity set name and record GUID as context (e.g., QualifyLead on a lead, or a custom action scoped to an account). The actionName should not include the Microsoft.Dynamics.CRM namespace prefix. Use dataverse_execute_action for global unbound actions that do not require a record context. WHEN TO USE: Running an action scoped to a specific record, e.g. QualifyLead on a lead. BEST PRACTICES: Omit the Microsoft.Dynamics.CRM namespace prefix; ensure the record exists first. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: { type: "string" },
                id: { type: "string", description: "Record GUID" },
                actionName: {
                    type: "string",
                    description: "Action name (without Microsoft.Dynamics.CRM prefix)",
                },
                parameters: { type: "object", description: "Action parameters" },
            },
            required: ["entitySetName", "id", "actionName"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_retrieve_dependencies_for_delete",
        description: "Checks what solution components would block deletion of a specific component. Provide the Dataverse component type code (1=Entity, 2=Attribute, 26=SavedQuery, 29=Workflow, 92=PluginAssembly) and the component GUID. Use before deleting shared Dataverse customization components. WHEN TO USE: Before deleting a solution component to check for blocking dependencies. BEST PRACTICES: Resolve all dependencies before attempting deletion. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                componentType: {
                    type: "number",
                    description: "Dataverse component type code (1=Entity, 2=Attribute, 29=Workflow, 92=PluginAssembly)",
                },
                objectId: { type: "string", description: "Component GUID" },
            },
            required: ["componentType", "objectId"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_execute_bound_function",
        description: "Executes a Dataverse function bound to a specific record (e.g., CalculateRollupField, GetQuantityAvailable). Use for read-only computed operations on a single record. Unlike bound actions, bound functions do not modify data. WHEN TO USE: Calling a read-only computed function on a specific record, e.g. CalculateRollupField. BEST PRACTICES: Functions are side-effect-free and safe to call repeatedly; pass parameters as string key-value pairs. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name of the table (e.g., "accounts")',
                },
                id: { type: "string", description: "GUID of the record" },
                functionName: {
                    type: "string",
                    description: 'Name of the bound function (e.g., "CalculateRollupField")',
                },
                parameters: {
                    type: "object",
                    description: "Function parameters as key-value pairs of strings",
                    additionalProperties: { type: "string" },
                },
            },
            required: ["entitySetName", "id", "functionName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_list_dependencies",
        description: "Lists workflows, Power Automate flows, Business Rules, and custom actions that reference a given table. Use to detect hidden dependencies before modifying or removing a table. Returns component name, type, state (Active/Draft), trigger event (Create/Update/Delete), and count. WHEN TO USE: Before modifying or removing a table, to discover workflows, flows, and plugins that reference it. BEST PRACTICES: Filter by componentType to focus on specific dependency kinds. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                tableName: {
                    type: "string",
                    description: 'Logical name of the table to check (e.g., "account", "contact")',
                },
                componentType: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: [
                            "Workflow",
                            "Flow",
                            "BusinessRule",
                            "Action",
                            "BusinessProcessFlow",
                            "Plugin",
                            "CustomAPI",
                        ],
                    },
                    description: "Filter by component type. Default: all types.",
                },
            },
            required: ["tableName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
/** Allow only identifier-safe names: letters, digits, underscores, dots (for namespace prefixes). */
const SAFE_API_NAME = /^[a-zA-Z0-9_.]+$/;
const ExecuteActionInput = z.object({
    actionName: z
        .string()
        .min(1)
        .regex(SAFE_API_NAME, "actionName must contain only letters, digits, underscores, or dots"),
    parameters: z.record(z.unknown()).optional().default({}),
});
const ExecuteFunctionInput = z.object({
    functionName: z
        .string()
        .min(1)
        .regex(SAFE_API_NAME, "functionName must contain only letters, digits, underscores, or dots"),
    parameters: z.record(z.string()).optional().default({}),
});
const ExecuteBoundActionInput = z.object({
    entitySetName: safeEntitySetName,
    id: z.string().uuid(),
    actionName: z
        .string()
        .min(1)
        .regex(SAFE_API_NAME, "actionName must contain only letters, digits, underscores, or dots"),
    parameters: z.record(z.unknown()).optional().default({}),
});
const RetrieveDependenciesForDeleteInput = z.object({
    componentType: z.number().int().positive(),
    objectId: z.string().uuid(),
});
const VALID_COMPONENT_TYPES = [
    "Workflow",
    "Flow",
    "BusinessRule",
    "Action",
    "BusinessProcessFlow",
    "Plugin",
    "CustomAPI",
];
const ListTableDependenciesInput = z.object({
    tableName: z.string().min(1),
    componentType: z.array(z.enum(VALID_COMPONENT_TYPES)).optional(),
});
const ExecuteBoundFunctionInput = z.object({
    entitySetName: safeEntitySetName,
    id: z.string().uuid(),
    functionName: z
        .string()
        .min(1)
        .regex(SAFE_API_NAME, "functionName must contain only letters, digits, underscores, or dots"),
    parameters: z.record(z.string()).optional().default({}),
});
export async function handleActionTool(name, args, client) {
    switch (name) {
        case "dataverse_execute_action": {
            const { actionName, parameters } = ExecuteActionInput.parse(args);
            const result = await client.executeAction(actionName, parameters);
            return formatData(`Executed unbound action ${actionName}`, result, [
                "Use dataverse_list_custom_actions to discover available actions",
            ]);
        }
        case "dataverse_execute_function": {
            const { functionName, parameters } = ExecuteFunctionInput.parse(args);
            const result = await client.executeFunction(functionName, parameters);
            return formatData(`Executed function ${functionName}`, result, [
                "Functions are read-only operations",
            ]);
        }
        case "dataverse_execute_bound_action": {
            const { entitySetName, id, actionName, parameters } = ExecuteBoundActionInput.parse(args);
            const result = await client.executeBoundAction(entitySetName, id, actionName, parameters);
            return formatData(`Executed bound action ${actionName} on ${entitySetName}(${id})`, result);
        }
        case "dataverse_list_dependencies": {
            const { tableName, componentType } = ListTableDependenciesInput.parse(args);
            const result = await client.listTableDependencies(tableName, componentType);
            const items = Array.isArray(result)
                ? result
                : (result.value ?? [result]);
            return formatData(`${items.length} dependencies found for component`, result, ["Use this information before deleting or modifying the component"]);
        }
        case "dataverse_retrieve_dependencies_for_delete": {
            const { componentType, objectId } = RetrieveDependenciesForDeleteInput.parse(args);
            const result = await client.listDependencies(componentType, objectId);
            const items = Array.isArray(result)
                ? result
                : (result.value ?? [result]);
            return formatData(`${items.length} dependencies found`, result, ["Review dependencies before deleting the component"]);
        }
        case "dataverse_execute_bound_function": {
            const { entitySetName, id, functionName, parameters } = ExecuteBoundFunctionInput.parse(args);
            const result = await client.executeBoundFunction(entitySetName, id, functionName, parameters);
            return formatData(`Executed bound function ${functionName} on ${entitySetName}(${id})`, result);
        }
        default:
            throw new Error(`Unknown action tool: ${name}`);
    }
}
//# sourceMappingURL=actions.tools.js.map