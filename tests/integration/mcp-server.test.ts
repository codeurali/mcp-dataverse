import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';
import { authTools, handleAuthTool } from '../../src/tools/auth.tools.js';
import { metadataTools, handleMetadataTool } from '../../src/tools/metadata.tools.js';
import { queryTools, handleQueryTool } from '../../src/tools/query.tools.js';
import { crudTools, handleCrudTool } from '../../src/tools/crud.tools.js';
import { relationTools, handleRelationTool } from '../../src/tools/relations.tools.js';
import { actionTools, handleActionTool } from '../../src/tools/actions.tools.js';
import { batchTools, handleBatchTool } from '../../src/tools/batch.tools.js';

const ALL_TOOLS = [
  ...authTools,
  ...metadataTools,
  ...queryTools,
  ...crudTools,
  ...relationTools,
  ...actionTools,
  ...batchTools,
];

function buildTestServer(dvClient: DataverseAdvancedClient): Server {
  const server = new Server(
    { name: 'mcp-dataverse-test', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  const authNames = new Set(authTools.map(t => t.name));
  const metadataNames = new Set(metadataTools.map(t => t.name));
  const queryNames = new Set(queryTools.map(t => t.name));
  const crudNames = new Set(crudTools.map(t => t.name));
  const relationNames = new Set(relationTools.map(t => t.name));
  const actionNames = new Set(actionTools.map(t => t.name));
  const batchNames = new Set(batchTools.map(t => t.name));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: ALL_TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (authNames.has(name)) return handleAuthTool(name, args, dvClient);
      if (metadataNames.has(name)) return handleMetadataTool(name, args, dvClient);
      if (queryNames.has(name)) return handleQueryTool(name, args, dvClient);
      if (crudNames.has(name)) return handleCrudTool(name, args, dvClient);
      if (relationNames.has(name)) return handleRelationTool(name, args, dvClient);
      if (actionNames.has(name)) return handleActionTool(name, args, dvClient);
      if (batchNames.has(name)) return handleBatchTool(name, args, dvClient);
      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

describe('MCP Server Integration (InMemoryTransport)', () => {
  let client: Client;
  let server: Server;
  let mockWhoAmI: jest.Mock;

  beforeEach(async () => {
    mockWhoAmI = jest.fn().mockResolvedValue({
      UserId: 'test-user-id',
      BusinessUnitId: 'test-bu-id',
      OrganizationId: 'test-org-id',
      OrganizationName: 'Test Org',
      EnvironmentUrl: 'https://testenv.crm.dynamics.com',
    });

    const dvClient = { whoAmI: mockWhoAmI } as unknown as DataverseAdvancedClient;
    server = buildTestServer(dvClient);

    const [ct, st] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'test-client', version: '0.1.0' }, { capabilities: {} });

    await server.connect(st);
    await client.connect(ct);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it('ListTools returns all expected tool names', async () => {
    const result = await client.listTools();
    const names = result.tools.map(t => t.name);

    expect(names).toContain('dataverse_whoami');
    expect(names).toContain('dataverse_list_tables');
    expect(names).toContain('dataverse_query');
    expect(names).toContain('dataverse_get');
    expect(names).toContain('dataverse_create');
    expect(names).toContain('dataverse_execute_action');
    expect(names).toContain('dataverse_list_dependencies');
    expect(names).toContain('dataverse_batch_execute');
    expect(names.length).toBe(ALL_TOOLS.length);
  });

  it('CallTool dataverse_whoami returns structured user info', async () => {
    const result = await client.callTool({ name: 'dataverse_whoami', arguments: {} });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const text = content[0]?.text ?? '';
    const parsed = JSON.parse(text) as {
      userId: string; businessUnitId: string; organizationId: string;
      organizationName: string; environmentUrl: string;
    };
    expect(parsed.userId).toBe('test-user-id');
    expect(parsed.businessUnitId).toBe('test-bu-id');
    expect(parsed.organizationId).toBe('test-org-id');
    expect(parsed.organizationName).toBe('Test Org');
    expect(parsed.environmentUrl).toBe('https://testenv.crm.dynamics.com');
    expect(mockWhoAmI).toHaveBeenCalledTimes(1);
  });

  it('CallTool with unknown name returns isError: true', async () => {
    const result = await client.callTool({ name: 'nonexistent_tool_xyz', arguments: {} });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    const text = content[0]?.text ?? '';
    expect(text).toContain('Unknown tool');
    expect(text).toContain('nonexistent_tool_xyz');
  });
});
