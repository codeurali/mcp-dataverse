import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const orgTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            top: {
                type: string;
                description: string;
            };
            includeDisabled: {
                type: string;
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
export declare function handleOrgTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=org.tools.d.ts.map