import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const userTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            userId: {
                type: string;
                description: string;
            };
            search?: never;
            businessUnitId?: never;
            includeDisabled?: never;
            includeApplicationUsers?: never;
            top?: never;
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
            search: {
                type: string;
                description: string;
            };
            businessUnitId: {
                type: string;
                description: string;
            };
            includeDisabled: {
                type: string;
                description: string;
            };
            includeApplicationUsers: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            userId?: never;
        };
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
})[];
export declare function handleUserTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=users.tools.d.ts.map