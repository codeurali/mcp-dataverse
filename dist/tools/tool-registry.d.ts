import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import type { ProgressReporter } from "./progress.js";
export interface ToolAnnotations {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
}
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: ToolAnnotations;
}
export type ToolResult = {
    content: Array<{
        type: "text";
        text: string;
    }>;
};
export type ToolHandler = (name: string, args: unknown, client: DataverseAdvancedClient, progress?: ProgressReporter) => Promise<ToolResult>;
export interface ToolModule {
    tools: ToolDefinition[];
    handler: ToolHandler;
}
export declare class ToolRegistry {
    private readonly map;
    register(mod: ToolModule): void;
    getHandler(name: string): ToolHandler | undefined;
    getAllDefinitions(): ToolDefinition[];
    has(name: string): boolean;
    get size(): number;
}
export declare function createToolRegistry(modules: ToolModule[]): ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map