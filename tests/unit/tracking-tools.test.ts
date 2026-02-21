import { handleTrackingTool } from '../../src/tools/tracking.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('Tracking tool handlers — dataverse_change_detection', () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = { getChangedRecords: jest.fn() };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it('returns snapshot and nextDeltaToken on initial call (deltaToken: null)', async () => {
    mockClient.getChangedRecords!.mockResolvedValue({
      newAndModified: [{ id: '1', name: 'Account 1' }],
      deleted: [],
      nextDeltaToken: 'abc123',
    });

    const result = await handleTrackingTool(
      'dataverse_change_detection',
      { entitySetName: 'accounts', deltaToken: null },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      newAndModified: unknown[];
      deleted: unknown[];
      nextDeltaToken: string;
    };
    expect(parsed.nextDeltaToken).toBe('abc123');
    expect(parsed.newAndModified).toHaveLength(1);
    expect(parsed.deleted).toHaveLength(0);
    expect(mockClient.getChangedRecords).toHaveBeenCalledWith('accounts', null, undefined);
  });

  it('returns changed records and updated token on subsequent call with a deltaToken', async () => {
    mockClient.getChangedRecords!.mockResolvedValue({
      newAndModified: [{ id: '2', name: 'Updated Account' }],
      deleted: [],
      nextDeltaToken: 'def456',
    });

    const result = await handleTrackingTool(
      'dataverse_change_detection',
      { entitySetName: 'accounts', deltaToken: 'abc123' },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      nextDeltaToken: string;
      newAndModified: unknown[];
    };
    expect(parsed.nextDeltaToken).toBe('def456');
    expect(parsed.newAndModified).toHaveLength(1);
    expect(mockClient.getChangedRecords).toHaveBeenCalledWith('accounts', 'abc123', undefined);
  });

  it('includes deleted record IDs in the response', async () => {
    mockClient.getChangedRecords!.mockResolvedValue({
      newAndModified: [],
      deleted: [{ id: 'old-guid-123' }],
      nextDeltaToken: 'xyz',
    });

    const result = await handleTrackingTool(
      'dataverse_change_detection',
      { entitySetName: 'accounts', deltaToken: 'abc123' },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      deleted: Array<{ id: string }>;
      nextDeltaToken: string;
    };
    expect(parsed.deleted).toHaveLength(1);
    expect(parsed.deleted[0]!.id).toBe('old-guid-123');
    expect(parsed.nextDeltaToken).toBe('xyz');
  });

  it('propagates error when change tracking is not enabled for the entity', async () => {
    mockClient.getChangedRecords!.mockRejectedValue(
      new Error("Change tracking not enabled for entity 'account'")
    );

    await expect(
      handleTrackingTool(
        'dataverse_change_detection',
        { entitySetName: 'accounts', deltaToken: null },
        dvClient()
      )
    ).rejects.toThrow("Change tracking not enabled");
  });
});
