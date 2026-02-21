import { handleQueryTool } from '../../src/tools/query.tools.js';
import type { DataverseAdvancedClient } from '../../src/dataverse/dataverse-client-advanced.js';

describe('dataverse_execute_fetchxml handler (C-10)', () => {
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockClient = {
      executeFetchXml: jest.fn(),
      query: jest.fn(),
      queryWithPaging: jest.fn(),
    };
  });

  const dvClient = () => mockClient as unknown as DataverseAdvancedClient;

  it('uses provided entitySetName when given explicitly', async () => {
    mockClient.executeFetchXml!.mockResolvedValue({ value: [] });

    const fetchXml = `<fetch><entity name="account"><attribute name="name"/></entity></fetch>`;
    await handleQueryTool(
      'dataverse_execute_fetchxml',
      { entitySetName: 'accounts', fetchXml },
      dvClient()
    );

    expect(mockClient.executeFetchXml).toHaveBeenCalledWith('accounts', fetchXml);
  });

  it('extracts entitySetName from <entity name="..."> when entitySetName is omitted', async () => {
    mockClient.executeFetchXml!.mockResolvedValue({ value: [{ name: 'Contoso' }] });

    const fetchXml = `<fetch><entity name="account"><attribute name="name"/></entity></fetch>`;
    const result = await handleQueryTool(
      'dataverse_execute_fetchxml',
      { fetchXml },
      dvClient()
    );

    // Should have called executeFetchXml with pluralized entity name
    expect(mockClient.executeFetchXml).toHaveBeenCalledWith('accounts', fetchXml);
    expect(result.content[0]!.text).toContain('Contoso');
  });

  it('extracts entitySetName using single quotes in FetchXML <entity name=\'...\'>',  async () => {
    mockClient.executeFetchXml!.mockResolvedValue({ value: [] });

    const fetchXml = `<fetch><entity name='contact'><attribute name="fullname"/></entity></fetch>`;
    await handleQueryTool(
      'dataverse_execute_fetchxml',
      { fetchXml },
      dvClient()
    );

    expect(mockClient.executeFetchXml).toHaveBeenCalledWith('contacts', fetchXml);
  });

  it('returns isError when entitySetName is absent AND FetchXML has no <entity> element', async () => {
    const fetchXml = `<fetch><attribute name="name"/></fetch>`;
    const result = await handleQueryTool(
      'dataverse_execute_fetchxml',
      { fetchXml },
      dvClient()
    );

    const parsed = JSON.parse(result.content[0]!.text) as { isError: boolean; error: string };
    expect(parsed.isError).toBe(true);
    expect(parsed.error).toContain('entitySetName is required');
    expect(mockClient.executeFetchXml).not.toHaveBeenCalled();
  });

  it('throws ZodError when fetchXml is missing', async () => {
    await expect(
      handleQueryTool('dataverse_execute_fetchxml', {}, dvClient())
    ).rejects.toThrow();
  });

  it('throws ZodError when fetchXml is empty string', async () => {
    await expect(
      handleQueryTool('dataverse_execute_fetchxml', { fetchXml: '' }, dvClient())
    ).rejects.toThrow();
  });
});
