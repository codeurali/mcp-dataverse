import type { DataverseClient } from "../dataverse/dataverse-client.js";
export declare const relationTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entitySetName: {
                type: string;
            };
            id: {
                type: string;
                description: string;
            };
            relationshipName: {
                type: string;
                description: string;
            };
            relatedEntitySetName: {
                type: string;
                description: string;
            };
            relatedId: {
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
            };
            id: {
                type: string;
                description?: never;
            };
            relationshipName: {
                type: string;
                description?: never;
            };
            relatedId: {
                type: string;
                description: string;
            };
            relatedEntitySetName: {
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
export declare function handleRelationTool(name: string, args: unknown, client: DataverseClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=relations.tools.d.ts.map