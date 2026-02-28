import type { DataverseBatchClient } from "../dataverse/dataverse-client.batch.js";
import type { ProgressReporter } from "./progress.js";
export declare const batchTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            requests: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        method: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        url: {
                            type: string;
                            description: string;
                        };
                        body: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            useChangeset: {
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
export declare function handleBatchTool(name: string, args: unknown, client: DataverseBatchClient, progress?: ProgressReporter): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=batch.tools.d.ts.map