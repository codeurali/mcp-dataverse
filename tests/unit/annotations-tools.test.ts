import { handleAnnotationTool, annotationTools } from '../../src/tools/annotations.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('annotation tool definitions', () => {
  it('exports dataverse_get_annotations', () => {
    expect(annotationTools.map(t => t.name)).toContain('dataverse_get_annotations');
  });
});

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

const RECORD_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const RECORD_UUID_2 = 'aaaabbbb-cccc-dddd-eeee-ffff00001234';

describe('dataverse_get_annotations', () => {
  const sampleNote = {
    annotationid: 'ann-001',
    subject: 'Follow-up notes',
    notetext: 'Customer requested callback Monday',
    filename: null,
    filesize: null,
    mimetype: null,
    isdocument: false,
    createdon: '2026-01-10T14:23:00Z',
    modifiedon: '2026-01-10T14:23:00Z',
    ownerid: { name: 'Alice Dupont' },
  };

  const sampleDoc = {
    annotationid: 'ann-002',
    subject: 'Contract.pdf',
    notetext: null,
    filename: 'Contract.pdf',
    filesize: 204800,
    mimetype: 'application/pdf',
    isdocument: true,
    createdon: '2026-01-09T11:00:00Z',
    modifiedon: '2026-01-09T11:00:00Z',
    ownerid: { name: 'Bob Martin' },
  };

  it('returns mapped annotations with correct shape', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleNote, sampleDoc] });
    const result = await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { recordId: string; annotations: Array<Record<string, unknown>>; count: number };
    expect(parsed.recordId).toBe(RECORD_UUID);
    expect(parsed.count).toBe(2);
    expect(parsed.annotations[0]!.noteText).toBe('Customer requested callback Monday');
    expect(parsed.annotations[0]!.isDocument).toBe(false);
    expect(parsed.annotations[0]).not.toHaveProperty('fileName');
  });

  it('includes file metadata for document annotations', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleDoc] });
    const result = await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { annotations: Array<{ isDocument: boolean; fileName: string; fileSize: number; mimeType: string }> };
    expect(parsed.annotations[0]!.isDocument).toBe(true);
    expect(parsed.annotations[0]!.fileName).toBe('Contract.pdf');
    expect(parsed.annotations[0]!.fileSize).toBe(204800);
    expect(parsed.annotations[0]!.mimeType).toBe('application/pdf');
  });

  it('does not include documentbody by default', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleDoc] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    const select = mock.mock.calls[0]![1].select as string[];
    expect(select).not.toContain('documentbody');
  });

  it('includes documentbody in select when includeContent is true', async () => {
    const docWithBody = { ...sampleDoc, documentbody: 'base64content==' };
    const mock = jest.fn().mockResolvedValue({ value: [docWithBody] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID, includeContent: true }, buildClient(mock));
    const select = mock.mock.calls[0]![1].select as string[];
    expect(select).toContain('documentbody');
  });

  it('filters by _objectid_value', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID_2 }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain(`_objectid_value eq ${RECORD_UUID_2}`);
  });

  it('adds mimeTypeFilter with single-quote escaping', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID, mimeTypeFilter: "text/plain" }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("mimetype eq 'text/plain'");
  });

  it('escapes single quotes in mimeTypeFilter', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID, mimeTypeFilter: "it's/weird" }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("mimetype eq 'it''s/weird'");
  });

  it('defaults top to 20', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(20);
  });

  it('rejects top > 100', async () => {
    const mock = jest.fn();
    await expect(handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID, top: 200 }, buildClient(mock))).rejects.toThrow();
  });

  it('rejects missing recordId', async () => {
    const mock = jest.fn();
    await expect(handleAnnotationTool('dataverse_get_annotations', {}, buildClient(mock))).rejects.toThrow();
  });

  it('orders by createdon desc', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    expect(mock.mock.calls[0]![1].orderby).toBe('createdon desc');
  });

  it('expands ownerid', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    expect(mock.mock.calls[0]![1].expand).toBe('ownerid($select=name)');
  });

  it('extracts owner name from expanded entity', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleNote] });
    const result = await handleAnnotationTool('dataverse_get_annotations', { recordId: RECORD_UUID }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { annotations: Array<{ owner: string }> };
    expect(parsed.annotations[0]!.owner).toBe('Alice Dupont');
  });
});

describe('handleAnnotationTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleAnnotationTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow('Unknown annotation tool');
  });
});
