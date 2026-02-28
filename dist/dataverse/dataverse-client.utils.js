// ─── Multipart Response Parsing ──────────────────────────────────────────
/**
 * Returns the index just after the first double-newline (\r\n\r\n or \n\n).
 * Returns -1 if not found.
 */
function findDoubleNewline(text) {
    const crlfIdx = text.indexOf("\r\n\r\n");
    const lfIdx = text.indexOf("\n\n");
    if (crlfIdx !== -1 && (lfIdx === -1 || crlfIdx <= lfIdx))
        return crlfIdx + 4;
    if (lfIdx !== -1)
        return lfIdx + 2;
    return -1;
}
/**
 * Parse a Dataverse batch multipart/mixed response body.
 * Each MIME part wraps an inner HTTP response; this function extracts the JSON
 * body and status from each sub-request and returns an array of results.
 * Successful responses (2xx) are returned as parsed objects; error responses
 * are wrapped in `{ error, status }`.
 */
export function parseMultipartResponse(body, boundary) {
    const results = [];
    const parts = body.split(`--${boundary}`);
    for (const part of parts) {
        const trimmed = part.trim();
        // Skip preamble (empty) and epilogue (--)
        if (!trimmed || trimmed === "--")
            continue;
        // Part layout: MIME-headers  \r\n\r\n  inner-HTTP-response
        const mimeEnd = findDoubleNewline(part);
        if (mimeEnd === -1)
            continue;
        const innerHttp = part.slice(mimeEnd);
        // Inner HTTP layout: status-line  \r\n  response-headers  \r\n\r\n  body
        const httpHeadersEnd = findDoubleNewline(innerHttp);
        if (httpHeadersEnd === -1)
            continue;
        const statusLine = innerHttp.trimStart().split(/\r?\n/)[0] ?? "";
        const statusMatch = statusLine.match(/^HTTP\/\d+\.\d+\s+(\d{3})/);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
        const isSuccess = statusCode >= 200 && statusCode < 300;
        const jsonBody = innerHttp.slice(httpHeadersEnd).trim();
        if (!jsonBody) {
            results.push(isSuccess ? null : { error: "Empty response body", status: statusCode });
            continue;
        }
        try {
            const parsed = JSON.parse(jsonBody);
            results.push(isSuccess ? parsed : { error: parsed, status: statusCode });
        }
        catch {
            results.push({ error: jsonBody, status: statusCode });
        }
    }
    return results;
}
/**
 * Escape single quotes in OData string literals by doubling them.
 * Prevents OData injection in URL path segments like LogicalName='...'.
 */
export function esc(value) {
    return value.replace(/'/g, "''");
}
//# sourceMappingURL=dataverse-client.utils.js.map