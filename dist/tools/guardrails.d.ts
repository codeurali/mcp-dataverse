export interface GuardrailWarning {
    code: string;
    message: string;
    severity: "info" | "warning" | "error";
}
/**
 * Check query parameters and return warnings about potential issues.
 */
export declare function checkQueryGuardrails(params: {
    top?: number;
    select?: string[];
    filter?: string;
    entitySetName?: string;
}): GuardrailWarning[];
/**
 * Check write operation parameters and return warnings.
 */
export declare function checkWriteGuardrails(params: {
    toolName: string;
    entitySetName?: string;
}): GuardrailWarning[];
//# sourceMappingURL=guardrails.d.ts.map