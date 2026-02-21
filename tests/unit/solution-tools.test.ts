import { handleSolutionTool } from '../../src/tools/solution.tools.js';
import { handleMetadataTool } from '../../src/tools/metadata.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';
import type { DataverseMetadataClient } from '../../src/dataverse/dataverse-client.metadata.js';

// ── dataverse_get_entity_key (in metadata.tools) ──────────────────────────

describe('dataverse_get_entity_key', () => {
  let mockMetaClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockMetaClient = {
      listTables: jest.fn(),
      getTableMetadata: jest.fn(),
      getRelationships: jest.fn(),
      listGlobalOptionSets: jest.fn(),
      getOptionSet: jest.fn(),
      getEntityKeys: jest.fn(),
    };
  });

  const metaClient = () => mockMetaClient as unknown as DataverseMetadataClient;

  it('returns formatted key definitions for a table', async () => {
    const mockKey = {
      schemaName: 'account_uniquename',
      logicalName: 'account_uniquename',
      keyAttributes: ['accountnumber'],
      isCustomizable: true,
      indexStatus: 'Active',
    };
    mockMetaClient.getEntityKeys!.mockResolvedValue([mockKey]);

    const result = await handleMetadataTool('dataverse_get_entity_key', { tableName: 'account' }, metaClient());
    const parsed = JSON.parse(result.content[0]!.text) as {
      tableName: string;
      keys: typeof mockKey[];
      count: number;
    };

    expect(parsed.tableName).toBe('account');
    expect(parsed.count).toBe(1);
    expect(parsed.keys[0]!.schemaName).toBe('account_uniquename');
    expect(parsed.keys[0]!.keyAttributes).toEqual(['accountnumber']);
    expect(parsed.keys[0]!.indexStatus).toBe('Active');
    expect(mockMetaClient.getEntityKeys).toHaveBeenCalledWith('account');
  });

  it('throws ZodError when tableName is empty', async () => {
    await expect(
      handleMetadataTool('dataverse_get_entity_key', { tableName: '' }, metaClient())
    ).rejects.toThrow();

    expect(mockMetaClient.getEntityKeys).not.toHaveBeenCalled();
  });

  it('returns count:0 and empty keys array when table has no alternate keys', async () => {
    mockMetaClient.getEntityKeys!.mockResolvedValue([]);

    const result = await handleMetadataTool('dataverse_get_entity_key', { tableName: 'contact' }, metaClient());
    const parsed = JSON.parse(result.content[0]!.text) as { count: number; keys: unknown[] };

    expect(parsed.count).toBe(0);
    expect(parsed.keys).toHaveLength(0);
  });
});

// ── solution tools ─────────────────────────────────────────────────────────

describe('handleSolutionTool', () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      getSolutionComponents: jest.fn(),
      publishCustomizations: jest.fn(),
    };
  });

  const client = () => mockClient as unknown as DataverseAdvancedClient;

  // ── dataverse_solution_components ────────────────────────────────────────

  describe('dataverse_solution_components', () => {
    it('returns solution info and components array', async () => {
      const mockResult = {
        solutionName: 'MySolution',
        solutionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        friendlyName: 'My Solution',
        version: '1.0.0.0',
        components: [
          { componentType: 1, componentTypeName: 'Entity', objectId: '11111111-2222-3333-4444-555555555555' },
          { componentType: 97, componentTypeName: 'WebResource', objectId: '66666666-7777-8888-9999-aaaaaaaaaaaa' },
        ],
        count: 2,
      };
      mockClient.getSolutionComponents!.mockResolvedValue(mockResult);

      const result = await handleSolutionTool(
        'dataverse_solution_components',
        { solutionName: 'MySolution' },
        client()
      );
      const parsed = JSON.parse(result.content[0]!.text) as typeof mockResult;

      expect(parsed.solutionName).toBe('MySolution');
      expect(parsed.count).toBe(2);
      expect(parsed.components).toHaveLength(2);
      expect(parsed.components[0]!.componentTypeName).toBe('Entity');
      expect(mockClient.getSolutionComponents).toHaveBeenCalledWith('MySolution', undefined, 200);
    });

    it('passes componentType filter when provided', async () => {
      mockClient.getSolutionComponents!.mockResolvedValue({
        solutionName: 'MySolution',
        solutionId: 'id',
        friendlyName: 'My Solution',
        version: '1.0',
        components: [],
        count: 0,
      });

      await handleSolutionTool(
        'dataverse_solution_components',
        { solutionName: 'MySolution', componentType: 29 },
        client()
      );

      expect(mockClient.getSolutionComponents).toHaveBeenCalledWith('MySolution', 29, 200);
    });

    it('throws ZodError when solutionName is empty', async () => {
      await expect(
        handleSolutionTool('dataverse_solution_components', { solutionName: '' }, client())
      ).rejects.toThrow();

      expect(mockClient.getSolutionComponents).not.toHaveBeenCalled();
    });
  });

  // ── dataverse_publish_customizations ─────────────────────────────────────

  describe('dataverse_publish_customizations', () => {
    it('calls publishCustomizations with undefined when no components given', async () => {
      mockClient.publishCustomizations!.mockResolvedValue({
        published: true,
        message: 'All customizations published successfully',
      });

      const result = await handleSolutionTool('dataverse_publish_customizations', {}, client());
      const parsed = JSON.parse(result.content[0]!.text) as { published: boolean; message: string };

      expect(parsed.published).toBe(true);
      expect(mockClient.publishCustomizations).toHaveBeenCalledWith(undefined);
    });

    it('calls publishCustomizations with entities when specified', async () => {
      mockClient.publishCustomizations!.mockResolvedValue({
        published: true,
        message: 'Selected customizations published successfully',
      });

      await handleSolutionTool(
        'dataverse_publish_customizations',
        { components: { entities: ['account'] } },
        client()
      );

      expect(mockClient.publishCustomizations).toHaveBeenCalledWith({ entities: ['account'] });
    });

    it('calls publishCustomizations with webResources when specified', async () => {
      mockClient.publishCustomizations!.mockResolvedValue({
        published: true,
        message: 'Selected customizations published successfully',
      });

      await handleSolutionTool(
        'dataverse_publish_customizations',
        { components: { webResources: ['new_myscript'] } },
        client()
      );

      expect(mockClient.publishCustomizations).toHaveBeenCalledWith({ webResources: ['new_myscript'] });
    });
  });

  // ── unknown tool ──────────────────────────────────────────────────────────

  it('throws on unknown tool name', async () => {
    await expect(
      handleSolutionTool('dataverse_unknown', {}, client())
    ).rejects.toThrow('Unknown solution tool');
  });
});
