import type { ToolResult } from "./tool-registry.js";
interface StructuredOutput {
    summary: string;
    data: unknown;
    suggestions?: string[] | undefined;
}
/**
 * Wraps a structured output into the MCP tool result format.
 * Every tool handler should use this for consistent, LLM-friendly responses.
 */
export declare function formatToolOutput(output: StructuredOutput): ToolResult;
/**
 * Convenience: wrap raw data with a summary line and optional suggestions.
 */
export declare function formatData(summary: string, data: unknown, suggestions?: string[]): ToolResult;
/**
 * Format a count-based result (list of items).
 */
export declare function formatList(label: string, items: unknown[], suggestions?: string[]): ToolResult;
export {};
//# sourceMappingURL=output.utils.d.ts.map