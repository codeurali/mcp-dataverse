# MCP Dataverse

<div align="center">

<img src="assets/logo.webp" alt="MCP Dataverse" width="180" />

**The most complete MCP server for Microsoft Dataverse.**

79 tools · 4 resources · 10 guided workflows · Three auth modes

[![npm](https://img.shields.io/npm/v/mcp-dataverse)](https://www.npmjs.com/package/mcp-dataverse)
[![npm downloads](https://img.shields.io/npm/dm/mcp-dataverse)](https://www.npmjs.com/package/mcp-dataverse)
[![CI](https://github.com/codeurali/mcp-dataverse/actions/workflows/ci.yml/badge.svg)](https://github.com/codeurali/mcp-dataverse/actions/workflows/ci.yml)
[![Node 20+](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**[→ Full Documentation](https://codeurali.github.io/mcp-dataverse)**

</div>

---

<div align="center">
<video src="assets/demo.mp4" controls poster="assets/demo-thumbnail.jpg" width="800">
  <a href="assets/demo.mp4"><img src="assets/demo-thumbnail.jpg" alt="▶ Watch MCP Dataverse in action — 60s demo" width="800" /></a>
</video>
</div>

---

## Why MCP Dataverse?

AI agents hallucinate schema, guess column names, and build broken OData queries. This server gives them **real-time access** to your Dataverse environment — schema, records, metadata, solutions — through the [Model Context Protocol](https://modelcontextprotocol.io).

- **Three auth modes** — device code (local), client credentials (CI/CD), managed identity (Azure-hosted)
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

> Requires Node.js 20+. For other clients (Claude, Cursor, Windsurf…) see [Multi-Client Setup](https://codeurali.github.io/mcp-dataverse/multi-client-setup).

## Update

```bash
npx mcp-dataverse update
```

No re-config required — just checks your existing setup and shows what changed. `npx` auto-fetches the latest version on each run, so simply restarting your MCP client is enough to get the new tools.

---

## Authentication

Three modes — choose based on where the server runs:

| Mode                      | When to use                                                                                       |
| :------------------------ | :------------------------------------------------------------------------------------------------ |
| **Device Code** (default) | Local development — interactive Microsoft login, token cached on disk                             |
| **Client Credentials**    | Unattended: CI/CD, Docker, Azure services — `authMethod: "client-credentials"` + App Registration |
| **Managed Identity**      | Azure-hosted (App Service, Container Apps) — zero secrets, `authMethod: "managed-identity"`       |

**Device code quick start:** authentication triggers on the first tool call.

1. Open `View → Output → MCP` — a sign-in code appears
2. Go to `https://microsoft.com/devicelogin`, enter the code, sign in with your work account
3. Token is cached encrypted — all future starts are silent

For client credentials and managed identity setup, see [Authentication docs](https://codeurali.github.io/mcp-dataverse/authentication).

---

## Capabilities

| Category                | Count | Description                                                           |
| ----------------------- | ----- | --------------------------------------------------------------------- |
| **Metadata**            | 9     | Tables, schema, relationships, option sets, entity keys               |
| **Query**               | 3     | OData, FetchXML, paginated retrieval                                  |
| **CRUD**                | 6     | Get, create, update, delete, upsert, assign                           |
| **Relations**           | 4     | Associate, associate bulk, disassociate, query associations           |
| **Actions & Functions** | 6     | Bound/unbound Dataverse actions and functions                         |
| **Batch**               | 1     | Up to 1000 operations atomically                                      |
| **Solutions**           | 2     | Publish customizations, create sitemap                                |
| **Search**              | 1     | Full-text Relevance Search                                            |
| **Users & Teams**       | 4     | Users, roles, teams, role assignment                                  |
| **RBAC**                | 7     | Role privileges: list, assign, remove, add, replace, get, team        |
| **Files**               | 2     | Upload/download file and image columns                                |
| **Audit & Trace**       | 3     | Audit log, plugin trace logs, workflow trace logs                     |
| **Annotations**         | 2     | Notes and file attachments                                            |
| **Customization**       | 4     | Custom actions, plugins, env variables, connection references         |
| **Attributes**          | 4     | Create, update, delete columns; lookup column type                    |
| **Schema (write)**      | 2     | Create custom tables and relationships                                |
| **Record Access**       | 4     | Check, grant, revoke record sharing; merge records                    |
| **Assistance**          | 2     | Tool router, tool tags                                                |
| **+ more**              | …     | Delta sync, impersonation, views, business units, duplicate detection |

[→ Full Capabilities Reference](https://codeurali.github.io/mcp-dataverse/capabilities)

---

## HTTP Transport

Run as an HTTP server for multi-client use:

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 MCP_HTTP_SECRET=mysecret node dist/server.js
```

Connect using VS Code / Copilot with:

```json
{
  "servers": {
    "dataverse": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer mysecret"
      }
    }
  }
}
```

---

## Troubleshooting

| Symptom                            | Fix                                                                |
| ---------------------------------- | ------------------------------------------------------------------ |
| No sign-in prompt                  | Open **View → Output → MCP** — the device code is displayed there  |
| `No MSAL accounts found`           | Run `npx mcp-dataverse-auth` then restart the server               |
| `Authentication timed out`         | Restart the MCP server — a fresh code is generated automatically   |
| Server not appearing in Agent mode | Run `npx mcp-dataverse install` or `npx mcp-dataverse doctor`      |
| HTTP errors                        | Run `npx mcp-dataverse doctor` to diagnose config and connectivity |

---

## Performance Tip

MCP Dataverse is designed to be comprehensive, but most AI models work best with fewer tools in context. **Deselect the tools you don't need** in your client's tool picker (e.g. VS Code Chat panel) to keep the agent focused and responsive.

---

## Roadmap

| Version  | Feature                                                           | Status      |
| -------- | ----------------------------------------------------------------- | ----------- |
| **v0.4** | HTTP transport + attribute management + schema consistency        | ✅ Released |
| **v0.5** | Enterprise auth (Client Credentials, Managed Identity, Entra JWT) | ✅ Released |
| **v0.6** | MCP Prompts (5 templates) + MCP Resources (4)                     | ✅ Released |
| **v0.7** | Schema write (create table/relationship) + Record Access (share, merge) | ✅ Released (v0.7.5) |

[→ Full Roadmap](https://codeurali.github.io/mcp-dataverse/roadmap)

---

## License

[MIT](LICENSE) © [Ali Taggaz](https://www.linkedin.com/in/alitaggaz/)
