import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const teamTools: ({
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
            teamId?: never;
            roleId?: never;
            confirm?: never;
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
            teamId: {
                type: string;
                description: string;
            };
            roleId: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            top?: never;
            teamType?: never;
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
export declare function handleTeamTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=teams.tools.d.ts.map