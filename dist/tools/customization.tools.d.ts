import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const customizationTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            top: {
                type: string;
                description: string;
            };
            nameFilter: {
                type: string;
                description: string;
            };
            activeOnly?: never;
            entityLogicalName?: never;
            workflowId?: never;
            activate?: never;
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
            top: {
                type: string;
                description: string;
            };
            activeOnly: {
                type: string;
                description: string;
            };
            entityLogicalName: {
                type: string;
                description: string;
            };
            nameFilter?: never;
            workflowId?: never;
            activate?: never;
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
            workflowId: {
                type: string;
                description: string;
            };
            activate: {
                type: string;
                description: string;
            };
            top?: never;
            nameFilter?: never;
            activeOnly?: never;
            entityLogicalName?: never;
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
export declare function handleCustomizationTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=customization.tools.d.ts.map