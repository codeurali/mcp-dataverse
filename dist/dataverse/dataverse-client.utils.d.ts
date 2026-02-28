/**
 * Parse a Dataverse batch multipart/mixed response body.
 * Each MIME part wraps an inner HTTP response; this function extracts the JSON
 * body and status from each sub-request and returns an array of results.
 * Successful responses (2xx) are returned as parsed objects; error responses
 * are wrapped in `{ error, status }`.
 */
export declare function parseMultipartResponse(body: string, boundary: string): unknown[];
/**
 * Escape single quotes in OData string literals by doubling them.
 * Prevents OData injection in URL path segments like LogicalName='...'.
 */
export declare function esc(value: string): string;
//# sourceMappingURL=dataverse-client.utils.d.ts.map