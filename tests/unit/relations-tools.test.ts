import { handleRelationTool } from '../../src/tools/relations.tools.js';
import type { DataverseClient } from '../../src/dataverse/dataverse-client.js';

const VALID_ID      = '00000000-0000-0000-0000-000000000001';
const VALID_RELATED = '00000000-0000-0000-0000-000000000002';

describe('handleRelationTool', () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      associate: jest.fn(),
      disassociate: jest.fn(),
    };
  });

  const client = () => mockClient as unknown as DataverseClient;

  // ── dataverse_associate ───────────────────────────────────────────────────

  describe('dataverse_associate', () => {
    it('calls client.associate with correct arguments and returns success message', async () => {
      mockClient.associate!.mockResolvedValue(undefined);

      const result = await handleRelationTool(
        'dataverse_associate',
        {
          entitySetName: 'accounts',
          id: VALID_ID,
          relationshipName: 'account_contacts',
          relatedEntitySetName: 'contacts',
          relatedId: VALID_RELATED,
        },
        client()
      );

      expect(mockClient.associate).toHaveBeenCalledWith(
        'accounts', VALID_ID, 'account_contacts', 'contacts', VALID_RELATED
      );
      const parsed = JSON.parse(result.content[0]!.text) as { message: string };
      expect(parsed.message).toContain('associated successfully');
    });

    it('throws ZodError when id is not a valid UUID', async () => {
      await expect(
        handleRelationTool(
          'dataverse_associate',
          {
            entitySetName: 'accounts',
            id: 'not-a-guid',
            relationshipName: 'account_contacts',
            relatedEntitySetName: 'contacts',
            relatedId: VALID_RELATED,
          },
          client()
        )
      ).rejects.toThrow();

      expect(mockClient.associate).not.toHaveBeenCalled();
    });

    it('throws ZodError when relatedId is not a valid UUID', async () => {
      await expect(
        handleRelationTool(
          'dataverse_associate',
          {
            entitySetName: 'accounts',
            id: VALID_ID,
            relationshipName: 'account_contacts',
            relatedEntitySetName: 'contacts',
            relatedId: 'bad-id',
          },
          client()
        )
      ).rejects.toThrow();
    });

    it('throws ZodError when entitySetName is empty', async () => {
      await expect(
        handleRelationTool(
          'dataverse_associate',
          {
            entitySetName: '',
            id: VALID_ID,
            relationshipName: 'account_contacts',
            relatedEntitySetName: 'contacts',
            relatedId: VALID_RELATED,
          },
          client()
        )
      ).rejects.toThrow();
    });

    it('throws ZodError when relationshipName is missing', async () => {
      await expect(
        handleRelationTool(
          'dataverse_associate',
          {
            entitySetName: 'accounts',
            id: VALID_ID,
            relatedEntitySetName: 'contacts',
            relatedId: VALID_RELATED,
          },
          client()
        )
      ).rejects.toThrow();
    });
  });

  // ── dataverse_disassociate ────────────────────────────────────────────────

  describe('dataverse_disassociate', () => {
    it('calls client.disassociate with correct arguments and returns success message', async () => {
      mockClient.disassociate!.mockResolvedValue(undefined);

      const result = await handleRelationTool(
        'dataverse_disassociate',
        {
          entitySetName: 'accounts',
          id: VALID_ID,
          relationshipName: 'account_contacts',
          relatedId: VALID_RELATED,
        },
        client()
      );

      expect(mockClient.disassociate).toHaveBeenCalledWith(
        'accounts', VALID_ID, 'account_contacts', VALID_RELATED, undefined
      );
      const parsed = JSON.parse(result.content[0]!.text) as { message: string };
      expect(parsed.message).toContain('disassociated successfully');
    });

    it('calls client.disassociate without relatedId (optional for 1:N)', async () => {
      mockClient.disassociate!.mockResolvedValue(undefined);

      const result = await handleRelationTool(
        'dataverse_disassociate',
        {
          entitySetName: 'accounts',
          id: VALID_ID,
          relationshipName: 'account_contacts',
        },
        client()
      );

      expect(mockClient.disassociate).toHaveBeenCalledWith(
        'accounts', VALID_ID, 'account_contacts', undefined, undefined
      );
      expect(result.content[0]!.text).toContain('disassociated successfully');
    });

    it('disassociate uses relatedEntitySetName in $id URL, not source entitySetName', async () => {
      mockClient.disassociate!.mockResolvedValue(undefined);

      await handleRelationTool(
        'dataverse_disassociate',
        {
          entitySetName: 'accounts',
          id: VALID_ID,
          relationshipName: 'account_contacts',
          relatedEntitySetName: 'contacts',
          relatedId: VALID_RELATED,
        },
        client()
      );

      const callArgs = mockClient.disassociate!.mock.calls[0]!;
      expect(callArgs[4]).toBe('contacts');     // relatedEntitySetName passed correctly
      expect(callArgs[4]).not.toBe('accounts'); // NOT the source entity set name
      expect(mockClient.disassociate).toHaveBeenCalledWith(
        'accounts', VALID_ID, 'account_contacts', VALID_RELATED, 'contacts'
      );
    });

    it('throws ZodError when id is not a valid UUID', async () => {
      await expect(
        handleRelationTool(
          'dataverse_disassociate',
          {
            entitySetName: 'accounts',
            id: 'not-a-guid',
            relationshipName: 'account_contacts',
          },
          client()
        )
      ).rejects.toThrow();
    });

    it('throws ZodError when relationshipName is missing', async () => {
      await expect(
        handleRelationTool(
          'dataverse_disassociate',
          {
            entitySetName: 'accounts',
            id: VALID_ID,
          },
          client()
        )
      ).rejects.toThrow();
    });
  });

  // ── unknown tool ──────────────────────────────────────────────────────────

  it('throws on unknown tool name', async () => {
    await expect(
      handleRelationTool('dataverse_unknown', {}, client())
    ).rejects.toThrow('Unknown relation tool');
  });
});
