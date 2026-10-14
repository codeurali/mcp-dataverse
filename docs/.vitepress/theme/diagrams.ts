export interface Participant { id: string; label: string; sub?: string }
export type Step =
  | { from: string; to: string; text: string; reply?: boolean }
  | { note: string; over: [string, string] | [string] }

export interface SequenceData { participants: Participant[]; steps: Step[] }

export const sequences: Record<string, SequenceData> = {
  'hosted-auth': {
    participants: [
      { id: 'client', label: 'MCP client', sub: 'VS Code, Claude' },
      { id: 'server', label: 'MCP server', sub: 'App Service' },
      { id: 'entra', label: 'Entra ID' },
      { id: 'dv', label: 'Dataverse' },
    ],
    steps: [
      { from: 'client', to: 'server', text: 'GET /mcp (no token)' },
      { from: 'server', to: 'client', text: '401 + metadata URL', reply: true },
      { from: 'client', to: 'server', text: 'Fetch resource metadata' },
      { from: 'server', to: 'client', text: 'Auth server + scopes', reply: true },
      { note: 'Silent SSO or interactive browser sign-in', over: ['client', 'entra'] },
      { from: 'client', to: 'entra', text: 'PKCE auth request, scope DataverseAccess' },
      { from: 'entra', to: 'client', text: 'Access token (aud = client ID)', reply: true },
      { from: 'client', to: 'server', text: 'POST /mcp + Bearer token' },
      { note: 'Verify JWT: signature, aud, scp, exp', over: ['server'] },
      { from: 'server', to: 'entra', text: 'Token via Managed Identity' },
      { from: 'entra', to: 'server', text: 'Dataverse access token', reply: true },
      { from: 'server', to: 'dv', text: 'API call' },
      { from: 'dv', to: 'server', text: 'Data', reply: true },
      { from: 'server', to: 'client', text: 'MCP tool result', reply: true },
    ],
  },
}
