import type { DataverseMetadataClient } from "../dataverse/dataverse-client.metadata.js";
export declare const metadataTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            includeSystemTables: {
                type: string;
                description: string;
            };
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            logicalName: {
                type: string;
                description: string;
            };
            includeAttributes: {
                type: string;
                description: string;
            };
            includeSystemTables?: never;
            relationshipType?: never;
            name?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            logicalName: {
                type: string;
                description: string;
            };
            relationshipType: {
                type: string;
                enum: string[];
                description: string;
            };
            includeSystemTables?: never;
            includeAttributes?: never;
            name?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            name: {
                type: string;
                description: string;
            };
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
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
            entityLogicalName: {
                type: string;
                description: string;
            };
            attributeLogicalName: {
                type: string;
                description: string;
            };
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
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
})[];
export declare function handleMetadataTool(name: string, args: unknown, client: DataverseMetadataClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=metadata.tools.d.ts.map