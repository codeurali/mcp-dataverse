import { z } from "zod";
import { formatData } from "./output.utils.js";
export const searchTools = [
    {
        name: "dataverse_search",
        description: "Full-text Relevance Search across all configured Dataverse tables. Returns ranked results with entity name, record ID, score, and matched fields. Requires Relevance Search to be enabled in Dataverse admin settings. Use when you need to find records without knowing which table they belong to. WHEN TO USE: Cross-table free-text search when you don't know which table contains the data. BEST PRACTICES: Narrow with entities[] and $filter; use searchType=full for Lucene operators (AND, OR, NOT, wildcards). WORKFLOW: search_data.",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Full-text search string (supports Lucene syntax with searchType=full)",
                },
                entities: {
                    type: "array",
                    items: { type: "string" },
                    description: "Restrict to specific table logical names (omit to search all configured tables)",
                },
                top: {
                    type: "number",
                    description: "Max results (default 10, max 50)",
                },
                searchMode: {
                    type: "string",
                    enum: ["any", "all"],
                    description: "Match any or all terms (default: any)",
                },
                searchType: {
                    type: "string",
                    enum: ["simple", "full"],
                    description: "Search mode: simple (default) or full (enables Lucene syntax: AND, OR, NOT, wildcards, fuzzy)",
                },
                filter: {
                    type: "string",
                    description: 'OData $filter to apply on search results (e.g., "statecode eq 0")',
                },
                facets: {
                    type: "array",
                    items: { type: "string" },
                    description: 'Fields to return faceted counts for (e.g., ["@search.entityname","statecode"])',
                },
                orderby: {
                    type: "array",
                    items: { type: "string" },
                    description: 'OData $orderby for result sorting (e.g., ["@search.score desc","name asc"])',
                },
                select: {
                    type: "array",
                    items: { type: "string" },
                    description: "Fields to return in each result (default: all indexed fields)",
                },
            },
            required: ["query"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const SearchInput = z.object({
    query: z.string().min(1),
    entities: z.array(z.string()).optional(),
    top: z.number().int().positive().max(50).optional().default(10),
    searchMode: z.enum(["any", "all"]).optional().default("any"),
    searchType: z.enum(["simple", "full"]).optional(),
    filter: z.string().optional(),
    facets: z.array(z.string()).optional(),
    orderby: z.array(z.string()).optional(),
    select: z.array(z.string()).optional(),
});
export async function handleSearchTool(name, args, client) {
    switch (name) {
        case "dataverse_search": {
            const params = SearchInput.parse(args);
            const body = {
                search: params.query,
                top: params.top,
                searchMode: params.searchMode,
                returntotalrecordcount: true,
            };
            if (params.entities?.length) {
                body.entities = params.entities;
            }
            if (params.searchType)
                body.searchType = params.searchType;
            if (params.filter)
                body.filter = params.filter;
            if (params.facets?.length)
                body.facets = params.facets;
            if (params.orderby?.length)
                body.orderby = params.orderby;
            if (params.select?.length)
                body.select = params.select;
            let raw;
            try {
                raw = (await client.executeAction("../../search/v1.0/query", body));
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (message.includes("404") || message.includes("Not Found")) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    isError: true,
                                    error: "Relevance Search is not enabled for this Dataverse environment. " +
                                        "An administrator must enable it in the Power Platform admin center " +
                                        "under Environment → Settings → Product → Features → Dataverse Search.",
                                }),
                            },
                        ],
                    };
                }
                throw err;
            }
            const results = (raw["value"] ?? []).map((r) => ({
                entityName: r["entityname"] ?? "",
                objectId: r["objectid"] ?? "",
                score: r["score"] ?? 0,
                highlights: r["highlights"] ?? {},
                fields: r["attributes"] ?? {},
            }));
            const output = {
                totalRecordCount: raw["totalrecordcount"] ?? 0,
                results,
            };
            if (raw["facets"])
                output.facets = raw["facets"];
            return formatData(`${results.length} search results for '${params.query}'`, output, [
                "Use dataverse_get to retrieve full record details",
                "Narrow results with entities[] filter",
            ]);
        }
        default:
            throw new Error(`Unknown search tool: ${name}`);
    }
}
//# sourceMappingURL=search.tools.js.map