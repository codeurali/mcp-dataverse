---
layout: default
title: Roadmap
nav_order: 7
permalink: /roadmap
---

# Roadmap

The MCP Dataverse project follows semantic versioning and ships incremental improvements between milestones. Here's what's coming.

---

## v0.4 — Streamable HTTP + Schema Consistency

{: .d-inline-block }

Next
{: .label .label-green }

**Goal:** First-class HTTP/SSE support for multi-client and remote deployment scenarios, a hardened uniform tool schema across all 69 tools, attribute-level schema management, and fixes surfaced by the Web API audit.

The foundation already exists — `StreamableHTTPServerTransport` is implemented and functional (`npx mcp-dataverse --transport http`). This milestone polishes it for production and resolves the schema inconsistencies identified during 8 live testing sessions.

### HTTP Transport

| Item                                                  | Status     |
| :---------------------------------------------------- | :--------- |
| `StreamableHTTPServerTransport` integration           | ✅ Done    |
| `enableJsonResponse` toggle for non-streaming clients | 🔜 Planned |
| Authentication over HTTP (session tokens)             | 🔜 Planned |
| Documentation & multi-client HTTP examples            | 🔜 Planned |

### Attribute Management

| Item                                                                                                                       | Status     |
| :------------------------------------------------------------------------------------------------------------------------- | :--------- |
| `dataverse_create_attribute` — create columns (String, Integer, Decimal, Boolean, DateTime, Money, Memo, Picklist, BigInt) | ✅ Done    |
| `dataverse_update_attribute` — update column properties (display name, description, requirement level)                     | ✅ Done    |
| `dataverse_delete_attribute` — remove custom columns with confirmation guardrail                                           | ✅ Done    |
| Lookup, MultiSelectPicklist, Image, AutoNumber attribute types                                                             | 🔜 Planned |

### Schema Consistency

| Item                                                                                            | Status     |
| :---------------------------------------------------------------------------------------------- | :--------- |
| Uniform parameter naming across all tools (camelCase convention)                                | 🔜 Planned |
| `confirm` parameter documented consistently on all destructive tools                            | 🔜 Planned |
| `suggest_tools` no longer exposes non-callable tools                                            | 🔜 Planned |
| `errorCategory` field in error responses (`ENV_LIMITATION` / `PERMISSIONS` / `SCHEMA_MISMATCH`) | 🔜 Planned |
| Preflight checks for environment prerequisites (HasNotes, Change Tracking, Alternate Keys)      | 🔜 Planned |
| `dataverse_search` — actionable error when Relevance Search is disabled                         | 🔜 Planned |

### Audit Fixes

| Item                                                                                         | Status     |
| :------------------------------------------------------------------------------------------- | :--------- |
| Add `MSCRM.MergeLabels: true` header on metadata PUT/PATCH to preserve multi-language labels | 🔜 Planned |
| Fix batch request body to use CRLF (`\r\n`) per RFC 2046                                     | 🔜 Planned |
| `detect_duplicates` — align description with actual implementation (FetchXML field-OR match) | 🔜 Planned |
| `search` — construct URL from `environmentUrl` instead of relative `../../` hack             | 🔜 Planned |
| `executeFunction` — support aliased typed parameters (not just string)                       | 🔜 Planned |

### Authentication Methods

| Item                                                                                                   | Status     |
| :----------------------------------------------------------------------------------------------------- | :--------- |
| **Azure AD app registration** (Client Credentials) — service-to-service, CI/CD, unattended scenarios   | 🔜 Planned |
| **Managed Identity** — zero-secret auth for Azure-hosted deployments (App Service, Container Apps, VM) | 🔜 Planned |
| `authMethod` config option (`"device-code"` / `"client-credentials"` / `"managed-identity"`)           | 🔜 Planned |

**Why it matters:** HTTP transport unlocks remote servers, shared team instances, and integration with orchestrators that can't spawn stdio processes. Schema consistency reduces AI agent confusion and improves first-call success rates. Attribute management brings column-level CRUD natively. Audit fixes harden Web API compliance. New auth methods enable enterprise and CI/CD scenarios without any user interaction.

---

## v0.5 — MCP Prompts + Schema Completion

{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Pre-built prompt templates for common Dataverse workflows, and the critical schema tools needed to create tables, relationships, and Lookup columns.

### MCP Prompts

Structured prompt templates that AI agents can invoke for guided, multi-step tasks:

| Prompt                | Description                                                         |
| :-------------------- | :------------------------------------------------------------------ |
| `audit_entity`        | Comprehensive entity audit (schema, records, plugins, dependencies) |
| `schema_review`       | Review table design for best practices                              |
| `find_orphan_records` | Detect records with broken lookup references                        |
| `solution_health`     | Analyze solution composition and dependencies                       |

**Design:** YAML-driven prompts for easy community contributions. Each prompt includes step sequences, variable bindings, and expected output structure.

### Schema & Security Tools (High priority)

| Item                                                                                          | Status     |
| :-------------------------------------------------------------------------------------------- | :--------- |
| `create_table` — create custom entities via `POST /EntityDefinitions`                         | 🔜 Planned |
| `create_relationship` — create 1:N / N:N relationships via `POST /RelationshipDefinitions`    | 🔜 Planned |
| `check_record_access` — `RetrievePrincipalAccess` to check who can read/write/delete a record | 🔜 Planned |
| Lookup attribute type in `create_attribute` (requires relationship creation)                  | 🔜 Planned |

### Developer Tools

| Item                                                                                                                                        | Status     |
| :------------------------------------------------------------------------------------------------------------------------------------------ | :--------- |
| `generate_entity_diagram` — export a Mermaid ERD for a table and its 1:N / N:N / Lookup relationships, ready to paste in docs or wikis      | 🔜 Planned |
| `generate_api_snippet` — generate ready-to-use Web API call snippets (cURL, JS `fetch`, Python `requests`) for any Dataverse CRUD operation  | 🔜 Planned |

**Why it matters:** Full MCP spec coverage (tools + resources + prompts) — a first for any Dataverse MCP server. Schema tools complete the entity lifecycle: create table → add columns → define relationships. The ERD generator makes schema visible at a glance; the snippet generator lets AI agents write integration code, not just query through MCP.

---

## v0.6 — Advanced Operations

{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Record-level security, deduplication, solution management, and shared metadata operations.

| Item                                                                                               | Status     |
| :------------------------------------------------------------------------------------------------- | :--------- |
| `grant_access` / `revoke_access` — `GrantAccess` / `RevokeAccess` actions for record-level sharing | 🔜 Planned |
| `merge_records` — `Merge` action for deduplication workflows                                       | 🔜 Planned |
| Solution import / export — `ExportSolution` / `ImportSolution` actions                             | 🔜 Planned |
| Global OptionSet CRUD — create / update / delete shared option sets                                | 🔜 Planned |
| Alternate Key CRUD — define and manage entity keys for upsert scenarios                            | 🔜 Planned |
| MultiSelectPicklist, Image, AutoNumber attribute types in `create_attribute`                       | 🔜 Planned |
| FetchXML auto-pagination — transparent cookie-based paging for large result sets                   | 🔜 Planned |

**Why it matters:** Covers the advanced workflows power users and ISVs rely on — record sharing, solution lifecycle, and richer schema management.

---

## Beyond v0.6

Ideas under consideration for future releases:

- **On-Behalf-Of auth (OBO)** — multi-tenant, per-user authentication via Entra ID for enterprise deployment
- **Streaming queries** — SSE-based streaming for large dataset retrieval
- **Real-time subscriptions** — Dataverse webhook integration for push notifications

---

## Feature Requests

Have an idea? [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label.
