import { handleAuditTool, auditTools } from '../../src/tools/audit.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('audit tool definitions', () => {
  it('exports dataverse_get_audit_log', () => {
    expect(auditTools.map(t => t.name)).toContain('dataverse_get_audit_log');
  });
});

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

describe('dataverse_get_audit_log', () => {
  const sampleAudit = {
    auditid: 'aud-001',
    action: 2,
    operation: 2,
    createdon: '2026-01-15T09:30:00Z',
    _objectid_value: 'rec-001',
    objecttypecode: 'account',
    changedata: '{"name":{"old":"Foo","new":"Bar"}}',
    _userid_value: 'usr-001',
    userid: { fullname: 'Alice Dupont', domainname: 'CORP\\adupont' },
  };

  it('returns mapped entries with parsed changedata', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleAudit] });
    const result = await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { entries: Array<{ auditId: string; operationName: string; changes: Record<string, unknown>; userFullName: string }>; count: number };
    expect(parsed.count).toBe(1);
    expect(parsed.entries[0]!.auditId).toBe('aud-001');
    expect(parsed.entries[0]!.operationName).toBe('Update');
    expect(parsed.entries[0]!.userFullName).toBe('Alice Dupont');
    expect(parsed.entries[0]!.changes).toEqual({ name: { old: 'Foo', new: 'Bar' } });
  });

  it('returns raw string when changedata is invalid JSON', async () => {
    const badAudit = { ...sampleAudit, changedata: 'not-json' };
    const mock = jest.fn().mockResolvedValue({ value: [badAudit] });
    const result = await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { entries: Array<{ changes: string }> };
    expect(parsed.entries[0]!.changes).toBe('not-json');
  });

  it('filters by recordId', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { recordId: '11111111-1111-1111-1111-111111111111' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('_objectid_value eq 11111111-1111-1111-1111-111111111111');
  });

  it('filters by entityLogicalName with single-quote escaping', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { entityLogicalName: "it's" }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("objecttypecode eq 'it''s'");
  });

  it('filters by userId', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { userId: '22222222-2222-2222-2222-222222222222' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('_userid_value eq 22222222-2222-2222-2222-222222222222');
  });

  it('filters by fromDate', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { fromDate: '2026-01-01T00:00:00Z' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('createdon ge 2026-01-01T00:00:00Z');
  });

  it('filters by operations array (maps names to codes)', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { operations: ['Create', 'Delete'] }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('(action eq 1 or action eq 3)');
  });

  it('ignores unknown operation names', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', { operations: ['NotReal'] }, buildClient(mock));
    const opts = mock.mock.calls[0]![1] as { filter?: string };
    // No filter added since no known codes matched
    expect(opts.filter).toBeUndefined();
  });

  it('defaults top to 50', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(50);
  });

  it('rejects top > 500', async () => {
    const mock = jest.fn();
    await expect(handleAuditTool('dataverse_get_audit_log', { top: 1000 }, buildClient(mock))).rejects.toThrow();
  });

  it('orders by createdon desc', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    expect(mock.mock.calls[0]![1].orderby).toBe('createdon desc');
  });

  it('expands userid', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    expect(mock.mock.calls[0]![1].expand).toBe('userid($select=fullname,domainname)');
  });

  it('returns clear error on 403 (audit not enabled)', async () => {
    const mock = jest.fn().mockRejectedValue(new Error('Request failed with status 403'));
    const result = await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { isError: boolean; error: string };
    expect(parsed.isError).toBe(true);
    expect(parsed.error).toContain('403');
  });

  it('rethrows non-403 errors', async () => {
    const mock = jest.fn().mockRejectedValue(new Error('Request failed with status 500'));
    await expect(handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock))).rejects.toThrow('500');
  });

  it('maps action code to human name', async () => {
    const createAudit = { ...sampleAudit, action: 1, operation: 1 };
    const mock = jest.fn().mockResolvedValue({ value: [createAudit] });
    const result = await handleAuditTool('dataverse_get_audit_log', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { entries: Array<{ actionName: string; operationName: string }> };
    expect(parsed.entries[0]!.actionName).toBe('Create');
    expect(parsed.entries[0]!.operationName).toBe('Create');
  });
});

describe('handleAuditTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleAuditTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow('Unknown audit tool');
  });
});
