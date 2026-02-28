import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const auditTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            recordId: {
                type: string;
                description: string;
            };
            entityLogicalName: {
                type: string;
                description: string;
            };
            userId: {
                type: string;
                description: string;
            };
            fromDate: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            operations: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: never[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
}[];
export declare function handleAuditTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=audit.tools.d.ts.map