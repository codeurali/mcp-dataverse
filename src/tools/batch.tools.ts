import { z } from 'zod';
import type { DataverseBatchClient } from '../dataverse/dataverse-client.batch.js';
import type { BatchRequest } from '../dataverse/types.js';

export const batchTools = [
  {
    name: 'dataverse_batch_execute',
    description: 'Executes multiple Dataverse operations in a single HTTP $batch request to reduce network round-trips and improve throughput. Accepts up to 1000 individual GET, POST, PATCH, or DELETE requests. Use for bulk creates, updates, or deletes that need to be grouped for performance. Set useChangeset=true to wrap all mutating operations (POST/PATCH/DELETE) in an atomic changeset — a failure rolls back ALL changeset operations. Individual per-operation results (status, body) are returned as an array in the same order as the input requests.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        requests: {
          type: 'array',
          description: 'Array of batch requests to execute',
          items: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['GET', 'POST', 'PATCH', 'DELETE'],
                description: 'HTTP method',
              },
              url: {
                type: 'string',
                description: 'Relative URL (e.g., "accounts(guid)" or "contacts")',
              },
              body: {
                type: 'object',
                description: 'Request body for POST/PATCH operations',
              },
            },
            required: ['method', 'url'],
          },
        },
        useChangeset: {
          type: 'boolean',
          description: 'Wrap mutating operations (POST/PATCH/DELETE) in an atomic changeset. A failure rolls back ALL operations in the changeset. Defaults to false.',
        },
      },
      required: ['requests'],
    },
  },
];

const BatchRequestItemSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
  url: z.string().min(1)
    .refine(
      v => !/[\r\n]/.test(v),
      { message: 'Batch URL must not contain CR or LF characters' }
    )
    .refine(
      v => !v.startsWith('http'),
      { message: 'Batch URL must be a relative path, not an absolute URL' }
    )
    .refine(
      v => !/(\.\.[\/\\])|(^\.\.$)/.test(v),
      { message: 'Batch URL must not contain path traversal sequences' }
    ),
  body: z.record(z.unknown()).optional(),
});

const BatchExecuteInput = z.object({
  requests: z.array(BatchRequestItemSchema).min(1).max(1000),
  useChangeset: z
    .boolean()
    .default(false)
    .describe(
      'Wrap mutating operations (POST/PATCH/DELETE) in an atomic changeset. A failure rolls back ALL operations in the changeset.'
    ),
});

export async function handleBatchTool(
  name: string,
  args: unknown,
  client: DataverseBatchClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  if (name === 'dataverse_batch_execute') {
    const { requests, useChangeset } = BatchExecuteInput.parse(args);
    const batchRequests: BatchRequest[] = requests.map(r => ({
      method: r.method,
      url: r.url,
      body: r.body,
    }));
    const results = await client.batchExecute(batchRequests, useChangeset);
    return {
      content: [{ type: 'text', text: JSON.stringify({ results, count: results.length }, null, 2) }],
    };
  }
  throw new Error(`Unknown batch tool: ${name}`);
}
