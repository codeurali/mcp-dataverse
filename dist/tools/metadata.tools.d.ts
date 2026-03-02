import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
            confirm?: never;
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
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
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
            tableName?: never;
            entityLogicalName?: never;
            attributeLogicalName?: never;
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
            confirm?: never;
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
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
            hasNotes?: never;
            changeTrackingEnabled?: never;
            isAuditEnabled?: never;
            autoPublish?: never;
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
            entityLogicalName: {
                type: string;
                description: string;
            };
            hasNotes: {
                type: string;
                description: string;
            };
            changeTrackingEnabled: {
                type: string;
                description: string;
            };
            isAuditEnabled: {
                type: string;
                description: string;
            };
            autoPublish: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            includeSystemTables?: never;
            logicalName?: never;
            includeAttributes?: never;
            relationshipType?: never;
            name?: never;
            tableName?: never;
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
})[];
export declare function handleMetadataTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=metadata.tools.d.ts.map