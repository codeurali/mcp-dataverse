import { handleOrgTool, orgTools } from '../../src/tools/org.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('org tool definitions', () => {
  it('exports dataverse_list_business_units', () => {
    expect(orgTools.map(t => t.name)).toContain('dataverse_list_business_units');
  });
});

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

const rootBU = {
  businessunitid: 'bu-001',
  name: 'Contoso Corp',
  parentbusinessunitid: null,
  isdisabled: false,
  createdon: '2023-01-01T00:00:00Z',
};

const childBU = {
  businessunitid: 'bu-002',
  name: 'Contoso Sales',
  parentbusinessunitid: 'bu-001',
  isdisabled: false,
  createdon: '2023-06-01T00:00:00Z',
};

const disabledBU = {
  businessunitid: 'bu-003',
  name: 'Contoso Legacy',
  parentbusinessunitid: 'bu-001',
  isdisabled: true,
  createdon: '2022-01-01T00:00:00Z',
};

describe('dataverse_list_business_units', () => {
  it('queries businessunits entity set', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [rootBU] });
    await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    expect(mock).toHaveBeenCalledWith('businessunits', expect.any(Object));
  });

  it('filters out disabled BUs by default', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [rootBU] });
    await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    const args = mock.mock.calls[0]![1] as { filter?: string };
    expect(args.filter).toBe('isdisabled eq false');
  });

  it('returns all BUs including disabled when includeDisabled is true', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [rootBU, childBU, disabledBU] });
    await handleOrgTool('dataverse_list_business_units', { includeDisabled: true }, buildClient(mock));
    const args = mock.mock.calls[0]![1] as { filter?: string };
    expect(args.filter).toBeUndefined();
  });

  it('returns mapped units with correct shape', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [rootBU, childBU] });
    const result = await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as {
      businessUnits: Array<{ id: string; name: string; parentBusinessUnitId: string | null; isDisabled: boolean; createdOn: string }>;
      count: number;
    };
    expect(parsed.count).toBe(2);
    expect(parsed.businessUnits[0]!.id).toBe('bu-001');
    expect(parsed.businessUnits[0]!.name).toBe('Contoso Corp');
    expect(parsed.businessUnits[0]!.parentBusinessUnitId).toBeNull();
    expect(parsed.businessUnits[1]!.parentBusinessUnitId).toBe('bu-001');
  });

  it('defaults top to 50', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(50);
  });

  it('passes custom top', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleOrgTool('dataverse_list_business_units', { top: 100 }, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(100);
  });

  it('rejects top > 200', async () => {
    const mock = jest.fn();
    await expect(
      handleOrgTool('dataverse_list_business_units', { top: 201 }, buildClient(mock))
    ).rejects.toThrow();
  });

  it('orders results by name asc', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    expect(mock.mock.calls[0]![1].orderby).toBe('name asc');
  });

  it('selects expected fields', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    const select = mock.mock.calls[0]![1].select as string[];
    expect(select).toContain('businessunitid');
    expect(select).toContain('name');
    expect(select).toContain('isdisabled');
  });

  it('returns empty array when no results', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    const result = await handleOrgTool('dataverse_list_business_units', {}, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { count: number };
    expect(parsed.count).toBe(0);
  });

  it('handles null args (uses defaults)', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await expect(handleOrgTool('dataverse_list_business_units', null, buildClient(mock))).resolves.not.toThrow();
  });
});

describe('handleOrgTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleOrgTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow(
      'Unknown org tool'
    );
  });
});
