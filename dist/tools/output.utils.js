/**
 * Wraps a structured output into the MCP tool result format.
 * Every tool handler should use this for consistent, LLM-friendly responses.
 */
export function formatToolOutput(output) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(output, null, 2),
            },
        ],
    };
}
/**
 * Convenience: wrap raw data with a summary line and optional suggestions.
 */
export function formatData(summary, data, suggestions) {
    return formatToolOutput({ summary, data, suggestions });
}
/**
 * Format a count-based result (list of items).
 */
export function formatList(label, items, suggestions) {
    return formatToolOutput({
        summary: `${items.length} ${label} found.`,
        data: items,
        suggestions,
    });
}
//# sourceMappingURL=output.utils.js.map