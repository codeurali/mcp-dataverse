import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const traceTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            top: {
                type: string;
                description: string;
            };
            pluginTypeFilter: {
                type: string;
                description: string;
            };
            messageFilter: {
                type: string;
                description: string;
            };
            entityFilter: {
                type: string;
                description: string;
            };
            exceptionsOnly: {
                type: string;
                description: string;
            };
            failedOnly?: never;
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
            top: {
                type: string;
                description: string;
            };
            failedOnly: {
                type: string;
                description: string;
            };
            entityFilter: {
                type: string;
                description: string;
            };
            pluginTypeFilter?: never;
            messageFilter?: never;
            exceptionsOnly?: never;
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
export declare function handleTraceTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=trace.tools.d.ts.map