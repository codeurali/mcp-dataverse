---
title: Roadmap
description: Upcoming features, milestones, and long-term vision for MCP Dataverse.
---

# Roadmap

The MCP Dataverse project follows semantic versioning and ships incremental improvements between milestones. Here's what's coming.

---

## v0.4 — Streamable HTTP + Schema Consistency
Released
**Goal:** First-class HTTP/SSE support for multi-client and remote deployment scenarios, attribute-level schema management (create/update/delete columns + lookup), and fixes surfaced by the Web API audit. Released 2026-03-05 as v0.4.0, updated through v0.4.6 (73 tools across 25 categories).

The foundation already exists — `StreamableHTTPServerTransport` is implemented and functional (`npx mcp-dataverse --transport http`). This milestone polishes it for production and resolves the schema inconsistencies identified during 8 live testing sessions.

### HTTP Transport

| Item                                                  | Status     |
| :---------------------------------------------------- | :--------- |
| `StreamableHTTPServerTransport` integration           | ✅ Done    |
| `enableJsonResponse` toggle for non-streaming clients | ✅ Done    |
| Authentication over HTTP (session tokens)             | ✅ Done    |
| Documentation & multi-client HTTP examples            | ✅ Done    |

### Attribute Management

| Item                                                                                                                       | Status     |
| :------------------------------------------------------------------------------------------------------------------------- | :--------- |
| `dataverse_create_attribute` — create columns (String, Integer, Decimal, Boolean, DateTime, Money, Memo, Picklist, BigInt) | ✅ Done    |
| `dataverse_update_attribute` — update column properties (display name, description, requirement level)                     | ✅ Done    |
| `dataverse_delete_attribute` — remove custom columns with confirmation guardrail                                           | ✅ Done    |
| Lookup, MultiSelectPicklist, Image, AutoNumber attribute types                                                             | ✅ Done    |

### Schema Consistency

| Item                                                                                            | Status     |
| :---------------------------------------------------------------------------------------------- | :--------- |
| Uniform parameter naming across all tools (camelCase convention)                                | ✅ Done    |
| `confirm` parameter documented consistently on all destructive tools                            | ✅ Done    |
| `suggest_tools` no longer exposes non-callable tools                                            | ✅ Done    |
| `errorCategory` field in error responses (`ENV_LIMITATION` / `PERMISSIONS` / `SCHEMA_MISMATCH`) | ✅ Done    |
| Preflight checks for environment prerequisites (HasNotes, Change Tracking, Alternate Keys)      | ✅ Done    |
| `dataverse_search` — actionable error when Relevance Search is disabled                         | ✅ Done    |

### Audit Fixes

| Item                                                                                         | Status     |
| :------------------------------------------------------------------------------------------- | :--------- |
| Add `MSCRM.MergeLabels: true` header on metadata PUT/PATCH to preserve multi-language labels | ✅ Done    |
| Fix batch request body to use CRLF (`\r\n`) per RFC 2046                                     | ✅ Done    |
| `detect_duplicates` — align description with actual implementation (FetchXML field-OR match) | ✅ Done    |
| `search` — construct URL from `environmentUrl` instead of relative `../../` hack             | ✅ Done    |
| `executeFunction` — support aliased typed parameters (not just string)                       | ✅ Done    |

**Why it matters:** HTTP transport unlocks remote servers, shared team instances, and integration with orchestrators that can't spawn stdio processes. Schema consistency reduces AI agent confusion and improves first-call success rates. Attribute management brings column-level CRUD natively. Audit fixes harden Web API compliance.

---

## v0.5 — Auth Methods & Completeness
Done
**Goal:** Enterprise-grade authentication options so teams can deploy MCP Dataverse without PAC CLI, plus the remaining consistency fixes from v0.4.

### Authentication Methods

| Item                                                                                                    | Status     |
| :------------------------------------------------------------------------------------------------------ | :--------- |
| **Azure AD app registration** (Client Credentials) — service-to-service, CI/CD, unattended scenarios   | ✅ Done    |
| **Managed Identity** — zero-secret auth for Azure-hosted deployments (App Service, Container Apps, VM) | ✅ Done    |
| `authMethod` config option (`"pac"` / `"client-credentials"` / `"managed-identity"`)                   | ✅ Done    |

### Schema & Error Consistency

| Item                                                                                             | Status     |
| :----------------------------------------------------------------------------------------------- | :--------- |
| `errorCategory` field in error responses (`ENV_LIMITATION` / `PERMISSIONS` / `SCHEMA_MISMATCH`) | ✅ Done    |
| `dataverse_search` — actionable error when Relevance Search is disabled                          | ✅ Done    |
| Uniform camelCase parameter naming across all tools                                              | ✅ Done    |

**Why it matters:** Client Credentials and Managed Identity unlock server-side deployments and CI/CD pipelines without any interactive login. Structured error categories let AI agents self-correct without human intervention.

---

## v0.6 — MCP Resources + Prompts
Done
**Goal:** Full MCP spec coverage — structured resource URIs for contextual data access and pre-built prompt templates for guided multi-step Dataverse workflows. Released 2026-04-12 as v0.6.0.

### MCP Resources

Read-only resources that AI clients (Claude, Cursor) can load directly into context:

| URI                                         | Type     | Description                                         |
| :------------------------------------------ | :------- | :-------------------------------------------------- |
| `dataverse://tables`                        | Static   | Full catalog of all tables in the environment       |
| `dataverse://server/instructions`           | Static   | Agent best practices and usage guidelines           |
| `dataverse://tables/{tableName}/schema`     | Template | All columns, types, and constraints for a table     |
| `dataverse://tables/{tableName}/relationships` | Template | All 1:N, N:1, N:N relationships for a table      |

### MCP Prompts

Structured prompt templates that AI agents can invoke for guided, multi-step tasks:

| Prompt                  | Arguments                                          | Description                                                          |
| :---------------------- | :------------------------------------------------- | :------------------------------------------------------------------- |
| `analyze-org-health`    | _(none)_                                           | Full org health check: table inventory, roles, workflows             |
| `data-quality-check`    | `tableName` (required), `sampleSize` (opt, def 50) | Nullity rates, duplicate detection, field completeness               |
| `schema-review`         | `tableName` (required)                             | Schema best practices: naming, types, relations, views               |
| `security-audit`        | _(none)_                                           | Over-privileged users, empty teams, orphaned role assignments        |
| `analyze-workflow`      | `workflowName` (opt), `statusFilter` (opt: active/inactive/all) | Workflow health, error rates, ownership gaps |

**Why it matters:** Full MCP spec coverage (tools + resources + prompts) — a first for any Dataverse MCP server. Resources let AI agents load schema into context without extra tool calls. Prompts guide complex multi-step workflows with consistent patterns.

---

## v0.7 — Schema & Record Management
Done
**Goal:** Table-level schema management (create table, create relationship), record-level security (grant/revoke/check access), and deduplication via Merge. Released 2026-04-12 as v0.7.0; patch v0.7.5 released 2026-04-14 (4 regression fixes on `check_record_access`, `merge_records`, `create_relationship`).

### Schema Tools

| Item                                                                                          | Status     |
| :-------------------------------------------------------------------------------------------- | :--------- |
| `dataverse_create_table` — create custom entities via `POST /EntityDefinitions`               | ✅ Done    |
| `dataverse_create_relationship` — create standalone 1:N / N:N relationships                   | ✅ Done    |
| Global OptionSet CRUD — create / update / delete shared option sets                           | 🔜 Planned |
| Alternate Key CRUD — define and manage entity keys for upsert scenarios                       | 🔜 Planned |

### Record Operations

| Item                                                                                               | Status     |
| :------------------------------------------------------------------------------------------------- | :--------- |
| `dataverse_check_record_access` — `RetrievePrincipalAccess` to check who can read/write/delete a record | ✅ Done |
| `dataverse_grant_access` / `dataverse_revoke_access` — record-level sharing via `GrantAccess` / `RevokeAccess` | ✅ Done |
| `dataverse_merge_records` — `Merge` action for deduplication workflows                        | ✅ Done    |
| Solution import / export — `ExportSolution` / `ImportSolution` actions                             | 🔜 Planned |
| FetchXML auto-pagination — transparent cookie-based paging for large result sets                   | 🔜 Planned |

**Why it matters:** Completes the entity lifecycle (create table → add columns → define relationships). Access control tools let AI agents manage sharing without dropping to raw API calls. Solution lifecycle tools support ALM workflows.

---

## Feature Requests

Have an idea? [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label.
