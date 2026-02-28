import { z } from "zod";
import { formatData } from "./output.utils.js";
export const batchTools = [
    {
        name: "dataverse_batch_execute",
        description: "Executes multiple Dataverse operations in a single HTTP $batch request to reduce network round-trips and improve throughput. Accepts up to 1000 individual GET, POST, PATCH, or DELETE requests. Use for bulk creates, updates, or deletes that need to be grouped for performance. Set useChangeset=true to wrap all mutating operations (POST/PATCH/DELETE) in an atomic changeset — a failure rolls back ALL changeset operations. Individual per-operation results (status, body) are returned as an array in the same order as the input requests. WHEN TO USE: Bulk creates, updates, or deletes (up to 1000 ops) needing a single HTTP round-trip. BEST PRACTICES: Use useChangeset=true for atomic all-or-nothing mutations; batch GETs for parallel reads. WORKFLOW: bulk_operations.",
        inputSchema: {
            type: "object",
            properties: {
                requests: {
                    type: "array",
                    description: "Array of batch requests to execute",
                    items: {
                        type: "object",
                        properties: {
                            method: {
                                type: "string",
                                enum: ["GET", "POST", "PATCH", "DELETE"],
                                description: "HTTP method",
                            },
                            url: {
                                type: "string",
                                description: 'Relative URL (e.g., "accounts(guid)" or "contacts")',
                            },
                            body: {
                                type: "object",
                                description: "Request body for POST/PATCH operations",
                            },
                        },
                        required: ["method", "url"],
                    },
                },
                useChangeset: {
                    type: "boolean",
                    description: "Wrap mutating operations (POST/PATCH/DELETE) in an atomic changeset. A failure rolls back ALL operations in the changeset. Defaults to false.",
                },
            },
            required: ["requests"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
const BatchRequestItemSchema = z.object({
    method: z.enum(["GET", "POST", "PATCH", "DELETE"]),
    url: z
        .string()
        .min(1)
        .refine((v) => !/[\r\n]/.test(v), {
        message: "Batch URL must not contain CR or LF characters",
    })
        .refine((v) => !v.startsWith("http"), {
        message: "Batch URL must be a relative path, not an absolute URL",
    })
        .refine((v) => !/(\.\.[\/\\])|(^\.\.$)/.test(v), {
        message: "Batch URL must not contain path traversal sequences",
    }),
    body: z.record(z.unknown()).optional(),
});
const BatchExecuteInput = z.object({
    requests: z.array(BatchRequestItemSchema).min(1).max(1000),
    useChangeset: z
        .boolean()
        .default(false)
        .describe("Wrap mutating operations (POST/PATCH/DELETE) in an atomic changeset. A failure rolls back ALL operations in the changeset."),
});
export async function handleBatchTool(name, args, client, progress) {
    if (name === "dataverse_batch_execute") {
        const { requests, useChangeset } = BatchExecuteInput.parse(args);
        const batchRequests = requests.map((r) => ({
            method: r.method,
            url: r.url,
            body: r.body,
        }));
        await progress?.report(0, requests.length);
        const results = await client.batchExecute(batchRequests, useChangeset);
        await progress?.report(requests.length, requests.length);
        const successCount = results.filter((r) => r["status"] >= 200 && r["status"] < 300).length;
        return formatData(`Batch executed: ${successCount}/${results.length} operations succeeded`, { results, count: results.length }, [
            "Use batch for bulk create/update operations to reduce HTTP round-trips",
        ]);
    }
    throw new Error(`Unknown batch tool: ${name}`);
}
//# sourceMappingURL=batch.tools.js.map