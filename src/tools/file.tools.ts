import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';

const SAFE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PATH_TRAVERSAL_REGEX = /\.\.|[/\\]/;

const UploadFileColumnInput = z.object({
  entitySetName: z.string().min(1).refine(v => !PATH_TRAVERSAL_REGEX.test(v), {
    message: 'entitySetName must not contain path traversal characters',
  }),
  recordId: z.string().uuid(),
  columnName: z.string().min(1).refine(v => SAFE_NAME_REGEX.test(v), {
    message: 'columnName must be alphanumeric/underscore only',
  }),
  fileContent: z.string().min(1).describe('Base64-encoded file content'),
  fileName: z.string().min(1),
});

const DownloadFileColumnInput = z.object({
  entitySetName: z.string().min(1).refine(v => !PATH_TRAVERSAL_REGEX.test(v), {
    message: 'entitySetName must not contain path traversal characters',
  }),
  recordId: z.string().uuid(),
  columnName: z.string().min(1).refine(v => SAFE_NAME_REGEX.test(v), {
    message: 'columnName must be alphanumeric/underscore only',
  }),
});

export const fileTools = [
  {
    name: 'dataverse_upload_file_column',
    description:
      'Uploads a file to a Dataverse file column. Provide the entity set name, record GUID, column name, base64-encoded file content, and file name. The file is stored in the specified file-type column on the record.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: {
          type: 'string',
          description: 'OData entity set name (e.g., "accounts")',
        },
        recordId: {
          type: 'string',
          description: 'Record GUID',
        },
        columnName: {
          type: 'string',
          description: 'File column logical name',
        },
        fileContent: {
          type: 'string',
          description: 'Base64-encoded file content',
        },
        fileName: {
          type: 'string',
          description: 'File name including extension (e.g., "report.pdf")',
        },
      },
      required: ['entitySetName', 'recordId', 'columnName', 'fileContent', 'fileName'],
    },
  },
  {
    name: 'dataverse_download_file_column',
    description:
      'Downloads a file from a Dataverse file column. Returns the file content as a base64-encoded string along with the file name and size.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entitySetName: {
          type: 'string',
          description: 'OData entity set name (e.g., "accounts")',
        },
        recordId: {
          type: 'string',
          description: 'Record GUID',
        },
        columnName: {
          type: 'string',
          description: 'File column logical name',
        },
      },
      required: ['entitySetName', 'recordId', 'columnName'],
    },
  },
];

export async function handleFileTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Access the protected HttpClient for raw binary requests (file column API).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const http = (client as any).http as ClientHttp;

  switch (name) {
    case 'dataverse_upload_file_column': {
      const { entitySetName, recordId, columnName, fileContent, fileName } =
        UploadFileColumnInput.parse(args);

      const buffer = Buffer.from(fileContent, 'base64');
      const url = `${entitySetName}(${recordId})/${columnName}`;

      await http.patch(url, buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-ms-file-name': fileName,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              entitySetName,
              recordId,
              columnName,
              fileName,
              sizeBytes: buffer.length,
            }, null, 2),
          },
        ],
      };
    }

    case 'dataverse_download_file_column': {
      const { entitySetName, recordId, columnName } = DownloadFileColumnInput.parse(args);

      const url = `${entitySetName}(${recordId})/${columnName}/$value`;

      const response = await http.get(url, {
        responseType: 'text',
      });

      const data = response.data as string;
      // The response may be binary data returned as a string; encode to base64
      const base64 = Buffer.from(data, 'binary').toString('base64');

      const fileName =
        (response.headers['x-ms-file-name'] as string | undefined) ??
        (response.headers['content-disposition']?.match(/filename="?([^";\n]+)"?/)?.[1]) ??
        'download';

      const fileSize = parseInt(response.headers['content-length'] ?? '0', 10) || base64.length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              entitySetName,
              recordId,
              columnName,
              fileName,
              sizeBytes: fileSize,
              contentBase64: base64,
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown file tool: ${name}`);
  }
}

/** Minimal type for the underlying HttpClient methods we use. */
interface ClientHttp {
  patch<T = unknown>(url: string, body?: unknown, options?: {
    headers?: Record<string, string>;
  }): Promise<{ data: T; status: number; headers: Record<string, string> }>;
  get<T = unknown>(url: string, options?: {
    headers?: Record<string, string>;
    responseType?: 'text';
  }): Promise<{ data: T; status: number; headers: Record<string, string> }>;
}
