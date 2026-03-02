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

### Authentication Methods

| Item | Status |
|:-----|:-------|
| **Azure AD app registration** (Client Credentials) — service-to-service, CI/CD, unattended scenarios | 🔜 Planned |
| **Managed Identity** — zero-secret auth for Azure-hosted deployments (App Service, Container Apps, VM) | 🔜 Planned |
| `authMethod` config option (`"device-code"` / `"client-credentials"` / `"managed-identity"`) | 🔜 Planned |

**Why it matters:** HTTP transport unlocks remote servers, shared team instances, and integration with orchestrators that can't spawn stdio processes. Schema consistency reduces AI agent confusion and improves first-call success rates. New auth methods enable enterprise and CI/CD scenarios without any user interaction.

---

## v0.5 — MCP Prompts
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

**Design:** YAML-driven prompts for easy community contributions. Each prompt includes step sequences, variable bindings, and expected output structure.

**Why it matters:** Full MCP spec coverage (tools + resources + prompts) — a first for any Dataverse MCP server.

---

## Beyond v0.5

Ideas under consideration for future releases:

- **On-Behalf-Of auth (OBO)** — multi-tenant, per-user authentication via Entra ID for enterprise deployment
- **Streaming queries** — SSE-based streaming for large dataset retrieval
- **Real-time subscriptions** — Dataverse webhook integration for push notifications

---

## Feature Requests

Have an idea? [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label.
