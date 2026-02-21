#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { loadConfig } from './config/config.loader.js';
import { createAuthProvider } from './auth/auth-provider.factory.js';
import { DataverseAdvancedClient } from './dataverse/dataverse-client-advanced.js';

import { authTools, handleAuthTool } from './tools/auth.tools.js';
import { metadataTools, handleMetadataTool } from './tools/metadata.tools.js';
import { queryTools, handleQueryTool } from './tools/query.tools.js';
import { crudTools, handleCrudTool } from './tools/crud.tools.js';
import { relationTools, handleRelationTool } from './tools/relations.tools.js';
import { actionTools, handleActionTool } from './tools/actions.tools.js';
import { batchTools, handleBatchTool } from './tools/batch.tools.js';
import { trackingTools, handleTrackingTool } from './tools/tracking.tools.js';
import { solutionTools, handleSolutionTool } from './tools/solution.tools.js';
import { impersonateTools, handleImpersonateTool } from './tools/impersonate.tools.js';
import { customizationTools, handleCustomizationTool } from './tools/customization.tools.js';
import { environmentTools, handleEnvironmentTool } from './tools/environment.tools.js';
import { traceTools, handleTraceTool } from './tools/trace.tools.js';
import { searchTools, handleSearchTool } from './tools/search.tools.js';
import { auditTools, handleAuditTool } from './tools/audit.tools.js';
import { qualityTools, handleQualityTool } from './tools/quality.tools.js';
import { annotationTools, handleAnnotationTool } from './tools/annotations.tools.js';
import { userTools, handleUserTool } from './tools/users.tools.js';
import { viewTools, handleViewTool } from './tools/views.tools.js';
import { orgTools, handleOrgTool } from './tools/org.tools.js';
import { fileTools, handleFileTool } from './tools/file.tools.js';
import { teamTools, handleTeamTool } from './tools/teams.tools.js';

const ALL_TOOLS = [
  ...authTools,
  ...metadataTools,
  ...queryTools,
  ...crudTools,
  ...relationTools,
  ...actionTools,
  ...batchTools,
  ...trackingTools,
  ...solutionTools,
  ...impersonateTools,
  ...customizationTools,
  ...environmentTools,
  ...traceTools,
  ...searchTools,
  ...auditTools,
  ...qualityTools,
  ...annotationTools,
  ...userTools,
  ...viewTools,
  ...orgTools,
  ...fileTools,
  ...teamTools,
];

// Pre-build routing sets once at startup to avoid per-request allocations
const AUTH_TOOL_NAMES = new Set(authTools.map(t => t.name));
const METADATA_TOOL_NAMES = new Set(metadataTools.map(t => t.name));
const QUERY_TOOL_NAMES = new Set(queryTools.map(t => t.name));
const CRUD_TOOL_NAMES = new Set(crudTools.map(t => t.name));
const RELATION_TOOL_NAMES = new Set(relationTools.map(t => t.name));
const ACTION_TOOL_NAMES = new Set(actionTools.map(t => t.name));
const BATCH_TOOL_NAMES = new Set(batchTools.map(t => t.name));
const TRACKING_TOOL_NAMES = new Set(trackingTools.map(t => t.name));
const SOLUTION_TOOL_NAMES = new Set(solutionTools.map(t => t.name));
const IMPERSONATE_TOOL_NAMES = new Set(impersonateTools.map(t => t.name));
const CUSTOMIZATION_TOOL_NAMES = new Set(customizationTools.map(t => t.name));
const ENVIRONMENT_TOOL_NAMES = new Set(environmentTools.map(t => t.name));
const TRACE_TOOL_NAMES = new Set(traceTools.map(t => t.name));
const SEARCH_TOOL_NAMES = new Set(searchTools.map(t => t.name));
const AUDIT_TOOL_NAMES = new Set(auditTools.map(t => t.name));
const QUALITY_TOOL_NAMES = new Set(qualityTools.map(t => t.name));
const ANNOTATION_TOOL_NAMES = new Set(annotationTools.map(t => t.name));
const USER_TOOL_NAMES = new Set(userTools.map(t => t.name));
const VIEW_TOOL_NAMES = new Set(viewTools.map(t => t.name));
const ORG_TOOL_NAMES = new Set(orgTools.map(t => t.name));
const FILE_TOOL_NAMES = new Set(fileTools.map(t => t.name));
const TEAM_TOOL_NAMES = new Set(teamTools.map(t => t.name));

// Read version from package.json so server.ts never drifts out of sync
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_VERSION = (JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as { version: string }).version;

/**
 * Routes a tool call to its handler. Used directly by the request handler
 * and passed as the dispatch function to handleImpersonateTool.
 */
async function dispatchTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  if (AUTH_TOOL_NAMES.has(name)) return handleAuthTool(name, args, client);
  if (METADATA_TOOL_NAMES.has(name)) return handleMetadataTool(name, args, client);
  if (QUERY_TOOL_NAMES.has(name)) return handleQueryTool(name, args, client);
  if (CRUD_TOOL_NAMES.has(name)) return handleCrudTool(name, args, client);
  if (RELATION_TOOL_NAMES.has(name)) return handleRelationTool(name, args, client);
  if (ACTION_TOOL_NAMES.has(name)) return handleActionTool(name, args, client);
  if (BATCH_TOOL_NAMES.has(name)) return handleBatchTool(name, args, client);
  if (TRACKING_TOOL_NAMES.has(name)) return handleTrackingTool(name, args, client);
  if (SOLUTION_TOOL_NAMES.has(name)) return handleSolutionTool(name, args, client);
  if (CUSTOMIZATION_TOOL_NAMES.has(name)) return handleCustomizationTool(name, args, client);
  if (ENVIRONMENT_TOOL_NAMES.has(name)) return handleEnvironmentTool(name, args, client);
  if (TRACE_TOOL_NAMES.has(name)) return handleTraceTool(name, args, client);
  if (SEARCH_TOOL_NAMES.has(name)) return handleSearchTool(name, args, client);
  if (AUDIT_TOOL_NAMES.has(name)) return handleAuditTool(name, args, client);
  if (QUALITY_TOOL_NAMES.has(name)) return handleQualityTool(name, args, client);
  if (ANNOTATION_TOOL_NAMES.has(name)) return handleAnnotationTool(name, args, client);
  if (USER_TOOL_NAMES.has(name)) return handleUserTool(name, args, client);
  if (VIEW_TOOL_NAMES.has(name)) return handleViewTool(name, args, client);
  if (ORG_TOOL_NAMES.has(name)) return handleOrgTool(name, args, client);
  if (FILE_TOOL_NAMES.has(name)) return handleFileTool(name, args, client);
  if (TEAM_TOOL_NAMES.has(name)) return handleTeamTool(name, args, client);
  throw new Error(`Unknown tool: ${name}`);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const authProvider = createAuthProvider(config);
  const client = new DataverseAdvancedClient(authProvider, config.maxRetries, config.requestTimeoutMs);

  const server = new Server(
    { name: 'mcp-dataverse', version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (IMPERSONATE_TOOL_NAMES.has(name)) {
        return handleImpersonateTool(name, args, client, dispatchTool);
      }
      return await dispatchTool(name, args, client);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Do not log to stdout — stdio transport uses stdout for protocol messages
  process.stderr.write('MCP Dataverse server started\n');
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
