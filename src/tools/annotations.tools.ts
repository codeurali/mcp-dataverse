import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import { esc } from "../dataverse/dataverse-client.utils.js";
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
    description:
      "Retrieves notes and file attachments (annotations) linked to a Dataverse record. Returns note text, file metadata (name, size, MIME type), owner, and timestamps. Set includeContent=true to also retrieve base64 file content (warning: can be very large).",
    inputSchema: {
      type: "object" as const,
      properties: {
        recordId: {
          type: "string",
          description: "The parent record's GUID",
        },
        includeContent: {
          type: "boolean",
          description:
            "If true, include documentbody (base64). WARNING: can be very large.",
          default: false,
        },
        top: {
          type: "number",
          description:
            "Maximum number of annotations to return (default 20, max 100)",
          default: 20,
        },
        mimeTypeFilter: {
          type: "string",
          description: 'Filter by MIME type (e.g. "application/pdf")',
        },
      },
      required: ["recordId"],
    },
  },
  {
    name: "dataverse_create_annotation",
    description:
      "Creates a note or file attachment (annotation) linked to a Dataverse record. Provide notetext for a text note, documentbody (base64) for a file attachment, or both. The parent record is identified by entitySetName and recordId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        recordId: {
          type: "string",
          description: "The parent record's GUID",
        },
        entitySetName: {
          type: "string",
          description:
            'The OData entity set name of the parent record (e.g., "accounts", "contacts")',
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
  },
];

export async function handleAnnotationTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
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

      const response = await client.query<Record<string, unknown>>(
        "annotations",
        {
          select: selectFields,
          filter: filterParts.join(" and "),
          expand: "ownerid($select=name)",
          orderby: "createdon desc",
          top: params.top,
        },
      );

      const rows = (response.value ?? []) as Array<Record<string, unknown>>;

      const annotations = rows.map((row) => {
        const result: Record<string, unknown> = {
          id: row["annotationid"] ?? "",
          subject: row["subject"] ?? null,
          noteText: row["notetext"] ?? null,
          isDocument: row["isdocument"] === true,
          createdOn: row["createdon"] ?? "",
          modifiedOn: row["modifiedon"] ?? "",
          owner:
            (row["ownerid"] as Record<string, unknown> | null)?.["name"] ??
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                recordId: params.recordId,
                annotations,
                count: annotations.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "dataverse_create_annotation": {
      const params = CreateAnnotationInput.parse(args);

      const data: Record<string, unknown> = {
        "objectid@odata.bind": `/${params.entitySetName}(${params.recordId})`,
      };
      if (params.notetext !== undefined) data["notetext"] = params.notetext;
      if (params.subject !== undefined) data["subject"] = params.subject;
      if (params.filename !== undefined) data["filename"] = params.filename;
      if (params.mimetype !== undefined) data["mimetype"] = params.mimetype;
      if (params.documentbody !== undefined) {
        data["documentbody"] = params.documentbody;
        data["isdocument"] = true;
      }

      const annotationId = await client.createRecord("annotations", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                created: true,
                annotationId,
                parentRecordId: params.recordId,
                entitySetName: params.entitySetName,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown annotation tool: ${name}`);
  }
}
