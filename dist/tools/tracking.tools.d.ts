import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const trackingTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entitySetName: {
                type: string;
                description: string;
            };
            deltaToken: {
                anyOf: {
                    type: string;
                }[];
                description: string;
            };
            select: {
                type: string;
                items: {
                    type: string;
                };
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
export declare function handleTrackingTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=tracking.tools.d.ts.map