import { formatData, formatList } from "./output.utils.js";
// ── Tag Registry ───────────────────────────────────────────────────────────────
const TOOL_TAGS = {
    dataverse_query: ["query", "read", "odata"],
    dataverse_execute_fetchxml: ["query", "read", "fetchxml", "aggregate"],
    dataverse_create: ["write", "crud", "create"],
    dataverse_update: ["write", "crud", "update"],
    dataverse_delete: ["write", "crud", "delete", "destructive"],
    dataverse_get: ["read", "crud", "get"],
    dataverse_search: ["search", "read", "fulltext"],
    dataverse_list_tables: ["metadata", "schema", "read"],
    dataverse_get_table_metadata: ["metadata", "schema", "read"],
    dataverse_get_relationships: ["metadata", "schema", "relations", "read"],
    dataverse_list_views: ["metadata", "views", "read"],
    dataverse_get_view_definition: ["metadata", "views", "read"],
    dataverse_batch_execute: ["write", "bulk", "batch"],
    dataverse_whoami: ["auth", "identity", "read"],
    dataverse_list_solutions: ["solutions", "read", "alm"],
    dataverse_get_solution_components: ["solutions", "read", "alm"],
    dataverse_export_solution: ["solutions", "write", "alm"],
    dataverse_import_solution: ["solutions", "write", "alm"],
    dataverse_track_changes: ["sync", "delta", "read"],
    dataverse_execute_action: ["actions", "write", "custom"],
    dataverse_execute_bound_action: ["actions", "write", "custom"],
    dataverse_publish_customizations: ["customization", "write"],
    dataverse_upsert: ["write", "crud", "upsert"],
    dataverse_count: ["query", "read", "count"],
    dataverse_retrieve_multiple_with_paging: ["query", "read", "paging"],
    dataverse_audit_get_history: ["audit", "read"],
    dataverse_audit_get_detail: ["audit", "read"],
    dataverse_list_users: ["admin", "users", "read"],
    dataverse_get_user_roles: ["admin", "users", "security", "read"],
    dataverse_get_user_teams: ["admin", "users", "teams", "read"],
    dataverse_list_teams: ["admin", "teams", "read"],
    dataverse_get_team_members: ["admin", "teams", "read"],
    dataverse_upload_file: ["files", "write", "upload"],
    dataverse_download_file: ["files", "read", "download"],
    dataverse_delete_file: ["files", "write", "delete"],
    dataverse_associate: ["relations", "write"],
    dataverse_disassociate: ["relations", "write"],
    dataverse_impersonate: ["security", "admin"],
    dataverse_impersonate_clear: ["security", "admin"],
    dataverse_list_environments: ["admin", "environments", "read"],
    dataverse_get_environment_details: ["admin", "environments", "read"],
    dataverse_get_environment_settings: ["admin", "environments", "read"],
    dataverse_get_trace_logs: ["debug", "trace", "read"],
    dataverse_get_plugin_types: ["debug", "plugins", "read"],
    dataverse_get_sdkmessageprocessingsteps: ["debug", "plugins", "read"],
    dataverse_get_workflow_definitions: ["debug", "workflows", "read"],
    dataverse_validate_entity: ["quality", "read", "validation"],
    dataverse_list_duplicate_rules: ["quality", "read"],
    dataverse_list_notes: ["notes", "read"],
    dataverse_create_note: ["notes", "write"],
    dataverse_get_org_details: ["admin", "org", "read"],
    dataverse_get_org_settings: ["admin", "org", "read"],
    dataverse_get_global_option_set: ["metadata", "schema", "read"],
    dataverse_publish_component: ["customization", "write"],
    dataverse_get_entity_xml: ["customization", "metadata", "read"],
};
// ── Tool descriptions (for matching without registry dependency) ────────────
const TOOL_DESCRIPTIONS = {
    dataverse_query: "Query Dataverse tables using OData syntax",
    dataverse_execute_fetchxml: "Execute FetchXML queries with aggregation support",
    dataverse_create: "Create a new record in a Dataverse table",
    dataverse_update: "Update an existing Dataverse record",
    dataverse_delete: "Delete a Dataverse record",
    dataverse_get: "Retrieve a single record by ID",
    dataverse_search: "Full-text search across Dataverse tables",
    dataverse_list_tables: "List available Dataverse tables",
    dataverse_get_table_metadata: "Get column definitions for a table",
    dataverse_get_relationships: "Get relationships for a table",
    dataverse_list_views: "List saved views for a table",
    dataverse_get_view_definition: "Get the definition of a saved view",
    dataverse_batch_execute: "Execute multiple operations in a batch",
    dataverse_whoami: "Get current authenticated user context",
    dataverse_list_solutions: "List solutions in the environment",
    dataverse_get_solution_components: "Get components of a solution",
    dataverse_export_solution: "Export a solution as a ZIP file",
    dataverse_import_solution: "Import a solution from a ZIP file",
    dataverse_track_changes: "Track changes (delta sync) for a table",
    dataverse_execute_action: "Execute a custom unbound action",
    dataverse_execute_bound_action: "Execute a custom bound action",
    dataverse_publish_customizations: "Publish all customizations",
    dataverse_upsert: "Create or update a record by alternate key",
    dataverse_count: "Count records in a table",
    dataverse_retrieve_multiple_with_paging: "Query with automatic paging",
    dataverse_audit_get_history: "Get audit history for a record",
    dataverse_audit_get_detail: "Get audit detail for a specific change",
    dataverse_list_users: "List system users",
    dataverse_get_user_roles: "Get security roles for a user",
    dataverse_get_user_teams: "Get teams a user belongs to",
    dataverse_list_teams: "List teams in the environment",
    dataverse_get_team_members: "Get members of a team",
    dataverse_upload_file: "Upload a file to a record",
    dataverse_download_file: "Download a file from a record",
    dataverse_delete_file: "Delete a file from a record",
    dataverse_associate: "Associate two records via a relationship",
    dataverse_disassociate: "Remove association between two records",
    dataverse_impersonate: "Set impersonation for subsequent calls",
    dataverse_impersonate_clear: "Clear impersonation",
    dataverse_list_environments: "List available environments",
    dataverse_get_environment_details: "Get environment details",
    dataverse_get_environment_settings: "Get environment settings",
    dataverse_get_trace_logs: "Get plugin trace logs",
    dataverse_get_plugin_types: "Get registered plugin types",
    dataverse_get_sdkmessageprocessingsteps: "Get SDK message processing steps",
    dataverse_get_workflow_definitions: "Get workflow/flow definitions",
    dataverse_validate_entity: "Validate entity configuration quality",
    dataverse_list_duplicate_rules: "List duplicate detection rules",
    dataverse_list_notes: "List notes/annotations on a record",
    dataverse_create_note: "Create a note on a record",
    dataverse_get_org_details: "Get organization details",
    dataverse_get_org_settings: "Get organization settings",
    dataverse_get_global_option_set: "Get a global option set definition",
    dataverse_publish_component: "Publish a single component",
    dataverse_get_entity_xml: "Get entity customization XML",
};
// ── Matching logic ─────────────────────────────────────────────────────────────
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
}
function scoreTool(toolName, tokens) {
    const tags = TOOL_TAGS[toolName] ?? [];
    const description = (TOOL_DESCRIPTIONS[toolName] ?? "").toLowerCase();
    const nameLower = toolName.toLowerCase();
    let score = 0;
    for (const token of tokens) {
        // Tag match (highest weight)
        if (tags.includes(token))
            score += 3;
        // Tool name contains token
        if (nameLower.includes(token))
            score += 2;
        // Description contains token
        if (description.includes(token))
            score += 1;
    }
    return score;
}
function suggestTools(intent) {
    const tokens = tokenize(intent);
    if (tokens.length === 0) {
        // Return general starter tools when intent is empty
        const starters = [
            "dataverse_whoami",
            "dataverse_list_tables",
            "dataverse_query",
            "dataverse_search",
            "dataverse_get_table_metadata",
        ];
        return starters.map((name) => ({
            name,
            description: TOOL_DESCRIPTIONS[name] ?? "",
            tags: TOOL_TAGS[name] ?? [],
            score: 1,
        }));
    }
    const scored = [];
    for (const toolName of Object.keys(TOOL_TAGS)) {
        const s = scoreTool(toolName, tokens);
        if (s > 0) {
            scored.push({
                name: toolName,
                description: TOOL_DESCRIPTIONS[toolName] ?? "",
                tags: TOOL_TAGS[toolName] ?? [],
                score: s,
            });
        }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5);
}
function listTags() {
    const counts = new Map();
    for (const tags of Object.values(TOOL_TAGS)) {
        for (const tag of tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    return Array.from(counts.entries())
        .map(([tag, toolCount]) => ({ tag, toolCount }))
        .sort((a, b) => b.toolCount - a.toolCount);
}
// ── Tool Definitions ───────────────────────────────────────────────────────────
export const routerTools = [
    {
        name: "dataverse_suggest_tools",
        description: "Suggests the most relevant Dataverse tools for a given intent. " +
            "Provide a natural-language description of what you want to do and " +
            "this tool returns the top 5 matching tools with descriptions and tags.",
        inputSchema: {
            type: "object",
            properties: {
                intent: {
                    type: "string",
                    description: "Natural language description of the desired action",
                },
            },
            required: ["intent"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    {
        name: "dataverse_list_tool_tags",
        description: "Lists all available tool tags with the number of tools in each category. " +
            "Use this to discover what kinds of operations are available.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
];
// ── Handler ────────────────────────────────────────────────────────────────────
export async function handleRouterTool(name, args, _client) {
    if (name === "dataverse_suggest_tools") {
        const { intent } = (args ?? {});
        const results = suggestTools(intent ?? "");
        const suggestions = results.length > 0
            ? [`Try: ${results[0].name}`]
            : ["Use dataverse_list_tool_tags to explore categories"];
        return formatData(`${results.length} tools match intent "${intent ?? ""}"`, results, suggestions);
    }
    if (name === "dataverse_list_tool_tags") {
        const tags = listTags();
        return formatList("tags", tags, [
            "Use dataverse_suggest_tools with an intent to find specific tools",
        ]);
    }
    throw new Error(`Unknown router tool: ${name}`);
}
//# sourceMappingURL=router.tools.js.map