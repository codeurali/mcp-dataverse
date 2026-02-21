import { handleUserTool, userTools } from '../../src/tools/users.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('user tool definitions', () => {
  it('exports dataverse_list_users', () => {
    expect(userTools.map(t => t.name)).toContain('dataverse_list_users');
  });
});

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

describe('dataverse_list_users', () => {
  const sampleUser = {
    systemuserid: 'usr-001',
    fullname: 'John Smith',
    domainname: 'CORP\\jsmith',
    internalemailaddress: 'john.smith@contoso.com',
    applicationid: null,
    isdisabled: false,
    businessunitid: { name: 'Sales' },
  };

  it('returns mapped users with correct shape', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [sampleUser] });
    const result = await handleUserTool('dataverse_list_users', { search: 'Smith' }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { users: Array<{ id: string; fullName: string; email: string; businessUnit: string; isApplicationUser: boolean }>; count: number };
    expect(parsed.count).toBe(1);
    expect(parsed.users[0]!.id).toBe('usr-001');
    expect(parsed.users[0]!.fullName).toBe('John Smith');
    expect(parsed.users[0]!.email).toBe('john.smith@contoso.com');
    expect(parsed.users[0]!.businessUnit).toBe('Sales');
    expect(parsed.users[0]!.isApplicationUser).toBe(false);
  });

  it('requires at least search or businessUnitId', async () => {
    const mock = jest.fn();
    await expect(handleUserTool('dataverse_list_users', {}, buildClient(mock))).rejects.toThrow();
  });

  it('searches by fullname and email with contains', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'Smith' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("contains(fullname,'Smith')");
    expect(filter).toContain("contains(internalemailaddress,'Smith')");
  });

  it('escapes single quotes in search', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: "O'Brien" }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain("contains(fullname,'O''Brien')");
  });

  it('excludes disabled users by default', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('isdisabled eq false');
  });

  it('includes disabled users when includeDisabled is true', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test', includeDisabled: true }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).not.toContain('isdisabled eq false');
  });

  it('excludes application users by default', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('applicationid eq null');
  });

  it('includes application users when includeApplicationUsers is true', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test', includeApplicationUsers: true }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).not.toContain('applicationid eq null');
  });

  it('filters by businessUnitId', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { businessUnitId: 'bu-001' }, buildClient(mock));
    const filter = mock.mock.calls[0]![1].filter as string;
    expect(filter).toContain('_businessunitid_value eq bu-001');
  });

  it('accepts businessUnitId alone without search', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { businessUnitId: 'bu-001' }, buildClient(mock));
    expect(mock).toHaveBeenCalled();
  });

  it('defaults top to 20', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    expect(mock.mock.calls[0]![1].top).toBe(20);
  });

  it('rejects top > 100', async () => {
    const mock = jest.fn();
    await expect(handleUserTool('dataverse_list_users', { search: 'test', top: 200 }, buildClient(mock))).rejects.toThrow();
  });

  it('orders by fullname asc', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    expect(mock.mock.calls[0]![1].orderby).toBe('fullname asc');
  });

  it('expands businessunitid', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    expect(mock.mock.calls[0]![1].expand).toBe('businessunitid($select=name)');
  });

  it('marks application users correctly', async () => {
    const appUser = { ...sampleUser, applicationid: 'app-guid' };
    const mock = jest.fn().mockResolvedValue({ value: [appUser] });
    const result = await handleUserTool('dataverse_list_users', { search: 'test', includeApplicationUsers: true }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { users: Array<{ isApplicationUser: boolean }> };
    expect(parsed.users[0]!.isApplicationUser).toBe(true);
  });

  it('handles null businessunitid gracefully', async () => {
    const userNoBU = { ...sampleUser, businessunitid: null };
    const mock = jest.fn().mockResolvedValue({ value: [userNoBU] });
    const result = await handleUserTool('dataverse_list_users', { search: 'test' }, buildClient(mock));
    const parsed = JSON.parse(result.content[0]!.text) as { users: Array<{ businessUnit: string | null }> };
    expect(parsed.users[0]!.businessUnit).toBeNull();
  });
});

describe('handleUserTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleUserTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow('Unknown user tool');
  });
});
