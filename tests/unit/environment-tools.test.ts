import { handleEnvironmentTool, environmentTools } from '../../src/tools/environment.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('environment tool definitions', () => {
  it('exports dataverse_get_environment_variable and dataverse_set_environment_variable', () => {
    const names = environmentTools.map(t => t.name);
    expect(names).toContain('dataverse_get_environment_variable');
    expect(names).toContain('dataverse_set_environment_variable');
  });
});

// ─── shared mock setup ────────────────────────────────────────────────────

function buildClient(overrides: Partial<Record<string, jest.Mock>> = {}): DataverseAdvancedClient {
  return {
    query: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    ...overrides,
  } as unknown as DataverseAdvancedClient;
}

const DEFINITION_RECORD = {
  environmentvariabledefinitionid: 'def-001',
  schemaname: 'new_MyFeatureFlag',
  displayname: 'My Feature Flag',
  description: 'Controls feature X',
  type: 100000002,      // Boolean
  defaultvalue: 'false',
  isrequired: false,
};

// ─── dataverse_get_environment_variable ───────────────────────────────────

describe('dataverse_get_environment_variable', () => {
  it('returns effectiveValue as currentValue when override exists', async () => {
    const client = buildClient({
      query: jest.fn()
        .mockResolvedValueOnce({ value: [DEFINITION_RECORD] })
        .mockResolvedValueOnce({
          value: [{ environmentvariablevalueid: 'val-001', value: 'true' }],
        }),
    });

    const result = await handleEnvironmentTool(
      'dataverse_get_environment_variable',
      { schemaName: 'new_MyFeatureFlag' },
      client
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      schemaName: string;
      typeName: string;
      defaultValue: string;
      currentValue: string;
      effectiveValue: string;
      valueId: string;
    };

    expect(parsed.schemaName).toBe('new_MyFeatureFlag');
    expect(parsed.typeName).toBe('Boolean');
    expect(parsed.defaultValue).toBe('false');
    expect(parsed.currentValue).toBe('true');
    expect(parsed.effectiveValue).toBe('true');
    expect(parsed.valueId).toBe('val-001');
  });

  it('falls back to defaultValue when no override exists', async () => {
    const client = buildClient({
      query: jest.fn()
        .mockResolvedValueOnce({ value: [DEFINITION_RECORD] })
        .mockResolvedValueOnce({ value: [] }),
    });

    const result = await handleEnvironmentTool(
      'dataverse_get_environment_variable',
      { schemaName: 'new_MyFeatureFlag' },
      client
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      currentValue: string | null;
      effectiveValue: string;
    };

    expect(parsed.currentValue).toBeNull();
    expect(parsed.effectiveValue).toBe('false');
  });

  it('throws if environment variable definition not found', async () => {
    const client = buildClient({
      query: jest.fn().mockResolvedValueOnce({ value: [] }),
    });

    await expect(
      handleEnvironmentTool(
        'dataverse_get_environment_variable',
        { schemaName: 'new_NonExistent' },
        client
      )
    ).rejects.toThrow("Environment variable 'new_NonExistent' not found");
  });

  it('throws ZodError when schemaName is empty', async () => {
    const client = buildClient();

    await expect(
      handleEnvironmentTool(
        'dataverse_get_environment_variable',
        { schemaName: '' },
        client
      )
    ).rejects.toThrow();
  });

  it('queries environmentvariabledefinitions with correct schemaname filter', async () => {
    const queryMock = jest.fn()
      .mockResolvedValueOnce({ value: [DEFINITION_RECORD] })
      .mockResolvedValueOnce({ value: [] });

    const client = buildClient({ query: queryMock });

    await handleEnvironmentTool(
      'dataverse_get_environment_variable',
      { schemaName: 'new_MyFeatureFlag' },
      client
    );

    const firstCall = queryMock.mock.calls[0];
    expect(firstCall![0]).toBe('environmentvariabledefinitions');
    expect(firstCall![1].filter).toContain("schemaname eq 'new_MyFeatureFlag'");
  });

  it('maps all type codes to their names', async () => {
    const typeTests: Array<[number, string]> = [
      [100000000, 'String'],
      [100000001, 'Number'],
      [100000002, 'Boolean'],
      [100000003, 'JSON'],
      [100000004, 'DataSource'],
    ];

    for (const [typeCode, expectedName] of typeTests) {
      const defRecord = { ...DEFINITION_RECORD, type: typeCode };
      const queryMock = jest.fn()
        .mockResolvedValueOnce({ value: [defRecord] })
        .mockResolvedValueOnce({ value: [] });

      const client = buildClient({ query: queryMock });

      const result = await handleEnvironmentTool(
        'dataverse_get_environment_variable',
        { schemaName: 'new_MyFeatureFlag' },
        client
      );

      const parsed = JSON.parse(result.content[0]!.text) as { typeName: string };
      expect(parsed.typeName).toBe(expectedName);
    }
  });
});

// ─── dataverse_set_environment_variable ───────────────────────────────────

describe('dataverse_set_environment_variable', () => {
  it('updates an existing value record', async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined);
    const client = buildClient({
      query: jest.fn()
        .mockResolvedValueOnce({ value: [DEFINITION_RECORD] })
        .mockResolvedValueOnce({
          value: [{ environmentvariablevalueid: 'val-001', value: 'false' }],
        }),
      updateRecord: updateMock,
    });

    const result = await handleEnvironmentTool(
      'dataverse_set_environment_variable',
      { schemaName: 'new_MyFeatureFlag', value: 'true' },
      client
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      operation: string;
      valueId: string;
      value: string;
    };

    expect(parsed.operation).toBe('updated');
    expect(parsed.valueId).toBe('val-001');
    expect(parsed.value).toBe('true');
    expect(updateMock).toHaveBeenCalledWith('environmentvariablevalues', 'val-001', { value: 'true' });
  });

  it('creates a new value record when none exists', async () => {
    const createMock = jest.fn().mockResolvedValue('new-val-id');
    const client = buildClient({
      query: jest.fn()
        .mockResolvedValueOnce({ value: [DEFINITION_RECORD] })
        .mockResolvedValueOnce({ value: [] }),
      createRecord: createMock,
    });

    const result = await handleEnvironmentTool(
      'dataverse_set_environment_variable',
      { schemaName: 'new_MyFeatureFlag', value: 'true' },
      client
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      operation: string;
      valueId: string;
    };

    expect(parsed.operation).toBe('created');
    expect(parsed.valueId).toBe('new-val-id');
    expect(createMock).toHaveBeenCalledWith(
      'environmentvariablevalues',
      expect.objectContaining({
        value: 'true',
        'EnvironmentVariableDefinitionId@odata.bind': expect.stringContaining('def-001'),
      })
    );
  });

  it('throws if environment variable definition not found', async () => {
    const client = buildClient({
      query: jest.fn().mockResolvedValueOnce({ value: [] }),
    });

    await expect(
      handleEnvironmentTool(
        'dataverse_set_environment_variable',
        { schemaName: 'new_Missing', value: 'x' },
        client
      )
    ).rejects.toThrow("Environment variable 'new_Missing' not found");
  });

  it('throws ZodError when value is missing', async () => {
    const client = buildClient();

    await expect(
      handleEnvironmentTool(
        'dataverse_set_environment_variable',
        { schemaName: 'new_MyFeatureFlag' },
        client
      )
    ).rejects.toThrow();
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────

describe('handleEnvironmentTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const client = buildClient();
    await expect(
      handleEnvironmentTool('dataverse_unknown', {}, client)
    ).rejects.toThrow('Unknown environment tool');
  });
});
