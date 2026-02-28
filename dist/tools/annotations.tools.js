import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
import { safeEntitySetName } from "./validation.utils.js";
const GetAnnotationsInput = z.object({
    recordId: z.string().uuid(),
    includeContent: z.boolean().optional().default(false),
    top: z.number().int().positive().max(100).optional().default(20),
    mimeTypeFilter: z.string().optional(),
});
const CreateAnnotationInput = z
    .object({
    recordId: z.string().uuid(),
    entitySetName: safeEntitySetName,
    notetext: z.string().optional(),
    subject: z.string().optional(),
    filename: z.string().optional(),
    mimetype: z.string().optional(),
    documentbody: z.string().optional(),
})
    .refine((data) => Boolean(data.notetext) || Boolean(data.documentbody), {
    message: "At least one of notetext or documentbody is required",
});
export const annotationTools = [
    {
        name: "dataverse_get_annotations",
        description: "Retrieves notes and file attachments (annotations) linked to a Dataverse record. Returns note text, file metadata (name, size, MIME type), owner, and timestamps. Set includeContent=true to also retrieve base64 file content (warning: can be very large). WHEN TO USE: Retrieving notes or file attachments linked to a specific record. BEST PRACTICES: Avoid includeContent=true unless you need file data — base64 payloads can be very large. WORKFLOW: file_operations.",
        inputSchema: {
            type: "object",
            properties: {
                recordId: {
                    type: "string",
                    description: "The parent record's GUID",
                },
                includeContent: {
                    type: "boolean",
                    description: "If true, include documentbody (base64). WARNING: can be very large.",
                    default: false,
                },
                top: {
                    type: "number",
                    description: "Maximum number of annotations to return (default 20, max 100)",
                    default: 20,
                },
                mimeTypeFilter: {
                    type: "string",
                    description: 'Filter by MIME type (e.g. "application/pdf")',
                },
            },
            required: ["recordId"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_create_annotation",
        description: "Creates a note or file attachment (annotation) linked to a Dataverse record. Provide notetext for a text note, documentbody (base64) for a file attachment, or both. The parent record is identified by entitySetName and recordId. WHEN TO USE: Adding a text note or file attachment to an existing record. BEST PRACTICES: Provide filename and mimetype when attaching files; at least notetext or documentbody is required. WORKFLOW: file_operations.",
        inputSchema: {
            type: "object",
            properties: {
                recordId: {
                    type: "string",
                    description: "The parent record's GUID",
                },
                entitySetName: {
                    type: "string",
                    description: 'The OData entity set name of the parent record (e.g., "accounts", "contacts")',
                },
                notetext: {
                    type: "string",
                    description: "Text content of the note",
                },
                subject: {
                    type: "string",
                    description: "Subject/title of the note",
                },
                filename: {
                    type: "string",
                    description: "File name (required when attaching a file)",
                },
                mimetype: {
                    type: "string",
                    description: 'MIME type of the file (e.g., "application/pdf")',
                },
                documentbody: {
                    type: "string",
                    description: "Base64-encoded file content",
                },
            },
            required: ["recordId", "entitySetName"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
export async function handleAnnotationTool(name, args, client) {
    switch (name) {
        case "dataverse_get_annotations": {
            const params = GetAnnotationsInput.parse(args);
            const selectFields = [
                "annotationid",
                "subject",
                "notetext",
                "filename",
                "filesize",
                "mimetype",
                "isdocument",
                "createdon",
                "modifiedon",
            ];
            if (params.includeContent) {
                selectFields.push("documentbody");
            }
            const filterParts = [`_objectid_value eq ${params.recordId}`];
            if (params.mimeTypeFilter) {
                filterParts.push(`mimetype eq '${esc(params.mimeTypeFilter)}'`);
            }
            const response = await client.query("annotations", {
                select: selectFields,
                filter: filterParts.join(" and "),
                expand: "ownerid($select=name)",
                orderby: "createdon desc",
                top: params.top,
            });
            const rows = (response.value ?? []);
            const annotations = rows.map((row) => {
                const result = {
                    id: row["annotationid"] ?? "",
                    subject: row["subject"] ?? null,
                    noteText: row["notetext"] ?? null,
                    isDocument: row["isdocument"] === true,
                    createdOn: row["createdon"] ?? "",
                    modifiedOn: row["modifiedon"] ?? "",
                    owner: row["ownerid"]?.["name"] ??
                        null,
                };
                if (row["isdocument"] === true) {
                    result.fileName = row["filename"] ?? null;
                    result.fileSize = row["filesize"] ?? null;
                    result.mimeType = row["mimetype"] ?? null;
                }
                if (params.includeContent && row["documentbody"]) {
                    result.documentBody = row["documentbody"];
                }
                return result;
            });
            return formatData(`${annotations.length} annotations found for record ${params.recordId}`, {
                recordId: params.recordId,
                annotations,
                count: annotations.length,
            }, ["Use dataverse_create_annotation to add a note or attachment"]);
        }
        case "dataverse_create_annotation": {
            const params = CreateAnnotationInput.parse(args);
            const data = {
                "objectid@odata.bind": `/${params.entitySetName}(${params.recordId})`,
            };
            if (params.notetext !== undefined)
                data["notetext"] = params.notetext;
            if (params.subject !== undefined)
                data["subject"] = params.subject;
            if (params.filename !== undefined)
                data["filename"] = params.filename;
            if (params.mimetype !== undefined)
                data["mimetype"] = params.mimetype;
            if (params.documentbody !== undefined) {
                data["documentbody"] = params.documentbody;
                data["isdocument"] = true;
            }
            const annotationId = await client.createRecord("annotations", data);
            return formatData(`Created annotation ${annotationId}`, {
                created: true,
                annotationId,
                parentRecordId: params.recordId,
                entitySetName: params.entitySetName,
            }, ["Use dataverse_get_annotations to list all notes for this record"]);
        }
        default:
            throw new Error(`Unknown annotation tool: ${name}`);
    }
}
//# sourceMappingURL=annotations.tools.js.map