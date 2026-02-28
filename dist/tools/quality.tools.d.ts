import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const qualityTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entityLogicalName: {
                type: string;
                description: string;
            };
            record: {
                type: string;
                description: string;
            };
            top: {
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
export declare function handleQualityTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=quality.tools.d.ts.map