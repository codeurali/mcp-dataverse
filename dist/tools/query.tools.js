import { z } from "zod";
import { safeEntitySetName } from "./validation.utils.js";
import { formatData, mergeFormattedValues } from "./output.utils.js";
import { checkQueryGuardrails } from "./guardrails.js";
/**
 * Dataverse entities whose EntitySetName does not follow the simple <logicalName>+s pattern.
 * Used to resolve the correct entity set name when auto-extracting from FetchXML.
 */
const IRREGULAR_ENTITY_SET_NAMES = {
    opportunity: "opportunities",
    territory: "territories",
    category: "categories",
    activityparty: "activityparties",
    activitymimeattachment: "activitymimeattachments",
    queue: "queues",
    queueitem: "queueitems",
    dependency: "dependencies",
    salesliteratureitem: "salesliteratureitems",
    contractdetail: "contractdetails",
    discounttype: "discounttypes",
    entitlementtemplate: "entitlementtemplates",
    pricelevel: "pricelevels",
};
export const queryTools = [
    {
        name: "dataverse_query",
        description: "Queries a Dataverse table using OData ($filter, $select, $orderby, $top, $expand, $count). Use for simple to moderate reads on a single table or with shallow $expand for related fields. Always specify $select to minimize payload. For complex aggregations (count, sum, avg), multi-entity joins, many-to-many traversal, or advanced FetchXML-only operators, use dataverse_execute_fetchxml instead. WHEN TO USE: Single-table reads, simple filters, shallow expands, or server-side aggregation via $apply. BEST PRACTICES: Always pass $select; cap with $top; use $apply for server-side counts/grouping. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'The OData entity set name (e.g., "accounts", "contacts", "new_mytables")',
                },
                select: {
                    type: "array",
                    items: { type: "string" },
                    description: "Columns to return. Always specify to minimize payload.",
                },
                filter: {
                    type: "string",
                    description: 'OData $filter expression (e.g., "statecode eq 0 and new_amount gt 1000")',
                },
                orderby: {
                    type: "string",
                    description: 'OData $orderby expression (e.g., "createdon desc")',
                },
                top: {
                    type: "number",
                    description: "Maximum number of records to return (default: 50)",
                },
                expand: {
                    type: "string",
                    description: 'OData $expand for related entities (e.g., "parentaccountid($select=name)")',
                },
                count: {
                    type: "boolean",
                    description: "Include total record count in response",
                },
                apply: {
                    type: "string",
                    description: 'OData $apply for server-side aggregation (e.g., "groupby((statuscode),aggregate($count as count))")',
                },
                formattedValues: {
                    type: "boolean",
                    description: "When true, includes human-readable labels for picklist fields alongside raw integer codes (e.g., { value: 1, label: 'Active' }). Uses OData formatted-value annotations.",
                },
            },
            required: ["entitySetName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_execute_fetchxml",
        description: 'Executes a FetchXML query against Dataverse — use for complex scenarios requiring aggregations (count, sum, avg, min, max with grouping), linked-entity joins across multiple tables, many-to-many relationship traversal, or advanced filtering not expressible in OData. Returns a typed array of records. entitySetName is optional — if omitted it is extracted from the <entity name="..."> element in the FetchXML. WHEN TO USE: Multi-table joins, aggregations with groupby, N:N traversal, or filtering not supported by OData. BEST PRACTICES: Add page/count attributes for large result sets; prefer dataverse_query for simple reads. WORKFLOW: query_data.',
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name of the root entity (e.g., "accounts"). If omitted, extracted from the <entity name="..."> element in the FetchXML.',
                },
                fetchXml: {
                    type: "string",
                    description: "The complete FetchXML query string",
                },
                formattedValues: {
                    type: "boolean",
                    description: "When true, includes human-readable labels for picklist fields alongside raw integer codes.",
                },
            },
            required: ["fetchXml"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_retrieve_multiple_with_paging",
        description: "Retrieves ALL records matching a query by automatically following OData nextLink pages. Use instead of dataverse_query when you need more than 5000 records or all records in a table. Returns totalRetrieved count. Set maxTotal to cap retrieval (default 5000, max 50000) to avoid overwhelming the context. WHEN TO USE: You need all matching records beyond the 5000-row OData page limit or a full table export. BEST PRACTICES: Always set $select; use maxTotal to cap results and avoid context overflow. WORKFLOW: query_data.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name (e.g., "accounts")',
                },
                select: { type: "array", items: { type: "string" } },
                filter: { type: "string" },
                orderby: { type: "string" },
                expand: { type: "string" },
                maxTotal: {
                    type: "number",
                    description: "Maximum records to retrieve (default: 5000, max: 50000)",
                },
                formattedValues: {
                    type: "boolean",
                    description: "Include formatted label annotations.",
                },
            },
            required: ["entitySetName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
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
    formattedValues: z.boolean().optional(),
});
const FetchXmlInput = z.object({
    fetchXml: z.string().min(1).describe("Complete FetchXML query string"),
    entitySetName: z
        .string()
        .optional()
        .describe('OData entity set name (e.g., "accounts"). If omitted, extracted from the <entity name="..."> element in the FetchXML.'),
    formattedValues: z.boolean().optional(),
});
const RetrieveWithPagingInput = z.object({
    entitySetName: safeEntitySetName,
    select: z.array(z.string()).optional(),
    filter: z.string().optional(),
    orderby: z.string().optional(),
    expand: z.string().optional(),
    maxTotal: z.number().positive().max(50000).optional(),
    formattedValues: z.boolean().optional(),
});
export async function handleQueryTool(name, args, client, progress) {
    switch (name) {
        case "dataverse_query": {
            const params = QueryInput.parse(args);
            const queryOptions = {};
            if (params.select !== undefined)
                queryOptions.select = params.select;
            if (params.filter !== undefined)
                queryOptions.filter = params.filter;
            if (params.orderby !== undefined)
                queryOptions.orderby = params.orderby;
            if (params.top !== undefined)
                queryOptions.top = params.top;
            if (params.expand !== undefined)
                queryOptions.expand = params.expand;
            if (params.count !== undefined)
                queryOptions.count = params.count;
            if (params.apply !== undefined)
                queryOptions.apply = params.apply;
            if (params.formattedValues !== undefined)
                queryOptions.formattedValues = params.formattedValues;
            const result = await client.query(params.entitySetName, queryOptions);
            const records = Array.isArray(result?.value) ? result.value : [];
            const totalCount = result["@odata.count"];
            const countSuffix = totalCount !== undefined
                ? totalCount === records.length
                    ? " (showing all results)"
                    : ` (total in dataset: ${totalCount})`
                : "";
            const finalRecords = params.formattedValues
                ? mergeFormattedValues(records)
                : records;
            const displayResult = params.formattedValues && Array.isArray(result?.value)
                ? { ...result, value: finalRecords }
                : result;
            const queryWarnings = checkQueryGuardrails({
                ...(params.top !== undefined ? { top: params.top } : {}),
                ...(params.select !== undefined ? { select: params.select } : {}),
                ...(params.filter !== undefined ? { filter: params.filter } : {}),
                entitySetName: params.entitySetName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            return formatData(`${records.length} records returned from ${params.entitySetName}${countSuffix}`, displayResult, [
                "Use dataverse_execute_fetchxml for complex joins or aggregations",
                "Add $select to minimize payload",
            ], queryWarnings.length > 0 ? queryWarnings : undefined);
        }
        case "dataverse_execute_fetchxml": {
            const parsed = FetchXmlInput.parse(args);
            let entitySetName = parsed.entitySetName;
            const { fetchXml } = parsed;
            if (!entitySetName) {
                const match = fetchXml.match(/<entity\s+name=["']([^"']+)["']/i);
                if (!match) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    isError: true,
                                    error: "entitySetName is required when not present in FetchXML <entity> element",
                                }),
                            },
                        ],
                    };
                }
                const logicalName = match[1];
                entitySetName =
                    IRREGULAR_ENTITY_SET_NAMES[logicalName] ?? logicalName + "s";
            }
            const result = await client.executeFetchXml(entitySetName, fetchXml, parsed.formattedValues);
            const records = Array.isArray(result)
                ? result
                : Array.isArray(result?.value)
                    ? result.value
                    : [];
            const finalRecords = parsed.formattedValues
                ? mergeFormattedValues(records)
                : records;
            return formatData(`${finalRecords.length} records returned via FetchXML`, parsed.formattedValues && Array.isArray(result?.value)
                ? { ...result, value: finalRecords }
                : result, [
                "Use dataverse_query for simple OData reads",
                "Add page/count attributes for large result sets",
            ]);
        }
        case "dataverse_retrieve_multiple_with_paging": {
            const params = RetrieveWithPagingInput.parse(args);
            const pagingOptions = {};
            if (params.select !== undefined)
                pagingOptions.select = params.select;
            if (params.filter !== undefined)
                pagingOptions.filter = params.filter;
            if (params.orderby !== undefined)
                pagingOptions.orderby = params.orderby;
            if (params.expand !== undefined)
                pagingOptions.expand = params.expand;
            if (params.maxTotal !== undefined)
                pagingOptions.maxTotal = params.maxTotal;
            await progress?.report(0, 1);
            const result = await client.queryWithPaging(params.entitySetName, pagingOptions);
            const totalRetrieved = result?.totalRetrieved ??
                (Array.isArray(result?.value)
                    ? result.value.length
                    : 0);
            const pages = result?.pageCount ?? 1;
            await progress?.report(1, 1);
            const pagingRecords = Array.isArray(result?.records)
                ? result.records
                : [];
            const displayPagingResult = params.formattedValues && pagingRecords.length > 0
                ? { ...result, records: mergeFormattedValues(pagingRecords) }
                : result;
            const pagingWarnings = checkQueryGuardrails({
                ...(params.select !== undefined ? { select: params.select } : {}),
                ...(params.filter !== undefined ? { filter: params.filter } : {}),
                entitySetName: params.entitySetName,
            }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
            return formatData(`${totalRetrieved} records retrieved across ${pages} pages from ${params.entitySetName}`, displayPagingResult, [
                "Set maxTotal to limit retrieval",
                "Use $select to minimize payload size",
            ], pagingWarnings.length > 0 ? pagingWarnings : undefined);
        }
        default:
            throw new Error(`Unknown query tool: ${name}`);
    }
}
//# sourceMappingURL=query.tools.js.map