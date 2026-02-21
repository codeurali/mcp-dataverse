import { handleFileTool, fileTools } from '../../src/tools/file.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('file tool definitions', () => {
  it('exports dataverse_upload_file_column', () => {
    expect(fileTools.map(t => t.name)).toContain('dataverse_upload_file_column');
  });

  it('exports dataverse_download_file_column', () => {
    expect(fileTools.map(t => t.name)).toContain('dataverse_download_file_column');
  });
});

function buildClient(httpMock: { patch?: jest.Mock; get?: jest.Mock }): DataverseAdvancedClient {
  return { http: httpMock } as unknown as DataverseAdvancedClient;
}

// 6-byte PNG minimal (1×1 transparent pixel)
const SAMPLE_BASE64 = Buffer.from('hello-file').toString('base64');

describe('dataverse_upload_file_column', () => {
  const validArgs = {
    entitySetName: 'accounts',
    recordId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    columnName: 'new_resume',
    fileContent: SAMPLE_BASE64,
    fileName: 'resume.pdf',
  };

  it('calls http.patch with correct URL', async () => {
    const patch = jest.fn().mockResolvedValue({ data: null, status: 204, headers: {} });
    const client = buildClient({ patch });
    await handleFileTool('dataverse_upload_file_column', validArgs, client);
    expect(patch).toHaveBeenCalledWith(
      `accounts(${validArgs.recordId})/new_resume`,
      expect.any(Buffer),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/octet-stream' }) })
    );
  });

  it('sends x-ms-file-name header', async () => {
    const patch = jest.fn().mockResolvedValue({ data: null, status: 204, headers: {} });
    await handleFileTool('dataverse_upload_file_column', validArgs, buildClient({ patch }));
    const opts = patch.mock.calls[0]![2] as { headers: Record<string, string> };
    expect(opts.headers['x-ms-file-name']).toBe('resume.pdf');
  });

  it('decodes base64 before sending', async () => {
    const patch = jest.fn().mockResolvedValue({ data: null, status: 204, headers: {} });
    await handleFileTool('dataverse_upload_file_column', validArgs, buildClient({ patch }));
    const body = patch.mock.calls[0]![1] as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString()).toBe('hello-file');
  });

  it('returns success result with sizeBytes', async () => {
    const patch = jest.fn().mockResolvedValue({ data: null, status: 204, headers: {} });
    const result = await handleFileTool('dataverse_upload_file_column', validArgs, buildClient({ patch }));
    const parsed = JSON.parse(result.content[0]!.text) as { success: boolean; sizeBytes: number; fileName: string };
    expect(parsed.success).toBe(true);
    expect(parsed.fileName).toBe('resume.pdf');
    expect(parsed.sizeBytes).toBeGreaterThan(0);
  });

  it('rejects path traversal in entitySetName', async () => {
    await expect(
      handleFileTool('dataverse_upload_file_column', { ...validArgs, entitySetName: '../evil' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects slash in entitySetName', async () => {
    await expect(
      handleFileTool('dataverse_upload_file_column', { ...validArgs, entitySetName: 'acc/ounts' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects non-alphanumeric/underscore columnName', async () => {
    await expect(
      handleFileTool('dataverse_upload_file_column', { ...validArgs, columnName: 'col-name' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects path traversal in columnName', async () => {
    await expect(
      handleFileTool('dataverse_upload_file_column', { ...validArgs, columnName: '../../etc' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects invalid recordId (not a UUID)', async () => {
    await expect(
      handleFileTool('dataverse_upload_file_column', { ...validArgs, recordId: 'not-a-uuid' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects missing fileContent', async () => {
    const { fileContent: _unused, ...rest } = validArgs;
    await expect(handleFileTool('dataverse_upload_file_column', rest, buildClient({}))).rejects.toThrow();
  });
});

describe('dataverse_download_file_column', () => {
  const validArgs = {
    entitySetName: 'accounts',
    recordId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    columnName: 'new_resume',
  };

  it('calls http.get with correct URL including $value', async () => {
    const get = jest.fn().mockResolvedValue({
      data: 'binary-content',
      status: 200,
      headers: { 'x-ms-file-name': 'resume.pdf', 'content-length': '14' },
    });
    await handleFileTool('dataverse_download_file_column', validArgs, buildClient({ get }));
    expect(get).toHaveBeenCalledWith(
      'accounts(a1b2c3d4-e5f6-7890-abcd-ef1234567890)/new_resume/$value',
      expect.anything()
    );
  });

  it('returns base64-encoded content', async () => {
    const binaryData = 'hello-file';
    const get = jest.fn().mockResolvedValue({
      data: binaryData,
      status: 200,
      headers: { 'x-ms-file-name': 'myfile.txt' },
    });
    const result = await handleFileTool('dataverse_download_file_column', validArgs, buildClient({ get }));
    const parsed = JSON.parse(result.content[0]!.text) as { contentBase64: string };
    const decoded = Buffer.from(parsed.contentBase64, 'base64').toString('binary');
    expect(decoded).toBe(binaryData);
  });

  it('extracts fileName from x-ms-file-name header', async () => {
    const get = jest.fn().mockResolvedValue({
      data: 'data',
      status: 200,
      headers: { 'x-ms-file-name': 'report.xlsx' },
    });
    const result = await handleFileTool('dataverse_download_file_column', validArgs, buildClient({ get }));
    const parsed = JSON.parse(result.content[0]!.text) as { fileName: string };
    expect(parsed.fileName).toBe('report.xlsx');
  });

  it('falls back to content-disposition for fileName', async () => {
    const get = jest.fn().mockResolvedValue({
      data: 'data',
      status: 200,
      headers: { 'content-disposition': 'attachment; filename="fallback.pdf"' },
    });
    const result = await handleFileTool('dataverse_download_file_column', validArgs, buildClient({ get }));
    const parsed = JSON.parse(result.content[0]!.text) as { fileName: string };
    expect(parsed.fileName).toBe('fallback.pdf');
  });

  it('uses "download" as fallback fileName when no header present', async () => {
    const get = jest.fn().mockResolvedValue({
      data: 'data',
      status: 200,
      headers: {},
    });
    const result = await handleFileTool('dataverse_download_file_column', validArgs, buildClient({ get }));
    const parsed = JSON.parse(result.content[0]!.text) as { fileName: string };
    expect(parsed.fileName).toBe('download');
  });

  it('rejects path traversal in entitySetName', async () => {
    await expect(
      handleFileTool('dataverse_download_file_column', { ...validArgs, entitySetName: '../evil' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects invalid recordId', async () => {
    await expect(
      handleFileTool('dataverse_download_file_column', { ...validArgs, recordId: 'bad-id' }, buildClient({}))
    ).rejects.toThrow();
  });

  it('rejects non-safe columnName', async () => {
    await expect(
      handleFileTool('dataverse_download_file_column', { ...validArgs, columnName: '../col' }, buildClient({}))
    ).rejects.toThrow();
  });
});

describe('handleFileTool unknown', () => {
  it('throws on unknown tool name', async () => {
    await expect(handleFileTool('dataverse_unknown', {}, buildClient({}))).rejects.toThrow(
      'Unknown file tool'
    );
  });
});
