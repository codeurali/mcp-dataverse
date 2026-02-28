import { DataverseMetadataClient } from "./dataverse-client.metadata.js";
import { parseMultipartResponse } from "./dataverse-client.utils.js";
/**
 * Extends DataverseMetadataClient with batch execution support.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export class DataverseBatchClient extends DataverseMetadataClient {
    // ─── Batch ───────────────────────────────────────────────────────────────
    async batchExecute(requests, useChangeset = false) {
        const batchId = `batch_${Date.now()}`;
        let body = "";
        if (useChangeset) {
            const changesetId = `changeset_${Date.now() + 1}`;
            const getOps = requests.filter((r) => r.method === "GET");
            const mutatingOps = requests.filter((r) => r.method !== "GET");
            for (const req of getOps) {
                body += `--${batchId}\n`;
                body += `Content-Type: application/http\n`;
                body += `Content-Transfer-Encoding: binary\n\n`;
                body += `${req.method} ${this.http.baseURL}${req.url} HTTP/1.1\n`;
                body += `Accept: application/json\n\n\n`;
            }
            if (mutatingOps.length > 0) {
                body += `--${batchId}\n`;
                body += `Content-Type: multipart/mixed; boundary=${changesetId}\n\n`;
                let contentIdCounter = 1;
                for (const op of mutatingOps) {
                    body += `--${changesetId}\n`;
                    body += `Content-Type: application/http\n`;
                    body += `Content-Transfer-Encoding: binary\n`;
                    body += `Content-ID: ${op.contentId ?? contentIdCounter++}\n\n`;
                    body += `${op.method} ${this.http.baseURL}${op.url} HTTP/1.1\n`;
                    body += `Content-Type: application/json\n\n`;
                    if (op.body)
                        body += JSON.stringify(op.body);
                    body += "\n\n";
                }
                body += `--${changesetId}--\n`;
            }
        }
        else {
            requests.forEach((req) => {
                body += `--${batchId}\n`;
                body += `Content-Type: application/http\n`;
                body += `Content-Transfer-Encoding: binary\n\n`;
                body += `${req.method} ${this.http.baseURL}${req.url} HTTP/1.1\n`;
                body += `Content-Type: application/json\n\n`;
                if (req.body)
                    body += JSON.stringify(req.body);
                body += "\n";
            });
        }
        body += `--${batchId}--`;
        const response = await this.requestWithRetry(() => this.http.post("$batch", body, {
            headers: { "Content-Type": `multipart/mixed;boundary=${batchId}` },
            responseType: "text",
        }));
        try {
            const contentType = response.headers["content-type"] ?? "";
            const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;"\s]+))/);
            const responseBoundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
            if (!responseBoundary) {
                process.stderr.write("[batchExecute] No multipart boundary in response Content-Type; returning raw data.\n");
                return [response.data];
            }
            return parseMultipartResponse(response.data, responseBoundary);
        }
        catch (err) {
            process.stderr.write(`[batchExecute] Failed to parse multipart response; returning raw data. ${String(err)}\n`);
            return [response.data];
        }
    }
}
//# sourceMappingURL=dataverse-client.batch.js.map