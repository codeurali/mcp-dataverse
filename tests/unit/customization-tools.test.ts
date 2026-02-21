import { handleCustomizationTool, customizationTools } from '../../src/tools/customization.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('customization tool definitions', () => {
  it('exports dataverse_list_custom_actions and dataverse_list_plugin_steps', () => {
    const names = customizationTools.map(t => t.name);
    expect(names).toContain('dataverse_list_custom_actions');
    expect(names).toContain('dataverse_list_plugin_steps');
  });
});

// ─── shared mock setup ────────────────────────────────────────────────────

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

// ─── dataverse_list_custom_actions ────────────────────────────────────────

describe('dataverse_list_custom_actions', () => {
  it('returns mapped messages with defaults', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      value: [
        {
          sdkmessageid: 'msg-001',
          name: 'new_ProcessOrder',
          categoryname: 'Custom',
          isprivate: false,
          isreadonly: false,
          isvalidforexecuteasync: true,
        },
      ],
    });

    const result = await handleCustomizationTool(
      'dataverse_list_custom_actions',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      total: number;
      messages: Array<{
        id: string;
        name: string;
        category: string;
        isPrivate: boolean;
        isReadOnly: boolean;
        asyncSupported: boolean;
      }>;
    };

    expect(parsed.total).toBe(1);
    expect(parsed.messages[0]!.id).toBe('msg-001');
    expect(parsed.messages[0]!.name).toBe('new_ProcessOrder');
    expect(parsed.messages[0]!.asyncSupported).toBe(true);
  });

  it('passes isprivate eq false filter always', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool('dataverse_list_custom_actions', {}, buildClient(mockQuery));

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain('isprivate eq false');
  });

  it('adds contains(name,...) filter when nameFilter provided', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool(
      'dataverse_list_custom_actions',
      { nameFilter: 'Process' },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("contains(name,'Process')");
  });

  it('escapes single quotes in nameFilter to prevent OData injection', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool(
      'dataverse_list_custom_actions',
      { nameFilter: "it's" },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("contains(name,'it''s')");
  });

  it('defaults top to 100 when not supplied', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool('dataverse_list_custom_actions', {}, buildClient(mockQuery));

    expect(mockQuery.mock.calls[0]![1].top).toBe(100);
  });

  it('respects top override up to max 500', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool(
      'dataverse_list_custom_actions',
      { top: 250 },
      buildClient(mockQuery)
    );

    expect(mockQuery.mock.calls[0]![1].top).toBe(250);
  });

  it('rejects top > 500 with ZodError', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await expect(
      handleCustomizationTool(
        'dataverse_list_custom_actions',
        { top: 1000 },
        buildClient(mockQuery)
      )
    ).rejects.toThrow();
  });
});

// ─── dataverse_list_plugin_steps ─────────────────────────────────────────

describe('dataverse_list_plugin_steps', () => {
  const sampleStep = {
    sdkmessageprocessingstepid: 'step-001',
    name: 'AccountValidation: Create of account',
    stage: 20,
    mode: 0,
    rank: 1,
    statecode: 0,
    filteringattributes: null,
    asyncautodelete: false,
    sdkmessageid_sdkmessage: { name: 'Create' },
    plugintypeid: { name: 'AccountPlugin', assemblyname: 'MyOrg.Plugins' },
    sdkmessagefilterid: { primaryobjecttypecode: 'account' },
  };

  it('returns mapped steps with stage/mode names', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [sampleStep] });

    const result = await handleCustomizationTool(
      'dataverse_list_plugin_steps',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      total: number;
      steps: Array<{
        id: string;
        message: string;
        entity: string;
        assembly: string;
        stageName: string;
        modeName: string;
        isActive: boolean;
      }>;
    };

    expect(parsed.total).toBe(1);
    expect(parsed.steps[0]!.id).toBe('step-001');
    expect(parsed.steps[0]!.message).toBe('Create');
    expect(parsed.steps[0]!.entity).toBe('account');
    expect(parsed.steps[0]!.assembly).toBe('MyOrg.Plugins');
    expect(parsed.steps[0]!.stageName).toBe('Pre-operation');
    expect(parsed.steps[0]!.modeName).toBe('Synchronous');
    expect(parsed.steps[0]!.isActive).toBe(true);
  });

  it('adds statecode eq 0 filter when activeOnly is true (default)', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool('dataverse_list_plugin_steps', {}, buildClient(mockQuery));

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toBe('statecode eq 0');
  });

  it('omits statecode filter when activeOnly is false', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleCustomizationTool(
      'dataverse_list_plugin_steps',
      { activeOnly: false },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string | undefined;
    expect(calledFilter).toBeUndefined();
  });

  it('filters client-side by entityLogicalName', async () => {
    const contactStep = { ...sampleStep, sdkmessagefilterid: { primaryobjecttypecode: 'contact' } };
    const mockQuery = jest.fn().mockResolvedValue({ value: [sampleStep, contactStep] });

    const result = await handleCustomizationTool(
      'dataverse_list_plugin_steps',
      { entityLogicalName: 'account' },
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as { total: number };
    expect(parsed.total).toBe(1);
  });

  it('handles null navigation properties gracefully', async () => {
    const sparseStep = {
      sdkmessageprocessingstepid: 'step-sparse',
      name: 'OrphanStep',
      stage: 40,
      mode: 1,
      rank: 1,
      statecode: 0,
      filteringattributes: null,
      asyncautodelete: false,
      sdkmessageid_sdkmessage: null,
      plugintypeid: null,
      sdkmessagefilterid: null,
    };
    const mockQuery = jest.fn().mockResolvedValue({ value: [sparseStep] });

    const result = await handleCustomizationTool(
      'dataverse_list_plugin_steps',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      steps: Array<{ message: string; entity: string; assembly: string }>;
    };
    expect(parsed.steps[0]!.message).toBe('');
    expect(parsed.steps[0]!.entity).toBe('');
    expect(parsed.steps[0]!.assembly).toBe('');
  });

  it('maps stage 40 to Post-operation', async () => {
    const postOpStep = { ...sampleStep, stage: 40 };
    const mockQuery = jest.fn().mockResolvedValue({ value: [postOpStep] });

    const result = await handleCustomizationTool(
      'dataverse_list_plugin_steps',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      steps: Array<{ stageName: string }>;
    };
    expect(parsed.steps[0]!.stageName).toBe('Post-operation');
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────

describe('handleCustomizationTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mockQuery = jest.fn();
    await expect(
      handleCustomizationTool('dataverse_unknown', {}, buildClient(mockQuery))
    ).rejects.toThrow('Unknown customization tool');
  });
});
