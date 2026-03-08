---
layout: default
title: Home
nav_order: 1
permalink: /
---

# MCP Dataverse

{: .fs-9 }

The most complete MCP server for Microsoft Dataverse.
{: .fs-6 .fw-300 }

73 tools · 4 resources · 10 guided workflows · Zero config auth
{: .fs-5 .fw-300 }

[Get Started]({{ site.baseurl }}/getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on npm](https://www.npmjs.com/package/mcp-dataverse){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Why MCP Dataverse?

AI agents hallucinate schema, guess column names, and build broken OData queries. This server gives them **real-time access** to your Dataverse environment — schema, records, metadata, solutions — through the [Model Context Protocol](https://modelcontextprotocol.io).

| Feature | Details |
|:--------|:--------|
| **No Azure AD app registration** | Device code flow — zero pre-configuration |
| **Works with any MCP client** | VS Code, Claude, Cursor, Windsurf, Gemini, Codex CLI |
| **Atomic tools** | Each tool does one thing well; the AI picks the right one |
| **Structured outputs** | Every response returns `{summary, data, suggestions}` |
| **Guardrails** | Destructive operations require explicit confirmation |
| **Encrypted tokens** | AES-256-GCM cached credentials, never logged |

---

## Quick Install

```bash
npx mcp-dataverse install
```

The interactive wizard configures your environment, registers the server in VS Code, and authenticates your Microsoft account in under 2 minutes.

Requires Node.js 20+. See [Multi-Client Setup]({{ site.baseurl }}/multi-client-setup) for Claude, Cursor, Windsurf, and more.

---

## Capabilities at a Glance

| Category | Count | Description |
|:---------|:------|:------------|
| **Metadata** | 9 | Tables, schema, relationships, option sets, entity keys, resolve entity name |
| **Query** | 3 | OData, FetchXML, paginated retrieval |
| **CRUD** | 6 | Get, create, update, delete, upsert, assign |
| **Relations** | 4 | Associate, associate bulk, disassociate, query associations |
| **Actions & Functions** | 6 | Bound/unbound Dataverse actions and functions |
| **Batch** | 1 | Up to 1 000 operations atomically |
| **Solutions** | 2 | Publish customizations, create sitemap |
| **Search** | 1 | Full-text Relevance Search |
| **Users & Teams** | 4 | Users, roles, teams, role assignment |
| **RBAC** | 7 | Role privileges: list, assign, remove, add, replace, get, team assignment |
| **Files** | 2 | Upload/download file and image columns |
| **Audit & Trace** | 3 | Audit log, plugin trace logs, workflow trace logs |
| **Annotations** | 2 | Notes and file attachments |
| **Customization** | 4 | Custom actions, plugins, env variables, connection references |
| **Workflows** | 4 | List/get workflows and guided workflow templates |
| **Assistance** | 2 | Tool router, tool tags |
| **+ more** | … | Delta tracking, impersonation, views, business units, duplicate detection, attributes |

[→ Full Capabilities Reference]({{ site.baseurl }}/capabilities)

---

## License

[MIT](https://github.com/codeurali/mcp-dataverse/blob/master/LICENSE) © [Ali Taggaz](https://www.linkedin.com/in/alitaggaz/)
