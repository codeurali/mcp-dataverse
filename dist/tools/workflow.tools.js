import { formatData, formatList } from "./output.utils.js";
// ── Workflow Definitions ───────────────────────────────────────────────────────
const WORKFLOWS = new Map([
    [
        "query_data",
        {
            name: "query_data",
            description: "Query data from Dataverse tables. Authenticate, discover tables, inspect schema, then query with OData or FetchXML.",
            tags: ["query", "data", "fetchxml", "odata", "read"],
            steps: [
                { order: 1, tool: "dataverse_whoami", description: "Verify authentication and get user context", required: true },
                { order: 2, tool: "dataverse_list_tables", description: "Discover available tables", required: true, tips: "Use customOnly=true to focus on custom tables" },
                { order: 3, tool: "dataverse_get_table_metadata", description: "Inspect column names, types, and required fields", required: true, tips: "Note logical names for use in $select and $filter" },
                { order: 4, tool: "dataverse_query", description: "Execute OData query or use dataverse_execute_fetchxml for complex joins", required: true, tips: "Always use $select to limit columns; use $top to limit rows" },
            ],
        },
    ],
    [
        "explore_schema",
        {
            name: "explore_schema",
            description: "Explore the Dataverse schema: tables, columns, relationships, and saved views.",
            tags: ["schema", "metadata", "tables", "relationships", "views"],
            steps: [
                { order: 1, tool: "dataverse_whoami", description: "Verify authentication", required: true },
                { order: 2, tool: "dataverse_list_tables", description: "List all available tables", required: true },
                { order: 3, tool: "dataverse_get_table_metadata", description: "Get detailed column metadata for a table", required: true },
                { order: 4, tool: "dataverse_get_relationships", description: "Discover one-to-many and many-to-many relationships", required: false, tips: "Useful before building FetchXML joins" },
                { order: 5, tool: "dataverse_list_views", description: "List saved views for the table", required: false },
            ],
        },
    ],
    [
        "create_record",
        {
            name: "create_record",
            description: "Create a new record in Dataverse. Inspect schema first to know required fields, then create and verify.",
            tags: ["create", "record", "write", "insert"],
            steps: [
                { order: 1, tool: "dataverse_get_table_metadata", description: "Check required fields and column types before creating", required: true, tips: "Pay attention to required fields and lookup columns" },
                { order: 2, tool: "dataverse_create", description: "Create the new record", required: true },
                { order: 3, tool: "dataverse_query", description: "Verify the record was created with correct values", required: false, tips: "Query by the returned ID to confirm field values" },
            ],
        },
    ],
    [
        "update_record",
        {
            name: "update_record",
            description: "Update an existing record. Read current values, apply changes, then verify the update.",
            tags: ["update", "record", "write", "modify"],
            steps: [
                { order: 1, tool: "dataverse_get_table_metadata", description: "Confirm column names and types", required: true },
                { order: 2, tool: "dataverse_get", description: "Read current record values and etag", required: true, tips: "Capture @odata.etag for optimistic concurrency" },
                { order: 3, tool: "dataverse_update", description: "Apply the update with etag for concurrency control", required: true },
                { order: 4, tool: "dataverse_get", description: "Verify the update was applied correctly", required: false },
            ],
        },
    ],
    [
        "delete_record",
        {
            name: "delete_record",
            description: "Delete a record from Dataverse. Read the record first to confirm identity, then delete.",
            tags: ["delete", "record", "remove"],
            steps: [
                { order: 1, tool: "dataverse_get", description: "Read the record to confirm it is the correct one", required: true, tips: "Show record details to the user before deletion" },
                { order: 2, tool: "dataverse_delete", description: "Delete the record (irreversible)", required: true, tips: "Always confirm with the user before executing this step" },
            ],
        },
    ],
    [
        "bulk_operations",
        {
            name: "bulk_operations",
            description: "Perform bulk create/update/delete using Dataverse batch API for efficiency.",
            tags: ["bulk", "batch", "mass", "multiple"],
            steps: [
                { order: 1, tool: "dataverse_get_table_metadata", description: "Inspect schema to build correct request payloads", required: true },
                { order: 2, tool: "dataverse_batch_execute", description: "Execute batch of operations in a single request", required: true, tips: "Group up to 1000 operations per batch; use changesets for transactional groups" },
            ],
        },
    ],
    [
        "search_data",
        {
            name: "search_data",
            description: "Full-text search across Dataverse tables, then refine results with targeted queries.",
            tags: ["search", "find", "fulltext", "relevance"],
            steps: [
                { order: 1, tool: "dataverse_search", description: "Execute full-text search across multiple tables", required: true, tips: "Use entities filter to narrow which tables to search" },
                { order: 2, tool: "dataverse_query", description: "Refine results with a targeted OData query on the relevant table", required: false },
            ],
        },
    ],
    [
        "manage_solution",
        {
            name: "manage_solution",
            description: "Inspect and manage Dataverse solutions and their components.",
            tags: ["solution", "customization", "deployment", "components"],
            steps: [
                { order: 1, tool: "dataverse_list_solutions", description: "List all solutions in the environment", required: true },
                { order: 2, tool: "dataverse_solution_components", description: "List components within a specific solution", required: true },
                { order: 3, tool: "dataverse_publish_customizations", description: "Publish customizations after changes", required: false, tips: "Required after modifying solution components" },
            ],
        },
    ],
    [
        "inspect_audit",
        {
            name: "inspect_audit",
            description: "Review audit history for records or tables to track changes and user activity.",
            tags: ["audit", "history", "changes", "tracking"],
            steps: [
                { order: 1, tool: "dataverse_get_audit_log", description: "Retrieve audit entries filtered by record, table, user, or date range", required: true, tips: "Use at least one filter to avoid large result sets; audit must be enabled on the table" },
            ],
        },
    ],
    [
        "file_operations",
        {
            name: "file_operations",
            description: "Upload or download files from Dataverse file/image columns.",
            tags: ["file", "upload", "download", "image", "attachment"],
            steps: [
                { order: 1, tool: "dataverse_get_table_metadata", description: "Identify file or image columns on the table", required: true, tips: "Look for columns of type File or Image" },
                { order: 2, tool: "dataverse_upload_file_column", description: "Upload a file to a file/image column", required: false },
                { order: 3, tool: "dataverse_download_file_column", description: "Download a file from a file/image column", required: false, tips: "Returns base64-encoded content" },
            ],
        },
    ],
]);
// ── Tool Definitions ───────────────────────────────────────────────────────────
export const workflowTools = [
    {
        name: "dataverse_list_workflows",
        description: "Lists all available guided workflows with their descriptions and tags. " +
            "Use this to discover recommended step-by-step patterns for common Dataverse tasks.",
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
        name: "dataverse_get_workflow",
        description: "Returns the full definition of a guided workflow including ordered steps, tool names, tips, and required flags. " +
            "Use this to get a step-by-step plan for a common Dataverse task.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Workflow name (e.g. query_data, explore_schema, create_record, update_record, delete_record, bulk_operations, search_data, manage_solution, inspect_audit, file_operations)",
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
];
// ── Handler ────────────────────────────────────────────────────────────────────
export async function handleWorkflowTool(name, args, _client) {
    if (name === "dataverse_list_workflows") {
        const items = Array.from(WORKFLOWS.values()).map((w) => ({
            name: w.name,
            description: w.description,
            tags: w.tags,
            stepCount: w.steps.length,
        }));
        return formatList("workflows", items, [
            "Use dataverse_get_workflow with a workflow name to see detailed steps",
        ]);
    }
    if (name === "dataverse_get_workflow") {
        const { name: wfName } = args;
        const workflow = WORKFLOWS.get(wfName);
        if (!workflow) {
            const available = Array.from(WORKFLOWS.keys()).join(", ");
            throw new Error(`Unknown workflow: "${wfName}". Available workflows: ${available}`);
        }
        return formatData(`Workflow "${workflow.name}": ${workflow.description}`, workflow, workflow.steps.map((s) => `Step ${s.order}: ${s.tool} — ${s.description}`));
    }
    throw new Error(`Unknown workflow tool: ${name}`);
}
// ── Exported for testing ───────────────────────────────────────────────────────
export { WORKFLOWS };
//# sourceMappingURL=workflow.tools.js.map