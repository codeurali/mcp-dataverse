import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const actionTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            actionName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                additionalProperties?: never;
            };
            functionName?: never;
            entitySetName?: never;
            id?: never;
            componentType?: never;
            objectId?: never;
            tableName?: never;
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
            functionName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                additionalProperties?: never;
            };
            actionName?: never;
            entitySetName?: never;
            id?: never;
            componentType?: never;
            objectId?: never;
            tableName?: never;
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
                description?: never;
            };
            id: {
                type: string;
                description: string;
            };
            actionName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                additionalProperties?: never;
            };
            functionName?: never;
            componentType?: never;
            objectId?: never;
            tableName?: never;
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
            componentType: {
                type: string;
                description: string;
                items?: never;
            };
            objectId: {
                type: string;
                description: string;
            };
            actionName?: never;
            parameters?: never;
            functionName?: never;
            entitySetName?: never;
            id?: never;
            tableName?: never;
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
            id: {
                type: string;
                description: string;
            };
            functionName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                additionalProperties: {
                    type: string;
                };
            };
            actionName?: never;
            componentType?: never;
            objectId?: never;
            tableName?: never;
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
            tableName: {
                type: string;
                description: string;
            };
            componentType: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            actionName?: never;
            parameters?: never;
            functionName?: never;
            entitySetName?: never;
            id?: never;
            objectId?: never;
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
export declare function handleActionTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=actions.tools.d.ts.map