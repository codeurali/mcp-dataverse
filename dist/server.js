#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseTransportArgs } from "./transport.js";
import { loadConfig } from "./config/config.loader.js";
import { createAuthProvider } from "./auth/auth-provider.factory.js";
import { DataverseAdvancedClient } from "./dataverse/dataverse-client-advanced.js";
import { createToolRegistry } from "./tools/tool-registry.js";
import { ProgressReporter } from "./tools/progress.js";
import { authTools, handleAuthTool } from "./tools/auth.tools.js";
import { metadataTools, handleMetadataTool } from "./tools/metadata.tools.js";
import { queryTools, handleQueryTool } from "./tools/query.tools.js";
import { crudTools, handleCrudTool } from "./tools/crud.tools.js";
import { relationTools, handleRelationTool } from "./tools/relations.tools.js";
import { actionTools, handleActionTool } from "./tools/actions.tools.js";
import { batchTools, handleBatchTool } from "./tools/batch.tools.js";
import { trackingTools, handleTrackingTool } from "./tools/tracking.tools.js";
import { solutionTools, handleSolutionTool } from "./tools/solution.tools.js";
import { impersonateTools, handleImpersonateTool, } from "./tools/impersonate.tools.js";
import { customizationTools, handleCustomizationTool, } from "./tools/customization.tools.js";
import { environmentTools, handleEnvironmentTool, } from "./tools/environment.tools.js";
import { traceTools, handleTraceTool } from "./tools/trace.tools.js";
import { searchTools, handleSearchTool } from "./tools/search.tools.js";
import { auditTools, handleAuditTool } from "./tools/audit.tools.js";
import { qualityTools, handleQualityTool } from "./tools/quality.tools.js";
import { annotationTools, handleAnnotationTool, } from "./tools/annotations.tools.js";
import { userTools, handleUserTool } from "./tools/users.tools.js";
import { viewTools, handleViewTool } from "./tools/views.tools.js";
import { orgTools, handleOrgTool } from "./tools/org.tools.js";
import { fileTools, handleFileTool } from "./tools/file.tools.js";
import { teamTools, handleTeamTool } from "./tools/teams.tools.js";
import { routerTools, handleRouterTool } from "./tools/router.tools.js";
import { listResources, listResourceTemplates, readResource, } from "./resources/resource-provider.js";
import { workflowTools, handleWorkflowTool } from "./tools/workflow.tools.js";
// ── Tool Registry — Map-based O(1) dispatch ──────────────────────────────────
const registry = createToolRegistry([
    { tools: authTools, handler: handleAuthTool },
    { tools: metadataTools, handler: handleMetadataTool },
    { tools: queryTools, handler: handleQueryTool },
    { tools: crudTools, handler: handleCrudTool },
    { tools: relationTools, handler: handleRelationTool },
    { tools: actionTools, handler: handleActionTool },
    { tools: batchTools, handler: handleBatchTool },
    { tools: trackingTools, handler: handleTrackingTool },
    { tools: solutionTools, handler: handleSolutionTool },
    { tools: customizationTools, handler: handleCustomizationTool },
    { tools: environmentTools, handler: handleEnvironmentTool },
    { tools: traceTools, handler: handleTraceTool },
    { tools: searchTools, handler: handleSearchTool },
    { tools: auditTools, handler: handleAuditTool },
    { tools: qualityTools, handler: handleQualityTool },
    { tools: annotationTools, handler: handleAnnotationTool },
    { tools: userTools, handler: handleUserTool },
    { tools: viewTools, handler: handleViewTool },
    { tools: orgTools, handler: handleOrgTool },
    { tools: fileTools, handler: handleFileTool },
    { tools: teamTools, handler: handleTeamTool },
    { tools: workflowTools, handler: handleWorkflowTool },
    { tools: routerTools, handler: handleRouterTool },
]);
// Impersonate is registered separately — it has a special dispatch signature
const IMPERSONATE_NAMES = new Set(impersonateTools.map((t) => t.name));
// Read version from package.json so server.ts never drifts out of sync
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_VERSION = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8")).version;
// ── Global MCP Instructions ──────────────────────────────────────────────────
const SERVER_INSTRUCTIONS = `You are connected to a Microsoft Dataverse environment via the mcp-dataverse server.

## Recommended Workflow
1. Start with dataverse_whoami to verify authentication.
2. Use dataverse_list_tables to discover available tables (custom tables only by default).
3. Use dataverse_get_table_metadata to inspect column names, types, and required fields before querying or writing.
4. Query data with dataverse_query (OData) or dataverse_execute_fetchxml (complex joins/aggregations).
5. Use dataverse_create / dataverse_update / dataverse_delete for record operations.

## Best Practices
- Always specify $select to minimize payload size — never fetch all columns.
- Use $top to limit results (default 50, max 5000 per page).
- Prefer dataverse_query for simple reads; use dataverse_execute_fetchxml for aggregations, multi-table joins, or many-to-many traversal.
- Use dataverse_get_table_metadata before creating/updating records to confirm correct logical field names.
- For bulk operations (>5 records), use dataverse_batch_execute to reduce HTTP round-trips.
- Use dataverse_search for full-text search across multiple tables when you don't know which table contains the data.
- Check dataverse_get_relationships before building FetchXML joins or using dataverse_associate/dataverse_disassociate.

## Safety
- dataverse_delete is irreversible — always confirm with the user first.
- Use optimistic concurrency (etag parameter) on updates to prevent lost changes.
- Impersonation requires explicit privilege and is denied for System Administrator users.

## Performance
- Avoid retrieving more than 5000 records unless explicitly needed (use dataverse_retrieve_multiple_with_paging with maxTotal).
- Use server-side filtering ($filter / FetchXML conditions) instead of client-side filtering.
- Cache table metadata — it rarely changes during a session.
`;
/**
 * Routes a tool call to its handler via the registry Map.
 * Used directly by the request handler and passed as the dispatch
 * function to handleImpersonateTool.
 */
function dispatchTool(name, args, client, progress) {
    const handler = registry.getHandler(name);
    if (!handler)
        throw new Error(`Unknown tool: ${name}`);
    return handler(name, args, client, progress);
}
async function main() {
    const config = loadConfig();
    const authProvider = createAuthProvider(config);
    const client = new DataverseAdvancedClient(authProvider, config.maxRetries, config.requestTimeoutMs);
    const server = new Server({ name: "mcp-dataverse", version: SERVER_VERSION }, {
        capabilities: { tools: {}, resources: {} },
        instructions: SERVER_INSTRUCTIONS,
    });
    // Combine registry definitions with impersonate tools
    const allToolDefs = [...registry.getAllDefinitions(), ...impersonateTools];
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: allToolDefs,
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const progressToken = request.params._meta?.progressToken;
        const progress = new ProgressReporter(progressToken != null ? server : undefined, progressToken);
        try {
            if (IMPERSONATE_NAMES.has(name)) {
                return handleImpersonateTool(name, args, client, dispatchTool);
            }
            return await dispatchTool(name, args, client, progress);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: "text", text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
    // ── Resource Handlers ────────────────────────────────────────────────────
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: listResources(),
    }));
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
        resourceTemplates: listResourceTemplates(),
    }));
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const contents = await readResource(request.params.uri, client, SERVER_INSTRUCTIONS);
        return { contents: [contents] };
    });
    const transportArgs = parseTransportArgs();
    if (transportArgs.transport === "http") {
        const { startHttpTransport } = await import("./http-server.js");
        const toolCount = allToolDefs.length;
        process.stderr.write(`Starting HTTP transport on port ${transportArgs.port}...\n`);
        // Trigger auth before accepting requests
        try {
            await authProvider.getToken();
            process.stderr.write("[mcp-dataverse] Authenticated ✓\n");
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[mcp-dataverse] Authentication failed: ${msg}\n`);
        }
        await startHttpTransport(server, transportArgs.port, SERVER_VERSION, toolCount);
    }
    else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        // Do not log to stdout — stdio transport uses stdout for protocol messages
        process.stderr.write("MCP Dataverse server started\n");
        // Proactively trigger authentication at startup so the device-code prompt
        // appears immediately in the VS Code MCP Output panel (View → Output → MCP),
        // rather than only on the first tool call.
        authProvider
            .getToken()
            .then(() => {
            process.stderr.write("[mcp-dataverse] Authenticated ✓\n");
        })
            .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[mcp-dataverse] Authentication failed: ${msg}\n`);
        });
    }
}
async function entry() {
    if (process.argv.includes("install")) {
        const { runInstall } = await import("./install.js");
        await runInstall();
        process.exit(0);
    }
    if (process.argv.includes("doctor")) {
        const { runDoctor } = await import("./doctor.js");
        await runDoctor();
    }
    await main();
}
entry().catch((error) => {
    process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
//# sourceMappingURL=server.js.map