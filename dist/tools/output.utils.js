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
export function formatData(summary, data, suggestions, warnings) {
    return formatToolOutput({ summary, data, suggestions, warnings });
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
/**
 * Returns a structured "cannot proceed — environment prerequisite missing"
 * response. The tool should RETURN this instead of throwing so that the
 * agent receives a parseable JSON payload it can relay to the user.
 */
export function formatPrerequisiteError(prerequisite) {
    return formatToolOutput({
        summary: `Blocked: ${prerequisite.cannotProceedBecause}`,
        data: null,
        prerequisite,
    });
}
// ── Formatted Value Annotation Merge ─────────────────────────────────────────
const FORMATTED_VALUE_SUFFIX = "@OData.Community.Display.V1.FormattedValue";
/**
 * Merges OData formatted-value annotations into each record.
 * Transforms `{ statuscode: 1, "statuscode@OData.Community.Display.V1.FormattedValue": "Active" }`
 * into `{ statuscode: { value: 1, label: "Active" } }`.
 */
export function mergeFormattedValues(records) {
    return records.map((record) => {
        if (typeof record !== "object" || record === null)
            return record;
        const r = record;
        const annotMap = {};
        for (const key of Object.keys(r)) {
            if (key.endsWith(FORMATTED_VALUE_SUFFIX)) {
                const baseKey = key.slice(0, -FORMATTED_VALUE_SUFFIX.length);
                annotMap[baseKey] = r[key];
            }
        }
        if (Object.keys(annotMap).length === 0)
            return record;
        const merged = {};
        for (const key of Object.keys(r)) {
            if (key.endsWith(FORMATTED_VALUE_SUFFIX))
                continue;
            if (Object.prototype.hasOwnProperty.call(annotMap, key)) {
                merged[key] = { value: r[key], label: annotMap[key] };
            }
            else {
                merged[key] = r[key];
            }
        }
        return merged;
    });
}
//# sourceMappingURL=output.utils.js.map