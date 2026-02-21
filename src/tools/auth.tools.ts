import type { DataverseClient } from '../dataverse/dataverse-client.js';

export const authTools = [
  {
    name: 'dataverse_whoami',
    description: 'Returns the current authenticated user context from Dataverse WhoAmI: userId, businessUnitId, organizationId, organizationName, and environmentUrl. Use this to verify authentication is working, retrieve the current user context, or obtain IDs needed for subsequent operations.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

export async function handleAuthTool(
  name: string,
  _args: unknown,
  client: DataverseClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  if (name === 'dataverse_whoami') {
    const result = await client.whoAmI();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          userId: result.UserId,
          businessUnitId: result.BusinessUnitId,
          organizationId: result.OrganizationId,
          organizationName: result.OrganizationName,
          environmentUrl: result.EnvironmentUrl,
        }, null, 2),
      }],
    };
  }
  throw new Error(`Unknown auth tool: ${name}`);
}
