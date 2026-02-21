import { z } from 'zod';
import type { DataverseMetadataClient } from '../dataverse/dataverse-client.metadata.js';

export const metadataTools = [
  {
    name: 'dataverse_list_tables',
    description: 'Lists all Dataverse tables. By default returns ONLY custom (non-system) tables. Set includeSystemTables=true to include all ~1700+ system tables.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        includeSystemTables: {
          type: 'boolean',
          description: 'Include system tables. Default false = custom tables only.',
        },
      },
      required: [],
    },
  },
  {
    name: 'dataverse_get_table_metadata',
    description: 'Returns full schema metadata for a Dataverse table: all attribute (column) logical names, display names, data types, required levels, and lookup target entities. Use this before writing queries or creating/updating records to confirm correct field names and types. Set includeAttributes=false if you only need table-level metadata without column details.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        logicalName: {
          type: 'string',
          description: 'The logical name of the table (e.g., "account", "contact", "new_mytable")',
        },
        includeAttributes: {
          type: 'boolean',
          description: 'Include attribute (column) definitions. Default: true',
        },
      },
      required: ['logicalName'],
    },
  },
  {
    name: 'dataverse_get_relationships',
    description: 'Returns all relationship definitions (1:N, N:1, N:N) for a Dataverse table, including relationship schema names, referenced/referencing entity names, and lookup attribute names. Use to determine the correct relationshipName for dataverse_associate/dataverse_disassociate, or to map lookup fields before building FetchXML joins. Use relationshipType to filter results.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        logicalName: {
          type: 'string',
          description: 'The logical name of the table',
        },
        relationshipType: {
          type: 'string',
          enum: ['OneToMany', 'ManyToOne', 'ManyToMany', 'All'],
          description: 'Filter by relationship type. Default: All',
        },
      },
      required: ['logicalName'],
    },
  },
  {
    name: 'dataverse_list_global_option_sets',
    description: 'Lists all global (shared) option sets defined in the Dataverse environment, returning their names and metadata IDs. Use this to discover available option sets before calling dataverse_get_option_set to retrieve their values. Prefer this over dataverse_get_table_metadata when you need to find option sets that are reused across multiple tables.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'dataverse_get_option_set',
    description: 'Returns all option labels and their integer values for a named global option set. Use this to look up the numeric code for a picklist value before filtering records (e.g., statecode or statuscode equivalents), or to populate dropdowns with correct option values.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The name of the global option set',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'dataverse_get_entity_key',
    description: 'Returns all alternate key definitions for a Dataverse table. Useful before using dataverse_upsert to know which fields serve as alternate keys, their index status (Active/InProgress/Failed), and whether they are customizable.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tableName: {
          type: 'string',
          description: 'Logical name of the table (e.g., "account", "contact")',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'dataverse_get_attribute_option_set',
    description: 'Returns all option labels and integer values for a table-specific attribute (Picklist, Status, or State field). Use to look up the numeric codes for a column\'s choices before filtering or updating records.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entityLogicalName: {
          type: 'string',
          description: 'Logical name of the table (e.g., "account", "contact")',
        },
        attributeLogicalName: {
          type: 'string',
          description: 'Logical name of the attribute (e.g., "statuscode", "industrycode")',
        },
      },
      required: ['entityLogicalName', 'attributeLogicalName'],
    },
  },
];

const GetTableMetadataInput = z.object({
  logicalName: z.string().min(1),
  includeAttributes: z.boolean().optional().default(true),
});

const GetRelationshipsInput = z.object({
  logicalName: z.string().min(1),
  relationshipType: z.enum(['OneToMany', 'ManyToOne', 'ManyToMany', 'All']).optional(),
});

const ListTablesInput = z.object({
  includeSystemTables: z.boolean().default(false).optional().describe('Include system tables. Default false = custom tables only.'),
});

const GetOptionSetInput = z.object({
  name: z.string().min(1),
});

const GetEntityKeyInput = z.object({
  tableName: z.string().min(1).describe('Logical name of the table (e.g., "account", "contact")'),
});

const DV_NAME_RE = /^[a-z_][a-z0-9_]*$/;

const GetAttributeOptionSetInput = z.object({
  entityLogicalName: z.string().min(1).regex(DV_NAME_RE, 'Invalid Dataverse logical name'),
  attributeLogicalName: z.string().min(1).regex(DV_NAME_RE, 'Invalid Dataverse logical name'),
});

export async function handleMetadataTool(
  name: string,
  args: unknown,
  client: DataverseMetadataClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'dataverse_list_tables': {
      const { includeSystemTables = false } = ListTablesInput.parse(args ?? {});
      const customOnly = !includeSystemTables;
      const result = await client.listTables(customOnly);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_get_table_metadata': {
      const { logicalName, includeAttributes } = GetTableMetadataInput.parse(args);
      const result = await client.getTableMetadata(logicalName, includeAttributes);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_get_relationships': {
      const { logicalName, relationshipType } = GetRelationshipsInput.parse(args);
      const rawRelationships = await client.getRelationships(logicalName);

      const lname = logicalName.toLowerCase();
      const oneToMany = rawRelationships.filter(r =>
        r.RelationshipType === 'OneToManyRelationship' &&
        r.ReferencedEntity?.toLowerCase() === lname
      );
      const manyToOne = rawRelationships.filter(r =>
        r.RelationshipType === 'OneToManyRelationship' &&
        r.ReferencingEntity?.toLowerCase() === lname
      );
      const manyToMany = rawRelationships.filter(r =>
        r.RelationshipType === 'ManyToManyRelationship'
      );

      const includeAll = !relationshipType || relationshipType === 'All';
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            tableName: logicalName,
            oneToMany: (includeAll || relationshipType === 'OneToMany') ? oneToMany : undefined,
            manyToOne: (includeAll || relationshipType === 'ManyToOne') ? manyToOne : undefined,
            manyToMany: (includeAll || relationshipType === 'ManyToMany') ? manyToMany : undefined,
          }, null, 2)
        }]
      };
    }
    case 'dataverse_list_global_option_sets': {
      const result = await client.listGlobalOptionSets();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_get_option_set': {
      const { name: optionSetName } = GetOptionSetInput.parse(args);
      const result = await client.getOptionSet(optionSetName);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_get_entity_key': {
      const { tableName } = GetEntityKeyInput.parse(args);
      const keys = await client.getEntityKeys(tableName);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ tableName, keys, count: keys.length }, null, 2),
        }],
      };
    }
    case 'dataverse_get_attribute_option_set': {
      const { entityLogicalName, attributeLogicalName } =
        GetAttributeOptionSetInput.parse(args);
      const result = await client.getAttributeOptionSet(
        entityLogicalName,
        attributeLogicalName,
      );
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
    default:
      throw new Error(`Unknown metadata tool: ${name}`);
  }
}
