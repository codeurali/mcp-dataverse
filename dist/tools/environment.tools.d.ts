import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const environmentTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            schemaName: {
                type: string;
                description: string;
            };
            value?: never;
            displayName?: never;
            type?: never;
            description?: never;
            defaultValue?: never;
            confirm?: never;
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
        type: string;
        properties: {
            schemaName: {
                type: string;
                description: string;
            };
            value: {
                type: string;
                description: string;
            };
            displayName?: never;
            type?: never;
            description?: never;
            defaultValue?: never;
            confirm?: never;
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
            schemaName: {
                type: string;
                description: string;
            };
            displayName: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            value: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            defaultValue: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
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
})[];
export declare function handleEnvironmentTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=environment.tools.d.ts.map