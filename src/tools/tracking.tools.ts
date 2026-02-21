import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';

export const trackingTools = [
  {
    name: 'dataverse_change_detection',
    description:
      'Detects new, modified, and deleted records since a previous sync using Dataverse change tracking (delta queries). On first call, pass deltaToken=null to get an initial snapshot and receive a token. On subsequent calls, pass the returned token to retrieve only changes since last sync. Change tracking must be enabled on the table in Dataverse settings. Returns newAndModified records, deleted record IDs, and the nextDeltaToken for the next call.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: {
          type: 'string',
          description: 'OData entity set name (e.g., "accounts")',
        },
        deltaToken: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          description: 'Delta token from a previous call, or null for the initial sync',
        },
        select: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to return (recommended to minimise payload)',
        },
      },
      required: ['entitySetName', 'deltaToken'],
    },
  },
];

const ChangeDetectionInput = z.object({
  entitySetName: z.string().min(1),
  deltaToken: z.string().nullable(),
  select: z.array(z.string()).optional(),
});

export async function handleTrackingTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  if (name === 'dataverse_change_detection') {
    const { entitySetName, deltaToken, select } = ChangeDetectionInput.parse(args);
    const result = await client.getChangedRecords(entitySetName, deltaToken, select);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  throw new Error(`Unknown tracking tool: ${name}`);
}
