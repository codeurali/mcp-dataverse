# MCP Dataverse

<div align="center">

<img src="assets/logo.webp" alt="MCP Dataverse" width="180" />

**The most complete MCP server for Microsoft Dataverse.**

54 tools · 4 resources · 10 guided workflows · Zero config auth

[![npm](https://img.shields.io/npm/v/mcp-dataverse)](https://www.npmjs.com/package/mcp-dataverse)
[![npm downloads](https://img.shields.io/npm/dm/mcp-dataverse)](https://www.npmjs.com/package/mcp-dataverse)
[![Node 20+](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**[→ Full Documentation](https://codeurali.github.io/mcp-dataverse-docs)**

</div>

---

## Why MCP Dataverse?

AI agents hallucinate schema, guess column names, and build broken OData queries. This server gives them **real-time access** to your Dataverse environment — schema, records, metadata, solutions — through the [Model Context Protocol](https://modelcontextprotocol.io).

- **No Azure AD app registration** — device code flow, zero pre-configuration
- **Works with any MCP client** — VS Code, Claude, Cursor, Windsurf, Gemini, Codex CLI
- **Atomic tools** — each tool does one thing well; the AI picks the right one
- **Structured outputs** — every response returns `{summary, data, suggestions}`
- **Guardrails** — destructive operations require explicit confirmation
- **Encrypted tokens** — AES-256-GCM cached credentials, never logged

---

## Install

```bash
npx mcp-dataverse install
```

The interactive wizard configures your environment, registers the server in VS Code, and authenticates your Microsoft account in under 2 minutes.

> Requires Node.js 20+. For other clients (Claude, Cursor, Windsurf…) see [Multi-Client Setup](https://codeurali.github.io/mcp-dataverse-docs/multi-client-setup).

---

## Authentication

**No PAC CLI, no app registration, no client secret.** Uses Microsoft's device code flow (MSAL):

1. **First tool call** → a sign-in code appears in the MCP Output panel (`View → Output → MCP`)
2. Open `https://microsoft.com/devicelogin` → enter the code → sign in with your work account
3. **Done.** Token is cached encrypted — all future starts are silent

Re-authenticate after ~90 days of inactivity: `npx mcp-dataverse-auth`

---

## Capabilities

| Category | Count | Description |
|----------|-------|-------------|
| **Metadata** | 8 | Tables, schema, relationships, option sets, entity keys |
| **Query** | 3 | OData, FetchXML, paginated retrieval |
| **CRUD** | 6 | Get, create, update, delete, upsert, assign |
| **Actions & Functions** | 6 | Bound/unbound Dataverse actions and functions |
| **Batch** | 1 | Up to 1000 operations atomically |
| **Solutions** | 3 | List solutions, components, publish customizations |
| **Search** | 1 | Full-text Relevance Search |
| **Users & Teams** | 3 | Users, roles, teams |
| **Files** | 2 | Upload/download file and image columns |
| **+ more** | … | Audit, trace logs, delta tracking, impersonation, annotations… |
| **Assistance** | 4 | Tool router, workflow guide |

[→ Full Capabilities Reference](https://codeurali.github.io/mcp-dataverse-docs/capabilities)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No sign-in prompt | Open **View → Output → MCP** — the device code is displayed there |
| `No MSAL accounts found` | Run `npx mcp-dataverse-auth` then restart the server |
| `Authentication timed out` | 5-minute window expired — restart MCP for a new code |
| Server not appearing in Agent mode | Run `npx mcp-dataverse install` or `npx mcp-dataverse doctor` |
| HTTP errors | Run `npx mcp-dataverse doctor` to diagnose config and connectivity |

---

## License

[MIT](LICENSE) © [Ali Taggaz](https://www.linkedin.com/in/alitaggaz/)
