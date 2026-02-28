import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import type { ToolResult } from "./tool-registry.js";
interface WorkflowStep {
    order: number;
    tool: string;
    description: string;
    required: boolean;
    tips?: string;
}
interface Workflow {
    name: string;
    description: string;
    steps: WorkflowStep[];
    tags: string[];
}
declare const WORKFLOWS: ReadonlyMap<string, Workflow>;
export declare const workflowTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name?: never;
        };
        required: never[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
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
    };
})[];
export declare function handleWorkflowTool(name: string, args: unknown, _client: DataverseAdvancedClient): Promise<ToolResult>;
export { WORKFLOWS };
//# sourceMappingURL=workflow.tools.d.ts.map