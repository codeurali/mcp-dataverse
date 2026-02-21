import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';
import { safeEntitySetName } from './validation.utils.js';

/**
 * Dataverse entities whose EntitySetName does not follow the simple <logicalName>+s pattern.
 * Used to resolve the correct entity set name when auto-extracting from FetchXML.
 */
const IRREGULAR_ENTITY_SET_NAMES: Record<string, string> = {
  opportunity: 'opportunities',
  territory: 'territories',
  category: 'categories',
  activityparty: 'activityparties',
  activitymimeattachment: 'activitymimeattachments',
  queue: 'queues',
  queueitem: 'queueitems',
  dependency: 'dependencies',
  salesliteratureitem: 'salesliteratureitems',
  contractdetail: 'contractdetails',
  discounttype: 'discounttypes',
  entitlementtemplate: 'entitlementtemplates',
  pricelevel: 'pricelevels',
};

export const queryTools = [
  {
    name: 'dataverse_query',
    description: 'Queries a Dataverse table using OData ($filter, $select, $orderby, $top, $expand, $count). Use for simple to moderate reads on a single table or with shallow $expand for related fields. Always specify $select to minimize payload. For complex aggregations (count, sum, avg), multi-entity joins, many-to-many traversal, or advanced FetchXML-only operators, use dataverse_execute_fetchxml instead.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: {
          type: 'string',
          description: 'The OData entity set name (e.g., "accounts", "contacts", "new_mytables")',
        },
        select: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to return. Always specify to minimize payload.',
        },
        filter: {
          type: 'string',
          description: 'OData $filter expression (e.g., "statecode eq 0 and new_amount gt 1000")',
        },
        orderby: {
          type: 'string',
          description: 'OData $orderby expression (e.g., "createdon desc")',
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return (default: 50)',
        },
        expand: {
          type: 'string',
          description: 'OData $expand for related entities (e.g., "parentaccountid($select=name)")',
        },
        count: {
          type: 'boolean',
          description: 'Include total record count in response',
        },
        apply: {
          type: 'string',
          description: 'OData $apply for server-side aggregation (e.g., "groupby((statuscode),aggregate($count as count))")',
        },
      },
      required: ['entitySetName'],
    },
  },
  {
    name: 'dataverse_execute_fetchxml',
    description: 'Executes a FetchXML query against Dataverse — use for complex scenarios requiring aggregations (count, sum, avg, min, max with grouping), linked-entity joins across multiple tables, many-to-many relationship traversal, or advanced filtering not expressible in OData. Returns a typed array of records. entitySetName is optional — if omitted it is extracted from the <entity name="..."> element in the FetchXML.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: {
          type: 'string',
          description: 'OData entity set name of the root entity (e.g., "accounts"). If omitted, extracted from the <entity name="..."> element in the FetchXML.',
        },
        fetchXml: {
          type: 'string',
          description: 'The complete FetchXML query string',
        },
      },
      required: ['fetchXml'],
    },
  },
  {
    name: 'dataverse_retrieve_multiple_with_paging',
    description: 'Retrieves ALL records matching a query by automatically following OData nextLink pages. Use instead of dataverse_query when you need more than 5000 records or all records in a table. Returns totalRetrieved count. Set maxTotal to cap retrieval (default 5000, max 50000) to avoid overwhelming the context.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: { type: 'string', description: 'OData entity set name (e.g., "accounts")' },
        select: { type: 'array', items: { type: 'string' } },
        filter: { type: 'string' },
        orderby: { type: 'string' },
        expand: { type: 'string' },
        maxTotal: {
          type: 'number',
          description: 'Maximum records to retrieve (default: 5000, max: 50000)',
        },
      },
      required: ['entitySetName'],
    },
  },
];

const QueryInput = z.object({
  entitySetName: safeEntitySetName,
  select: z.array(z.string()).optional(),
  filter: z.string().optional(),
  orderby: z.string().optional(),
  top: z.number().positive().max(5000).optional().default(50),
  expand: z.string().optional(),
  count: z.boolean().optional(),
  apply: z.string().optional(),
});

const FetchXmlInput = z.object({
  fetchXml: z.string().min(1).describe('Complete FetchXML query string'),
  entitySetName: z.string().optional().describe('OData entity set name (e.g., "accounts"). If omitted, extracted from the <entity name="..."> element in the FetchXML.'),
});

const RetrieveWithPagingInput = z.object({
  entitySetName: safeEntitySetName,
  select: z.array(z.string()).optional(),
  filter: z.string().optional(),
  orderby: z.string().optional(),
  expand: z.string().optional(),
  maxTotal: z.number().positive().max(50000).optional(),
});

export async function handleQueryTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'dataverse_query': {
      const params = QueryInput.parse(args);
      const queryOptions: Parameters<typeof client.query>[1] = {};
      if (params.select !== undefined) queryOptions.select = params.select;
      if (params.filter !== undefined) queryOptions.filter = params.filter;
      if (params.orderby !== undefined) queryOptions.orderby = params.orderby;
      if (params.top !== undefined) queryOptions.top = params.top;
      if (params.expand !== undefined) queryOptions.expand = params.expand;
      if (params.count !== undefined) queryOptions.count = params.count;
      if (params.apply !== undefined) queryOptions.apply = params.apply;
      const result = await client.query(params.entitySetName, queryOptions);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_execute_fetchxml': {
      const parsed = FetchXmlInput.parse(args);
      let entitySetName = parsed.entitySetName;
      const { fetchXml } = parsed;
      if (!entitySetName) {
        const match = fetchXml.match(/<entity\s+name=["']([^"']+)["']/i);
        if (!match) {
          return { content: [{ type: 'text', text: JSON.stringify({ isError: true, error: 'entitySetName is required when not present in FetchXML <entity> element' }) }] };
        }
        const logicalName = match[1]!;
        entitySetName = IRREGULAR_ENTITY_SET_NAMES[logicalName] ?? (logicalName + 's');
      }
      const result = await client.executeFetchXml(entitySetName, fetchXml);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_retrieve_multiple_with_paging': {
      const params = RetrieveWithPagingInput.parse(args);
      const pagingOptions: Parameters<typeof client.queryWithPaging>[1] = {};
      if (params.select !== undefined) pagingOptions.select = params.select;
      if (params.filter !== undefined) pagingOptions.filter = params.filter;
      if (params.orderby !== undefined) pagingOptions.orderby = params.orderby;
      if (params.expand !== undefined) pagingOptions.expand = params.expand;
      if (params.maxTotal !== undefined) pagingOptions.maxTotal = params.maxTotal;
      const result = await client.queryWithPaging(params.entitySetName, pagingOptions);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown query tool: ${name}`);
  }
}
