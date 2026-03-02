import type { ToolResult } from "./tool-registry.js";
/**
 * Describes a missing environment-level prerequisite that prevents a tool from
 * operating. Surface this to the agent so it can explain the required admin
 * action to the user in a structured, parseable way.
 */
export interface EnvironmentPrerequisite {
    /** Broad category of the limitation. */
    type: "feature_disabled" | "permission_required" | "schema_missing";
    /** Short display name of the missing feature/capability. */
    feature: string;
    /** One-sentence explanation of why the tool cannot proceed. */
    cannotProceedBecause: string;
    /** Primary portal where the fix must be applied. */
    adminPortal: "Power Platform Admin Center" | "Power Apps Maker Portal" | "Azure AD" | "N/A";
    /** Ordered navigation steps for the administrator. */
    steps: string[];
    /**
     * Name of an MCP tool that can apply the fix programmatically,
     * so the agent can offer to do it automatically instead of
     * sending the user to the portal.
     */
    fixableViaToolName?: string;
}
interface StructuredOutput {
    summary: string;
    data: unknown;
    suggestions?: string[] | undefined;
    warnings?: string[] | undefined;
    /**
     * Present when the tool is blocked by a missing environment-level
     * prerequisite. The agent should read this field and present the
     * steps to the user rather than treating the response as a data result.
     */
    prerequisite?: EnvironmentPrerequisite | undefined;
}
/**
 * Wraps a structured output into the MCP tool result format.
 * Every tool handler should use this for consistent, LLM-friendly responses.
 */
export declare function formatToolOutput(output: StructuredOutput): ToolResult;
/**
 * Convenience: wrap raw data with a summary line and optional suggestions.
 */
export declare function formatData(summary: string, data: unknown, suggestions?: string[], warnings?: string[]): ToolResult;
/**
 * Format a count-based result (list of items).
 */
export declare function formatList(label: string, items: unknown[], suggestions?: string[]): ToolResult;
/**
 * Returns a structured "cannot proceed — environment prerequisite missing"
 * response. The tool should RETURN this instead of throwing so that the
 * agent receives a parseable JSON payload it can relay to the user.
 */
export declare function formatPrerequisiteError(prerequisite: EnvironmentPrerequisite): ToolResult;
/**
 * Merges OData formatted-value annotations into each record.
 * Transforms `{ statuscode: 1, "statuscode@OData.Community.Display.V1.FormattedValue": "Active" }`
 * into `{ statuscode: { value: 1, label: "Active" } }`.
 */
export declare function mergeFormattedValues<T>(records: T[]): T[];
export {};
//# sourceMappingURL=output.utils.d.ts.map