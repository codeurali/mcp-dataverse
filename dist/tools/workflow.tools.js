import { formatData, formatList } from "./output.utils.js";
import { WORKFLOWS } from "./guides.js";
// ── Tool Definitions ───────────────────────────────────────────────────────────
export const workflowTools = [
    {
        name: "dataverse_list_guides",
        description: "Lists all available step-by-step guided workflows for common Dataverse tasks (query_data, create_record, manage_solution, etc.). " +
            "Use this to discover recommended MCP patterns. " +
            "NOTE: these are MCP-internal task guides, NOT Dataverse automation processes — use dataverse_list_workflows to list actual Dataverse flows/workflows.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    {
        name: "dataverse_get_guide",
        description: "Returns the full definition of an MCP task guide including ordered steps, tool names, tips, and required flags. " +
            "Use this to get a step-by-step plan for a common Dataverse task. " +
            "NOTE: these are MCP-internal guides — use dataverse_get_workflow to retrieve an actual Dataverse process.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Guide name (e.g. query_data, explore_schema, create_record, update_record, delete_record, bulk_operations, search_data, manage_solution, inspect_audit, file_operations)",
                },
            },
            required: ["name"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    {
        name: "dataverse_list_workflows",
        description: "Lists automation processes stored in the Dataverse environment: Power Automate cloud flows, classic workflows, " +
            "business rules, business process flows, and actions. Optionally filter by category or partial name.",
        inputSchema: {
            type: "object",
            properties: {
                category: {
                    type: "number",
                    description: "Filter by process category: 0=Classic Workflow, 1=Dialog, 2=Business Rule, 3=Action, 4=Business Process Flow, 6=Power Automate (Cloud Flow). Omit to list all categories.",
                },
                nameContains: {
                    type: "string",
                    description: "Filter by partial name match (case-insensitive contains).",
                },
                top: {
                    type: "number",
                    description: "Maximum number of results to return (default 50).",
                },
            },
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    {
        name: "dataverse_get_workflow",
        description: "Returns full details of a Dataverse automation process (workflow, cloud flow, business rule, or action) by its GUID.",
        inputSchema: {
            type: "object",
            properties: {
                workflowId: {
                    type: "string",
                    description: "GUID of the workflow/process record",
                },
            },
            required: ["workflowId"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
];
// ── Handler ────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
    0: "Classic Workflow",
    1: "Dialog",
    2: "Business Rule",
    3: "Action",
    4: "Business Process Flow",
    6: "Power Automate (Cloud Flow)",
};
export async function handleWorkflowTool(name, args, client) {
    // ── MCP Task Guides ──────────────────────────────────────────────────────
    if (name === "dataverse_list_guides") {
        const items = Array.from(WORKFLOWS.values()).map((w) => ({
            name: w.name,
            description: w.description,
            tags: w.tags,
            stepCount: w.steps.length,
        }));
        return formatList("guides", items, [
            "Use dataverse_get_guide with a guide name to see detailed steps",
        ]);
    }
    if (name === "dataverse_get_guide") {
        const { name: wfName } = args;
        const workflow = WORKFLOWS.get(wfName);
        if (!workflow) {
            const available = Array.from(WORKFLOWS.keys()).join(", ");
            throw new Error(`Unknown guide: "${wfName}". Available guides: ${available}`);
        }
        return formatData(`Guide "${workflow.name}": ${workflow.description}`, workflow, workflow.steps.map((s) => `Step ${s.order}: ${s.tool} — ${s.description}`));
    }
    // ── Dataverse Automation Processes ──────────────────────────────────────
    if (name === "dataverse_list_workflows") {
        const input = args;
        const records = await client.listDataverseWorkflows({
            ...(input.category !== undefined ? { category: input.category } : {}),
            ...(input.nameContains !== undefined
                ? { nameContains: input.nameContains }
                : {}),
            top: Math.min(input.top ?? 50, 200),
        });
        const items = records.map((r) => ({
            workflowId: r["workflowid"],
            name: r["name"],
            category: CATEGORY_LABELS[r["category"]] ?? r["category"],
            state: r["statecode"] === 1 ? "Active" : "Inactive",
            modifiedOn: r["modifiedon"],
        }));
        return formatList(`Dataverse workflows (${items.length} found)`, items, [
            "Use dataverse_get_workflow with a workflowId GUID for full details",
            "Filter with category: 0=Classic, 2=Business Rule, 4=BPF, 6=Cloud Flow",
        ]);
    }
    if (name === "dataverse_get_workflow") {
        const { workflowId } = args;
        const record = await client.getDataverseWorkflow(workflowId);
        const categoryNum = record["category"];
        const displayRecord = {
            ...record,
            categoryLabel: CATEGORY_LABELS[categoryNum] ?? `Category ${categoryNum}`,
            stateLabel: record["statecode"] === 1 ? "Active" : "Inactive",
        };
        return formatData(`Workflow: ${record["name"]}`, displayRecord, []);
    }
    throw new Error(`Unknown workflow tool: ${name}`);
}
// ── Exported for testing ───────────────────────────────────────────────────────
export { WORKFLOWS };
//# sourceMappingURL=workflow.tools.js.map