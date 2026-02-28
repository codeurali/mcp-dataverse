import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const teamTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            top: {
                type: string;
                description: string;
            };
            teamType: {
                type: string;
                enum: number[];
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
export declare function handleTeamTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=teams.tools.d.ts.map