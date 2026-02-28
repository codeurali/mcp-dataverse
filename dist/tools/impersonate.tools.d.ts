import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import type { ProgressReporter } from "./progress.js";
type DispatchFn = (toolName: string, args: unknown, client: DataverseAdvancedClient, progress?: ProgressReporter) => Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
export declare const impersonateTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            callerId: {
                type: string;
                description: string;
            };
            toolName: {
                type: string;
                description: string;
            };
            toolArgs: {
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
export declare function handleImpersonateTool(name: string, args: unknown, client: DataverseAdvancedClient, dispatch: DispatchFn): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
export {};
//# sourceMappingURL=impersonate.tools.d.ts.map