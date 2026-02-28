import { z } from "zod";
import { formatData } from "./output.utils.js";
const SAFE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PATH_TRAVERSAL_REGEX = /\.\.|[/\\]/;
const UploadFileColumnInput = z.object({
    entitySetName: z
        .string()
        .min(1)
        .refine((v) => !PATH_TRAVERSAL_REGEX.test(v), {
        message: "entitySetName must not contain path traversal characters",
    }),
    recordId: z.string().uuid(),
    columnName: z
        .string()
        .min(1)
        .refine((v) => SAFE_NAME_REGEX.test(v), {
        message: "columnName must be alphanumeric/underscore only",
    }),
    fileContent: z.string().min(1).describe("Base64-encoded file content"),
    fileName: z.string().min(1),
});
const DownloadFileColumnInput = z.object({
    entitySetName: z
        .string()
        .min(1)
        .refine((v) => !PATH_TRAVERSAL_REGEX.test(v), {
        message: "entitySetName must not contain path traversal characters",
    }),
    recordId: z.string().uuid(),
    columnName: z
        .string()
        .min(1)
        .refine((v) => SAFE_NAME_REGEX.test(v), {
        message: "columnName must be alphanumeric/underscore only",
    }),
});
export const fileTools = [
    {
        name: "dataverse_upload_file_column",
        description: "Uploads a file to a Dataverse file column. Provide the entity set name, record GUID, column name, base64-encoded file content, and file name. The file is stored in the specified file-type column on the record. WHEN TO USE: Uploading a file to a file-type column on a Dataverse record. BEST PRACTICES: Base64-encode the file content; verify the column is a file-type column via dataverse_get_table_metadata. WORKFLOW: file_operations.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name (e.g., "accounts")',
                },
                recordId: {
                    type: "string",
                    description: "Record GUID",
                },
                columnName: {
                    type: "string",
                    description: "File column logical name",
                },
                fileContent: {
                    type: "string",
                    description: "Base64-encoded file content",
                },
                fileName: {
                    type: "string",
                    description: 'File name including extension (e.g., "report.pdf")',
                },
            },
            required: [
                "entitySetName",
                "recordId",
                "columnName",
                "fileContent",
                "fileName",
            ],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_download_file_column",
        description: "Downloads a file from a Dataverse file column. Returns the file content as a base64-encoded string along with the file name and size. WHEN TO USE: Downloading a file stored in a file-type column on a Dataverse record. BEST PRACTICES: The response is base64-encoded; decode before saving or processing. WORKFLOW: file_operations.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: {
                    type: "string",
                    description: 'OData entity set name (e.g., "accounts")',
                },
                recordId: {
                    type: "string",
                    description: "Record GUID",
                },
                columnName: {
                    type: "string",
                    description: "File column logical name",
                },
            },
            required: ["entitySetName", "recordId", "columnName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
export async function handleFileTool(name, args, client) {
    // Access the protected HttpClient for raw binary requests (file column API).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const http = client.http;
    switch (name) {
        case "dataverse_upload_file_column": {
            const { entitySetName, recordId, columnName, fileContent, fileName } = UploadFileColumnInput.parse(args);
            const buffer = Buffer.from(fileContent, "base64");
            const url = `${entitySetName}(${recordId})/${columnName}`;
            await http.patch(url, buffer, {
                headers: {
                    "Content-Type": "application/octet-stream",
                    "x-ms-file-name": fileName,
                },
            });
            return formatData(`Uploaded file to ${columnName} on ${entitySetName}(${recordId})`, {
                success: true,
                entitySetName,
                recordId,
                columnName,
                fileName,
                sizeBytes: buffer.length,
            }, ["Use dataverse_download_file_column to retrieve the file"]);
        }
        case "dataverse_download_file_column": {
            const { entitySetName, recordId, columnName } = DownloadFileColumnInput.parse(args);
            const url = `${entitySetName}(${recordId})/${columnName}/$value`;
            const response = await http.get(url, {
                responseType: "text",
            });
            const data = response.data;
            // The response may be binary data returned as a string; encode to base64
            const base64 = Buffer.from(data, "binary").toString("base64");
            const fileName = response.headers["x-ms-file-name"] ??
                response.headers["content-disposition"]?.match(/filename="?([^";\n]+)"?/)?.[1] ??
                "download";
            const fileSize = parseInt(response.headers["content-length"] ?? "0", 10) ||
                base64.length;
            return formatData(`Downloaded file from ${columnName} on ${entitySetName}(${recordId})`, {
                entitySetName,
                recordId,
                columnName,
                fileName,
                sizeBytes: fileSize,
                contentBase64: base64,
            });
        }
        default:
            throw new Error(`Unknown file tool: ${name}`);
    }
}
//# sourceMappingURL=file.tools.js.map