import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const searchTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            entities: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            searchMode: {
                type: string;
                enum: string[];
                description: string;
            };
            searchType: {
                type: string;
                enum: string[];
                description: string;
            };
            filter: {
                type: string;
                description: string;
            };
            facets: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            orderby: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            select: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
}[];
export declare function handleSearchTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=search.tools.d.ts.map