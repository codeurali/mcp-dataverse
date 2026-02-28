// ── Guardrails — pre-flight checks for tool calls ──────────────────────────────
const DESTRUCTIVE_TOOLS = new Set([
    "dataverse_delete",
    "dataverse_delete_file",
]);
/**
 * Check query parameters and return warnings about potential issues.
 */
export function checkQueryGuardrails(params) {
    const warnings = [];
    if (params.top !== undefined && params.top > 5000) {
        warnings.push({
            code: "LARGE_RESULT_SET",
            message: `Large result set requested (top=${params.top}). Consider reducing $top or using paging.`,
            severity: "warning",
        });
    }
    if (!params.select || params.select.length === 0) {
        warnings.push({
            code: "NO_SELECT",
            message: "No $select specified — all columns will be returned. Specify columns to reduce payload size.",
            severity: "warning",
        });
    }
    if (!params.filter) {
        warnings.push({
            code: "NO_FILTER",
            message: "No filter — consider adding one to reduce results and improve performance.",
            severity: "info",
        });
    }
    return warnings;
}
/**
 * Check write operation parameters and return warnings.
 */
export function checkWriteGuardrails(params) {
    const warnings = [];
    if (DESTRUCTIVE_TOOLS.has(params.toolName)) {
        warnings.push({
            code: "DESTRUCTIVE_OP",
            message: "Destructive operation — confirm with user before proceeding. This action cannot be undone.",
            severity: "warning",
        });
    }
    if (params.toolName === "dataverse_batch_execute") {
        warnings.push({
            code: "BATCH_OP",
            message: "Batch operations may modify multiple records in a single transaction.",
            severity: "info",
        });
    }
    return warnings;
}
//# sourceMappingURL=guardrails.js.map