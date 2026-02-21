import { handleTraceTool, traceTools } from '../../src/tools/trace.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('trace tool definitions', () => {
  it('exports dataverse_get_plugin_trace_logs and dataverse_get_workflow_trace_logs', () => {
    const names = traceTools.map(t => t.name);
    expect(names).toContain('dataverse_get_plugin_trace_logs');
    expect(names).toContain('dataverse_get_workflow_trace_logs');
  });
});

// ─── shared mock setup ────────────────────────────────────────────────────

function buildClient(queryMock: jest.Mock): DataverseAdvancedClient {
  return { query: queryMock } as unknown as DataverseAdvancedClient;
}

// ─── dataverse_get_plugin_trace_logs ─────────────────────────────────────

describe('dataverse_get_plugin_trace_logs', () => {
  const sampleLog = {
    plugintracelogid: 'log-001',
    typename: 'MyOrg.Plugins.AccountValidation',
    messagename: 'Create',
    primaryentity: 'account',
    depth: 1,
    operationtype: 0,
    exceptiondetails: null,
    messageblock: 'Processing account...',
    createdon: '2026-02-21T10:00:00Z',
    performanceexecutionduration: 120,
    correlationid: 'corr-001',
    requestid: 'req-001',
  };

  it('returns mapped logs with correct field names', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [sampleLog] });

    const result = await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      total: number;
      logs: Array<{
        id: string;
        typeName: string;
        message: string;
        entity: string;
        durationMs: number;
        hasException: boolean;
        messageBlock: string;
        operationTypeName: string;
      }>;
    };

    expect(parsed.total).toBe(1);
    expect(parsed.logs[0]!.id).toBe('log-001');
    expect(parsed.logs[0]!.typeName).toBe('MyOrg.Plugins.AccountValidation');
    expect(parsed.logs[0]!.message).toBe('Create');
    expect(parsed.logs[0]!.entity).toBe('account');
    expect(parsed.logs[0]!.durationMs).toBe(120);
    expect(parsed.logs[0]!.hasException).toBe(false);
    expect(parsed.logs[0]!.messageBlock).toBe('Processing account...');
    expect(parsed.logs[0]!.operationTypeName).toBe('Execute');
  });

  it('marks hasException true when exceptiondetails is non-empty', async () => {
    const failedLog = { ...sampleLog, exceptiondetails: 'NullReferenceException: Object not set' };
    const mockQuery = jest.fn().mockResolvedValue({ value: [failedLog] });

    const result = await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      logs: Array<{ hasException: boolean; exceptionDetails: string }>;
    };

    expect(parsed.logs[0]!.hasException).toBe(true);
    expect(parsed.logs[0]!.exceptionDetails).toBe('NullReferenceException: Object not set');
  });

  it('adds no filter parts when no params supplied', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool('dataverse_get_plugin_trace_logs', {}, buildClient(mockQuery));

    const calledOptions = mockQuery.mock.calls[0]![1] as { filter?: string };
    expect(calledOptions.filter).toBeUndefined();
  });

  it('adds contains(typename,...) filter when pluginTypeFilter provided', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      { pluginTypeFilter: 'AccountValidation' },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("contains(typename,'AccountValidation')");
  });

  it('escapes single quotes in pluginTypeFilter', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      { pluginTypeFilter: "it's" },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("contains(typename,'it''s')");
  });

  it('adds messagename filter when messageFilter provided', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      { messageFilter: 'Update' },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("messagename eq 'Update'");
  });

  it('adds exceptiondetails ne null filter when exceptionsOnly is true', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      { exceptionsOnly: true },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain('exceptiondetails ne null');
  });

  it('combines multiple filters with and', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_plugin_trace_logs',
      { messageFilter: 'Create', entityFilter: 'account', exceptionsOnly: true },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain(' and ');
    expect(calledFilter).toContain("messagename eq 'Create'");
    expect(calledFilter).toContain("primaryentity eq 'account'");
    expect(calledFilter).toContain('exceptiondetails ne null');
  });

  it('orders by createdon desc', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool('dataverse_get_plugin_trace_logs', {}, buildClient(mockQuery));

    const calledOrderby = mockQuery.mock.calls[0]![1].orderby as string;
    expect(calledOrderby).toBe('createdon desc');
  });

  it('defaults top to 50', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool('dataverse_get_plugin_trace_logs', {}, buildClient(mockQuery));

    expect(mockQuery.mock.calls[0]![1].top).toBe(50);
  });

  it('rejects top > 200 with ZodError', async () => {
    const mockQuery = jest.fn();

    await expect(
      handleTraceTool('dataverse_get_plugin_trace_logs', { top: 500 }, buildClient(mockQuery))
    ).rejects.toThrow();
  });
});

// ─── dataverse_get_workflow_trace_logs ────────────────────────────────────

describe('dataverse_get_workflow_trace_logs', () => {
  const sampleWorkflow = {
    asyncoperationid: 'wf-001',
    name: 'Account Follow-up Workflow',
    operationtype: 10,
    statuscode: 30,
    statecode: 3,
    message: null,
    createdon: '2026-02-21T09:00:00Z',
    startedon: '2026-02-21T09:01:00Z',
    completedon: '2026-02-21T09:01:05Z',
    regardingobjecttypecode: 'account',
  };

  it('returns mapped workflow records', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [sampleWorkflow] });

    const result = await handleTraceTool(
      'dataverse_get_workflow_trace_logs',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      total: number;
      workflows: Array<{
        id: string;
        name: string;
        statusName: string;
        stateName: string;
        regardingEntityType: string;
        completedOn: string;
      }>;
    };

    expect(parsed.total).toBe(1);
    expect(parsed.workflows[0]!.id).toBe('wf-001');
    expect(parsed.workflows[0]!.name).toBe('Account Follow-up Workflow');
    expect(parsed.workflows[0]!.statusName).toBe('Succeeded');
    expect(parsed.workflows[0]!.stateName).toBe('Completed');
    expect(parsed.workflows[0]!.regardingEntityType).toBe('account');
    expect(parsed.workflows[0]!.completedOn).toBe('2026-02-21T09:01:05Z');
  });

  it('always includes operationtype eq 10 in filter', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool('dataverse_get_workflow_trace_logs', {}, buildClient(mockQuery));

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain('operationtype eq 10');
  });

  it('adds statuscode eq 31 filter when failedOnly is true', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_workflow_trace_logs',
      { failedOnly: true },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain('statuscode eq 31');
  });

  it('adds regardingobjecttypecode filter when entityFilter provided', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ value: [] });

    await handleTraceTool(
      'dataverse_get_workflow_trace_logs',
      { entityFilter: 'contact' },
      buildClient(mockQuery)
    );

    const calledFilter = mockQuery.mock.calls[0]![1].filter as string;
    expect(calledFilter).toContain("regardingobjecttypecode eq 'contact'");
  });

  it('maps statuscode 31 to Failed', async () => {
    const failedWf = { ...sampleWorkflow, statuscode: 31, message: 'Unhandled exception' };
    const mockQuery = jest.fn().mockResolvedValue({ value: [failedWf] });

    const result = await handleTraceTool(
      'dataverse_get_workflow_trace_logs',
      {},
      buildClient(mockQuery)
    );

    const parsed = JSON.parse(result.content[0]!.text) as {
      workflows: Array<{ statusName: string; errorMessage: string }>;
    };

    expect(parsed.workflows[0]!.statusName).toBe('Failed');
    expect(parsed.workflows[0]!.errorMessage).toBe('Unhandled exception');
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────

describe('handleTraceTool unknown', () => {
  it('throws on unknown tool name', async () => {
    const mockQuery = jest.fn();
    await expect(
      handleTraceTool('dataverse_unknown', {}, buildClient(mockQuery))
    ).rejects.toThrow('Unknown trace tool');
  });
});
