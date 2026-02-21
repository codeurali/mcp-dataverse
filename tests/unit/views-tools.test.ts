import { handleViewTool, viewTools } from '../../src/tools/views.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('view tool definitions', () => {
  it('exports dataverse_list_views', () => {
    expect(viewTools.map(t => t.name)).toContain('dataverse_list_views');
  });
});

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

const systemView = {
  savedqueryid: 'sv-001',
  name: 'Active Accounts',
  isdefault: true,
  querytype: 0,
  description: 'Shows active accounts',
};

const systemView2 = {
  savedqueryid: 'sv-002',
  name: 'All Accounts',
  isdefault: false,
  querytype: 0,
  description: null,
};

const personalView = {
  userqueryid: 'uv-001',
  name: 'My Accounts',
  description: null,
};

describe('dataverse_list_views', () => {
  it('queries savedqueries for the given entity', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [systemView] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    expect(mock).toHaveBeenCalledWith('savedqueries', expect.objectContaining({
      filter: expect.stringContaining("returnedtypecode eq 'account'"),
    }));
  });

  it('returns system views with correct shape', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [systemView, systemView2] });
    const result = await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as {
      entityLogicalName: string;
      systemViews: Array<{ id: string; name: string; isDefault: boolean; queryType: number; description: string | null; viewType: string }>;
      systemViewCount: number;
    };
    expect(parsed.entityLogicalName).toBe('account');
    expect(parsed.systemViewCount).toBe(2);
    expect(parsed.systemViews[0]!.id).toBe('sv-001');
    expect(parsed.systemViews[0]!.name).toBe('Active Accounts');
    expect(parsed.systemViews[0]!.isDefault).toBe(true);
    expect(parsed.systemViews[0]!.viewType).toBe('system');
    expect(parsed.systemViews[1]!.description).toBeNull();
  });

  it('does not query userqueries by default', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0]![0]).toBe('savedqueries');
  });

  it('omits personalViews when includePersonal is false', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    const result = await handleViewTool('dataverse_list_views', { entityLogicalName: 'account', includePersonal: false }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { personalViews: unknown; personalViewCount: unknown };
    expect(parsed.personalViews).toBeUndefined();
    expect(parsed.personalViewCount).toBeUndefined();
  });

  it('queries userqueries when includePersonal is true', async () => {
    const mock = jest
      .fn()
      .mockResolvedValueOnce({ value: [systemView] })
      .mockResolvedValueOnce({ value: [personalView] });
    const result = await handleViewTool('dataverse_list_views', { entityLogicalName: 'account', includePersonal: true }, buildClient(mock));
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[1]![0]).toBe('userqueries');
    const parsed = JSON.parse(result.content[0]!.text) as {
      personalViews: Array<{ id: string; name: string; viewType: string }>;
      personalViewCount: number;
    };
    expect(parsed.personalViewCount).toBe(1);
    expect(parsed.personalViews[0]!.id).toBe('uv-001');
    expect(parsed.personalViews[0]!.viewType).toBe('personal');
  });

  it('filters savedqueries by statecode eq 0', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('statecode eq 0');
  });

  it('defaults top to 20', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(20);
  });

  it('passes top correctly', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account', top: 50 }, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(50);
  });

  it('rejects top > 100', async () => {
    const mock = jest.fn();
    await expect(
      handleViewTool('dataverse_list_views', { entityLogicalName: 'account', top: 101 }, buildClient(mock))
    ).rejects.toThrow();
  });

  it('rejects missing entityLogicalName', async () => {
    const mock = jest.fn();
    await expect(handleViewTool('dataverse_list_views', {}, buildClient(mock))).rejects.toThrow();
  });

  it('rejects empty entityLogicalName', async () => {
    const mock = jest.fn();
    await expect(
      handleViewTool('dataverse_list_views', { entityLogicalName: '' }, buildClient(mock))
    ).rejects.toThrow();
  });

  it('escapes single quotes in entityLogicalName for OData', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: "it's_odd" }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("returnedtypecode eq 'it''s_odd'");
  });

  it('orders system views by name asc', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    expect(mock.mock.calls[0]![1].orderby).toBe('name asc');
  });

  it('returns empty system views array when no views found', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    const result = await handleViewTool('dataverse_list_views', { entityLogicalName: 'account' }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { systemViewCount: number };
    expect(parsed.systemViewCount).toBe(0);
  });
});

describe('handleViewTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleViewTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow(
      'Unknown view tool'
    );
  });
});
