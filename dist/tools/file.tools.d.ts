import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const fileTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entitySetName: {
                type: string;
                description: string;
            };
            recordId: {
                type: string;
                description: string;
            };
            columnName: {
                type: string;
                description: string;
            };
            fileContent: {
                type: string;
                description: string;
            };
            fileName: {
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
            recordId: {
                type: string;
                description: string;
            };
            columnName: {
                type: string;
                description: string;
            };
            fileContent?: never;
            fileName?: never;
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
export declare function handleFileTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=file.tools.d.ts.map