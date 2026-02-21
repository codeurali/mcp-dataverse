import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';

export const qualityTools = [
  {
    name: 'dataverse_detect_duplicates',
    description:
      'Checks for potential duplicate records before creating. Uses Dataverse built-in duplicate detection rules. Pass the prospective record fields to check against existing records.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entityLogicalName: {
          type: 'string',
          description: 'Table to check, e.g., "account"',
        },
        record: {
          type: 'object',
          description: 'The prospective record fields to check for duplicates',
        },
        top: {
          type: 'number',
          description: 'Maximum number of duplicates to return (default 5, max 20)',
        },
      },
      required: ['entityLogicalName', 'record'],
    },
  },
];

const DetectDuplicatesInput = z.object({
  entityLogicalName: z
    .string()
    .min(1)
    .regex(/^[a-z_][a-z0-9_]*$/i, 'Must be a valid Dataverse logical name'),
  record: z.record(z.string(), z.unknown()),
  top: z.number().int().positive().max(20).optional().default(5),
});

export async function handleQualityTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'dataverse_detect_duplicates': {
      const params = DetectDuplicatesInput.parse(args);

      const body: Record<string, unknown> = {
        BusinessEntity: {
          '@odata.type': `Microsoft.Dynamics.CRM.${params.entityLogicalName}`,
          ...params.record,
        },
        MatchingEntityName: params.entityLogicalName,
        PagingInfo: {
          PageNumber: 1,
          Count: params.top,
        },
      };

      const raw = (await client.executeAction('RetrieveDuplicates', body)) as Record<
        string,
        unknown
      >;

      const duplicates = (raw['value'] ?? []) as Array<Record<string, unknown>>;

      const result = {
        hasDuplicates: duplicates.length > 0,
        duplicateCount: duplicates.length,
        duplicates: duplicates.map((d) => {
          const clean: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(d)) {
            if (!key.startsWith('@')) clean[key] = val;
          }
          return clean;
        }),
      };

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown quality tool: ${name}`);
  }
}
