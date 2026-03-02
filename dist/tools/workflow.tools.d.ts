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
            category?: never;
            nameContains?: never;
            top?: never;
            workflowId?: never;
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
            category?: never;
            nameContains?: never;
            top?: never;
            workflowId?: never;
        };
        required: string[];
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
            category: {
                type: string;
                description: string;
            };
            nameContains: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                description: string;
            };
            name?: never;
            workflowId?: never;
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
            workflowId: {
                type: string;
                description: string;
            };
            name?: never;
            category?: never;
            nameContains?: never;
            top?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
    };
})[];
export declare function handleWorkflowTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<ToolResult>;
export { WORKFLOWS };
//# sourceMappingURL=workflow.tools.d.ts.map