import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const solutionTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            includeManaged: {
                type: string;
                description: string;
            };
            nameFilter: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            solutionName?: never;
            componentType?: never;
            components?: never;
        };
        required: never[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            solutionName: {
                type: string;
                description: string;
            };
            componentType: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            includeManaged?: never;
            nameFilter?: never;
            components?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            components: {
                type: string;
                description: string;
                properties: {
                    entities: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    webResources: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    optionSets: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
            includeManaged?: never;
            nameFilter?: never;
            top?: never;
            solutionName?: never;
            componentType?: never;
        };
        required: never[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
})[];
export declare function handleSolutionTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=solution.tools.d.ts.map