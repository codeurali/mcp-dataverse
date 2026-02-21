import { z } from 'zod';
import type { DataverseClient } from '../dataverse/dataverse-client.js';
import { safeEntitySetName, safeRelationshipName } from './validation.utils.js';

export const relationTools = [
  {
    name: 'dataverse_associate',
    description: 'Creates an association between two Dataverse records via a named N:N or 1:N relationship. Requires the relationship schema name obtainable from dataverse_get_relationships. Use for N:N relationships or to link records without modifying a lookup field directly — for simple 1:N lookups, setting the lookup field in dataverse_update is simpler.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: { type: 'string' },
        id: { type: 'string', description: 'Source record GUID' },
        relationshipName: { type: 'string', description: 'Relationship schema name' },
        relatedEntitySetName: { type: 'string', description: 'Related entity set name' },
        relatedId: { type: 'string', description: 'Related record GUID' },
      },
      required: ['entitySetName', 'id', 'relationshipName', 'relatedEntitySetName', 'relatedId'],
    },
  },
  {
    name: 'dataverse_disassociate',
    description: 'Removes an existing association between two Dataverse records on a named relationship. For N:N relationships, provide relatedId and relatedEntitySetName to build the correct $id URL. For 1:N relationships, relatedId and relatedEntitySetName are optional. Use dataverse_get_relationships to find the correct relationship schema name.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: { type: 'string' },
        id: { type: 'string' },
        relationshipName: { type: 'string' },
        relatedId: { type: 'string', description: 'Required for N:N relationships' },
        relatedEntitySetName: { type: 'string', description: 'Entity set name of the related record (required for N:N). E.g., "contacts"' },
      },
      required: ['entitySetName', 'id', 'relationshipName'],
    },
  },
];

const AssociateInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  relationshipName: safeRelationshipName,
  relatedEntitySetName: safeEntitySetName,
  relatedId: z.string().uuid(),
});

const DisassociateInput = z.object({
  entitySetName: safeEntitySetName,
  id: z.string().uuid(),
  relationshipName: safeRelationshipName,
  relatedId: z.string().uuid().optional(),
  relatedEntitySetName: safeEntitySetName.optional(),
});

export async function handleRelationTool(
  name: string,
  args: unknown,
  client: DataverseClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'dataverse_associate': {
      const { entitySetName, id, relationshipName, relatedEntitySetName, relatedId } =
        AssociateInput.parse(args);
      await client.associate(entitySetName, id, relationshipName, relatedEntitySetName, relatedId);
      return { content: [{ type: 'text', text: JSON.stringify({ message: 'Records associated successfully' }) }] };
    }
    case 'dataverse_disassociate': {
      const { entitySetName, id, relationshipName, relatedId, relatedEntitySetName } = DisassociateInput.parse(args);
      await client.disassociate(entitySetName, id, relationshipName, relatedId, relatedEntitySetName);
      return { content: [{ type: 'text', text: JSON.stringify({ message: 'Records disassociated successfully' }) }] };
    }
    default:
      throw new Error(`Unknown relation tool: ${name}`);
  }
}
