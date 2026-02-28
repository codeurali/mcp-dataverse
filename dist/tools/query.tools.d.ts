import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import type { ProgressReporter } from "./progress.js";
export declare const queryTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entitySetName: {
                type: string;
                description: string;
            };
            select: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            filter: {
                type: string;
                description: string;
            };
            orderby: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            expand: {
                type: string;
                description: string;
            };
            count: {
                type: string;
                description: string;
            };
            apply: {
                type: string;
                description: string;
            };
            fetchXml?: never;
            maxTotal?: never;
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
            entitySetName: {
                type: string;
                description: string;
            };
            fetchXml: {
                type: string;
                description: string;
            };
            select?: never;
            filter?: never;
            orderby?: never;
            top?: never;
            expand?: never;
            count?: never;
            apply?: never;
            maxTotal?: never;
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
            entitySetName: {
                type: string;
                description: string;
            };
            select: {
                type: string;
                items: {
                    type: string;
                };
                description?: never;
            };
            filter: {
                type: string;
                description?: never;
            };
            orderby: {
                type: string;
                description?: never;
            };
            expand: {
                type: string;
                description?: never;
            };
            maxTotal: {
                type: string;
                description: string;
            };
            top?: never;
            count?: never;
            apply?: never;
            fetchXml?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
})[];
export declare function handleQueryTool(name: string, args: unknown, client: DataverseAdvancedClient, progress?: ProgressReporter): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=query.tools.d.ts.map