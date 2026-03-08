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

Released
{: .label .label-purple }

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

{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Enterprise-grade authentication options so teams can deploy MCP Dataverse without PAC CLI, plus the remaining consistency fixes from v0.4.

### Authentication Methods

| Item                                                                                                    | Status     |
| :------------------------------------------------------------------------------------------------------ | :--------- |
| **Azure AD app registration** (Client Credentials) — service-to-service, CI/CD, unattended scenarios   | 🔜 Planned |
| **Managed Identity** — zero-secret auth for Azure-hosted deployments (App Service, Container Apps, VM) | 🔜 Planned |
| `authMethod` config option (`"pac"` / `"client-credentials"` / `"managed-identity"`)                   | 🔜 Planned |

### Schema & Error Consistency

| Item                                                                                             | Status     |
| :----------------------------------------------------------------------------------------------- | :--------- |
| `errorCategory` field in error responses (`ENV_LIMITATION` / `PERMISSIONS` / `SCHEMA_MISMATCH`) | ✅ Done    |
| `dataverse_search` — actionable error when Relevance Search is disabled                          | ✅ Done    |
| Uniform camelCase parameter naming across all tools                                              | ✅ Done    |

**Why it matters:** Client Credentials and Managed Identity unlock server-side deployments and CI/CD pipelines without any interactive login. Structured error categories let AI agents self-correct without human intervention.

---

## v0.6 — MCP Prompts + Developer Tooling

{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Pre-built prompt templates for guided multi-step Dataverse workflows, plus developer tooling to generate ERDs and Web API code snippets.

### MCP Prompts

Structured prompt templates that AI agents can invoke for guided, multi-step tasks:

| Prompt                | Description                                                         |
| :-------------------- | :------------------------------------------------------------------ |
| `audit_entity`        | Comprehensive entity audit (schema, records, plugins, dependencies) |
| `schema_review`       | Review table design for best practices                              |
| `find_orphan_records` | Detect records with broken lookup references                        |
| `solution_health`     | Analyze solution composition and dependencies                       |

**Design:** YAML-driven prompts for easy community contributions. Each prompt includes step sequences, variable bindings, and expected output structure.

### Developer Tools

| Item                                                                                                                                        | Status     |
| :------------------------------------------------------------------------------------------------------------------------------------------ | :--------- |
| `generate_entity_diagram` — export a Mermaid ERD for a table and its 1:N / N:N / Lookup relationships, ready to paste in docs or wikis      | 🔜 Planned |
| `generate_api_snippet` — generate ready-to-use Web API call snippets (cURL, JS `fetch`, Python `requests`) for any Dataverse CRUD operation  | 🔜 Planned |

**Why it matters:** Full MCP spec coverage (tools + resources + prompts) — a first for any Dataverse MCP server. The ERD generator makes schema visible at a glance; the snippet generator lets AI agents write integration code, not just query through MCP.

---

## v0.7 — Schema & Record Management

{: .d-inline-block }

Planned
{: .label .label-yellow }

**Goal:** Table-level schema management, record-level security, deduplication, and solution lifecycle.

### Schema Tools

| Item                                                                                          | Status     |
| :-------------------------------------------------------------------------------------------- | :--------- |
| `create_table` — create custom entities via `POST /EntityDefinitions`                         | 🔜 Planned |
| `create_relationship` — create standalone 1:N / N:N relationships                             | 🔜 Planned |
| `check_record_access` — `RetrievePrincipalAccess` to check who can read/write/delete a record | 🔜 Planned |
| Global OptionSet CRUD — create / update / delete shared option sets                           | 🔜 Planned |
| Alternate Key CRUD — define and manage entity keys for upsert scenarios                       | 🔜 Planned |

### Record Operations

| Item                                                                                               | Status     |
| :------------------------------------------------------------------------------------------------- | :--------- |
| `grant_access` / `revoke_access` — `GrantAccess` / `RevokeAccess` for record-level sharing         | 🔜 Planned |
| `merge_records` — `Merge` action for deduplication workflows                                       | 🔜 Planned |
| Solution import / export — `ExportSolution` / `ImportSolution` actions                             | 🔜 Planned |
| FetchXML auto-pagination — transparent cookie-based paging for large result sets                   | 🔜 Planned |

**Why it matters:** Completes the entity lifecycle (create table → add columns → define relationships). Access control tools let AI agents manage sharing without dropping to raw API calls. Solution lifecycle tools support ALM workflows.

---

## Feature Requests

Have an idea? [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label.
