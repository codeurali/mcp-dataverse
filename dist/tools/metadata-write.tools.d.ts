import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const metadataWriteTools: {
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
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
}[];
export declare function handleMetadataWriteTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=metadata-write.tools.d.ts.map