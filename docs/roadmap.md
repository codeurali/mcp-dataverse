---
layout: default
title: Roadmap
nav_order: 6
permalink: /roadmap
---

# Roadmap

The MCP Dataverse project follows semantic versioning and ships incremental improvements between milestones. Here's what's coming.

---

## v0.4 — Streamable HTTP + Schema Consistency
{: .d-inline-block }

Next
{: .label .label-green }

**Goal:** First-class HTTP/SSE support for multi-client and remote deployment scenarios, and a hardened, uniform tool schema across all 63 tools.

The foundation already exists — `StreamableHTTPServerTransport` is implemented and functional (`npx mcp-dataverse --transport http`). This milestone polishes it for production and resolves the schema inconsistencies identified during 8 live testing sessions.

### HTTP Transport

| Item | Status |
|:-----|:-------|
| `StreamableHTTPServerTransport` integration | ✅ Done |
| `enableJsonResponse` toggle for non-streaming clients | 🔜 Planned |
| Authentication over HTTP (session tokens) | 🔜 Planned |
| Documentation & multi-client HTTP examples | 🔜 Planned |

### Schema Consistency

| Item | Status |
|:-----|:-------|
| Uniform parameter naming across all tools (camelCase convention) | 🔜 Planned |
| `confirm` parameter documented consistently on all destructive tools | 🔜 Planned |
| `suggest_tools` no longer exposes non-callable tools | 🔜 Planned |
| `errorCategory` field in error responses (`ENV_LIMITATION` / `PERMISSIONS` / `SCHEMA_MISMATCH`) | 🔜 Planned |
| Preflight checks for environment prerequisites (HasNotes, Change Tracking, Alternate Keys) | 🔜 Planned |
| `dataverse_search` — actionable error when Relevance Search is disabled | 🔜 Planned |

**Why it matters:** HTTP transport unlocks remote servers, shared team instances, and integration with orchestrators that can't spawn stdio processes. Schema consistency reduces AI agent confusion and improves first-call success rates.

---

## v0.5 — MCP Resources
{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Expose Dataverse schema and metadata as browsable MCP Resources.

The resource provider infrastructure exists with 4 resources already registered:

| Resource | Status |
|:---------|:-------|
| `dataverse://tables` — list of environment tables | ✅ Done |
| `dataverse://instructions` — usage guide for AI agents | ✅ Done |
| `dataverse://schema-template` — schema exploration guide | ✅ Done |
| `dataverse://relationships-template` — relationship guide | ✅ Done |
| `dataverse://option-sets` — global option sets | 🔜 Planned |
| `dataverse://solutions` — solution inventory | 🔜 Planned |
| `dataverse://views/{table}` — saved views per table | 🔜 Planned |

**Why it matters:** Resources let AI agents browse context before tool calls — reducing hallucination and improving first-call accuracy.

---

## v0.6 — MCP Prompts
{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Pre-built prompt templates for common Dataverse workflows.

Structured prompt templates that AI agents can invoke for guided, multi-step tasks:

| Prompt | Description |
|:-------|:------------|
| `audit_entity` | Comprehensive entity audit (schema, records, plugins, dependencies) |
| `schema_review` | Review table design for best practices |
| `find_orphan_records` | Detect records with broken lookup references |
| `solution_health` | Analyze solution composition and dependencies |
| `plugin_step_analysis` | Audit plugin registrations and execution pipeline |
| `data_migration_plan` | Generate a migration checklist for a set of tables |

**Design:** YAML-driven prompts for easy community contributions. Each prompt includes step sequences, variable bindings, and expected output structure.

**Why it matters:** Full MCP spec coverage (tools + resources + prompts) — a first for any Dataverse MCP server.

---

## v1.0 — On-Behalf-Of Authentication (OBO)
{: .d-inline-block }

Future
{: .label .label-purple }

**Goal:** Multi-tenant, per-user authentication via Microsoft Entra ID.

The current device code flow works for single-user local development. OBO enables enterprise deployment:

| Item | Description |
|:-----|:------------|
| **Entra ID app registration** | Confidential client with Dataverse API permissions |
| **Token exchange** | OBO flow — exchange user's access token for a Dataverse-scoped token |
| **Per-user isolation** | Each HTTP session uses the caller's identity and permissions |
| **RBAC enforcement** | Dataverse security roles respected per-user, not per-server |
| **Security audit** | Full review of token handling, storage, and logging |

**Prerequisites:** Requires HTTP transport (v0.4) as the foundation.

**Why it matters:** OBO is the enterprise unlock — it's what separates a dev tool from a production-grade platform. Organizations can deploy a single MCP Dataverse server and let each user authenticate with their own identity, respecting existing Dataverse security roles.

---

## Beyond v1.0

Ideas under consideration for future releases:

- **Streaming queries** — SSE-based streaming for large dataset retrieval
- **Real-time subscriptions** — Dataverse webhook integration for push notifications
- **Azure AI Search integration** — hybrid search across Dataverse + AI Search indexes
- **PCF component scaffolding** — generate Power Apps component framework projects from schema

---

## Contributing to the Roadmap

Have a feature request or want to contribute?

- [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label
- See the [Community]({{ site.baseurl }}/community) page for how to get involved
