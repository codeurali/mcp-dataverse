import type { DataverseClient } from "../dataverse/dataverse-client.js";
export declare const crudTools: ({
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
            select: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            data?: never;
            etag?: never;
            confirm?: never;
            alternateKey?: never;
            alternateKeyValue?: never;
            alternateKeys?: never;
            mode?: never;
            ownerType?: never;
            ownerId?: never;
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
            data: {
                type: string;
                description: string;
            };
            id?: never;
            select?: never;
            etag?: never;
            confirm?: never;
            alternateKey?: never;
            alternateKeyValue?: never;
            alternateKeys?: never;
            mode?: never;
            ownerType?: never;
            ownerId?: never;
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
            data: {
                type: string;
                description: string;
            };
            etag: {
                type: string;
                description: string;
            };
            select?: never;
            confirm?: never;
            alternateKey?: never;
            alternateKeyValue?: never;
            alternateKeys?: never;
            mode?: never;
            ownerType?: never;
            ownerId?: never;
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
            confirm: {
                type: string;
                description: string;
            };
            select?: never;
            data?: never;
            etag?: never;
            alternateKey?: never;
            alternateKeyValue?: never;
            alternateKeys?: never;
            mode?: never;
            ownerType?: never;
            ownerId?: never;
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
            alternateKey: {
                type: string;
                description: string;
            };
            alternateKeyValue: {
                type: string;
                description: string;
            };
            alternateKeys: {
                type: string;
                description: string;
            };
            data: {
                type: string;
                description: string;
            };
            mode: {
                type: string;
                enum: string[];
                description: string;
            };
            id?: never;
            select?: never;
            etag?: never;
            confirm?: never;
            ownerType?: never;
            ownerId?: never;
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
            ownerType: {
                type: string;
                enum: string[];
                description: string;
            };
            ownerId: {
                type: string;
                description: string;
            };
            select?: never;
            data?: never;
            etag?: never;
            confirm?: never;
            alternateKey?: never;
            alternateKeyValue?: never;
            alternateKeys?: never;
            mode?: never;
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
export declare function handleCrudTool(name: string, args: unknown, client: DataverseClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=crud.tools.d.ts.map