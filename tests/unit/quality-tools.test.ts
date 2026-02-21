import { handleQualityTool, qualityTools } from '../../src/tools/quality.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('quality tool definitions', () => {
  it('exports dataverse_detect_duplicates', () => {
    expect(qualityTools.map(t => t.name)).toContain('dataverse_detect_duplicates');
  });
});

function buildClient(executeActionMock: jest.Mock): DataverseAdvancedClient {
  return { executeAction: executeActionMock } as unknown as DataverseAdvancedClient;
}

describe('dataverse_detect_duplicates', () => {
  it('calls RetrieveDuplicates with correct body shape', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'account',
      record: { name: 'Contoso Ltd' },
    }, buildClient(mock));

    expect(mock).toHaveBeenCalledWith('RetrieveDuplicates', expect.objectContaining({
      BusinessEntity: expect.objectContaining({
        '@odata.type': 'Microsoft.Dynamics.CRM.account',
        name: 'Contoso Ltd',
      }),
      MatchingEntityName: 'account',
      PagingInfo: { PageNumber: 1, Count: 5 },
    }));
  });

  it('returns hasDuplicates false when no duplicates', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    const result = await handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'contact',
      record: { fullname: 'Unique Person' },
    }, buildClient(mock));

    const parsed = JSON.parse(result.content[0]!.text) as { hasDuplicates: boolean; duplicateCount: number };
    expect(parsed.hasDuplicates).toBe(false);
    expect(parsed.duplicateCount).toBe(0);
  });

  it('returns hasDuplicates true with duplicates stripped of @odata keys', async () => {
    const mock = jest.fn().mockResolvedValue({
      value: [
        { accountid: 'acc-001', name: 'Contoso Ltd', '@odata.etag': 'W/"123"', '@odata.type': '#account' },
        { accountid: 'acc-002', name: 'Contoso', '@odata.etag': 'W/"456"' },
      ],
    });
    const result = await handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'account',
      record: { name: 'Contoso Ltd' },
    }, buildClient(mock));

    const parsed = JSON.parse(result.content[0]!.text) as { hasDuplicates: boolean; duplicateCount: number; duplicates: Array<Record<string, unknown>> };
    expect(parsed.hasDuplicates).toBe(true);
    expect(parsed.duplicateCount).toBe(2);
    expect(parsed.duplicates[0]).not.toHaveProperty('@odata.etag');
    expect(parsed.duplicates[0]).not.toHaveProperty('@odata.type');
    expect(parsed.duplicates[0]).toHaveProperty('accountid', 'acc-001');
  });

  it('uses custom top', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'account',
      record: { name: 'Test' },
      top: 10,
    }, buildClient(mock));

    const body = mock.mock.calls[0]![1] as Record<string, unknown>;
    expect((body.PagingInfo as { Count: number }).Count).toBe(10);
  });

  it('rejects top > 20', async () => {
    const mock = jest.fn();
    await expect(handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'account',
      record: { name: 'Test' },
      top: 50,
    }, buildClient(mock))).rejects.toThrow();
  });

  it('rejects invalid entityLogicalName (injection attempt)', async () => {
    const mock = jest.fn();
    await expect(handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: "account'; DROP TABLE--",
      record: { name: 'Test' },
    }, buildClient(mock))).rejects.toThrow();
  });

  it('accepts valid logical names with underscores', async () => {
    const mock = jest.fn().mockResolvedValue({ value: [] });
    await handleQualityTool('dataverse_detect_duplicates', {
      entityLogicalName: 'new_custom_entity',
      record: { new_name: 'Test' },
    }, buildClient(mock));
    expect(mock).toHaveBeenCalled();
  });

  it('rejects missing required fields', async () => {
    const mock = jest.fn();
    await expect(handleQualityTool('dataverse_detect_duplicates', {}, buildClient(mock))).rejects.toThrow();
  });
});

describe('handleQualityTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mock = jest.fn();
    await expect(handleQualityTool('dataverse_unknown', {}, buildClient(mock))).rejects.toThrow('Unknown quality tool');
  });
});
