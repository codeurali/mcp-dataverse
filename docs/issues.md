---
layout: default
title: Known Issues
nav_order: 6
permalink: /issues
---

# Known Issues
{: .no_toc }

Issues identified during the Web API compliance audit. Each issue references the affected tool and planned fix.
{: .fs-5 .fw-300 }

Last updated: July 2025
{: .text-grey-dk-000 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
- TOC
{:toc}
</details>

---

## Active Issues

### ISSUE-01 — Missing `MSCRM.MergeLabels` header on metadata writes
{: .text-red-300 }

| | |
|:--|:--|
| **Priority** | 🔴 High |
| **Affected tools** | `dataverse_update_entity`, `dataverse_update_attribute` |
| **Status** | 🔜 Fix planned (v0.4) |

**Problem:** `PATCH /EntityDefinitions` and `PUT /EntityDefinitions(.../Attributes(...)` calls do not include the `MSCRM.MergeLabels: true` header. In multi-language environments, this causes non-primary-language labels (DisplayName, Description) to be erased on every update.

**Workaround:** After updating metadata, manually re-apply non-English labels via the Dataverse UI or a direct API call with the header set.

**Planned fix:** Add `MSCRM.MergeLabels: true` header to all metadata PATCH/PUT operations in the client layer.

---

### ISSUE-02 — `@odata.type` included in `update_entity` PATCH body
{: .text-yellow-300 }

| | |
|:--|:--|
| **Priority** | 🟡 Medium |
| **Affected tools** | `dataverse_update_entity` |
| **Status** | 🔜 Fix planned (v0.4) |

**Problem:** The `update_entity` tool includes `@odata.type` in the PATCH request body. For partial updates (PATCH), OData best practice is to omit `@odata.type` entirely — the server infers the type from the URL. Some environments accept it, others may reject it or behave unexpectedly.

**Workaround:** None needed in most environments — the current behavior generally works. If you encounter errors, use the Web API directly without the type annotation.

**Planned fix:** Strip `@odata.type` from PATCH payloads; only include it in POST (create) operations where it is required.

---

### ISSUE-03 — `update_entity` flag updates return `0x80060888`
{: .text-grey-dk-000 }

| | |
|:--|:--|
| **Priority** | ⚪ Low |
| **Affected tools** | `dataverse_update_entity` |
| **Status** | ℹ️ Environment limitation — no fix needed |

**Problem:** Updating boolean flags like `IsAuditEnabled`, `IsValidForQueue`, `IsConnectionsEnabled` via `PATCH /EntityDefinitions` returns error `0x80060888` on certain Dataverse environments (typically sandboxes or environments with restricted managed solutions).

**Explanation:** This is a Dataverse environment restriction, not an MCP bug. The tool already handles this gracefully by catching the error and returning an actionable message. No code change required.

---

### ISSUE-04 — Batch requests use `\n` instead of `\r\n`
{: .text-yellow-300 }

| | |
|:--|:--|
| **Priority** | 🟡 Medium-Low |
| **Affected tools** | `dataverse_batch_execute` |
| **Status** | 🔜 Fix planned (v0.4) |

**Problem:** The batch request body uses Unix-style line endings (`\n`) instead of CRLF (`\r\n`) as required by RFC 2046 for MIME multipart messages. The Dataverse Web API currently accepts `\n`, but this violates the spec and may break with future API versions or stricter proxies.

**Workaround:** None needed — Dataverse currently tolerates `\n`.

**Planned fix:** Replace `\n` with `\r\n` in batch body construction in `dataverse-client.batch.ts`.

---

### ISSUE-05 — `detect_duplicates` description is misleading
{: .text-yellow-300 }

| | |
|:--|:--|
| **Priority** | 🟡 Medium |
| **Affected tools** | `dataverse_detect_duplicates` |
| **Status** | 🔜 Fix planned (v0.4) |

**Problem:** The tool description says "Uses Dataverse built-in duplicate detection rules", but the actual implementation uses FetchXML with field-level OR matching. This is a functional approximation — it does not invoke the real `RetrieveDuplicates` function or respect published duplicate detection rules in the environment.

**Impact:** Results may differ from what the Dataverse duplicate detection UI would return. Custom duplicate rules (e.g., fuzzy matching, compound keys) are not honored.

**Workaround:** For authoritative duplicate detection, use the Dataverse UI or call `RetrieveDuplicates` directly via the Web API.

**Planned fix:** Update the tool description to accurately reflect the FetchXML-based approach. Optionally, add a separate tool that calls the real `RetrieveDuplicates` function.

---

### ISSUE-06 — `search` URL uses relative path hack
{: .text-grey-dk-000 }

| | |
|:--|:--|
| **Priority** | ⚪ Low |
| **Affected tools** | `dataverse_search` |
| **Status** | 🔜 Fix planned (v0.4) |

**Problem:** The search tool constructs the Relevance Search URL using a relative path (`../../search/v1.0/query`) instead of building the absolute URL from `environmentUrl`. This works because the OData base URL includes `/api/data/v9.2/`, but it's fragile and relies on path traversal assumptions.

**Workaround:** None needed — the current approach works.

**Planned fix:** Construct the search URL directly: `${environmentUrl}/api/search/v1.0/query`.

---

### ISSUE-07 — `executeFunction` only supports string parameters
{: .text-grey-dk-000 }

| | |
|:--|:--|
| **Priority** | ⚪ Low |
| **Affected tools** | `dataverse_execute_function`, `dataverse_execute_bound_function` |
| **Status** | 🔜 Fix planned (future) |

**Problem:** All function parameters are wrapped in single quotes (string literals) in the URL. Functions that expect integers, GUIDs, or booleans as aliased parameters receive them as strings, which may cause type errors on some functions.

**Example:** `WhoAmI()` and simple functions work fine. Functions like `RetrievePrincipalAccess(Target=@t,Principal=@p)` that expect EntityReference parameters need proper aliasing with `@` syntax and typed values.

**Workaround:** For functions requiring typed parameters, use `dataverse_query` with a manually constructed function URL.

**Planned fix:** Implement aliased parameter support with proper OData type annotations.

---

### ISSUE-08 — `create_attribute` missing common column types
{: .text-yellow-300 }

| | |
|:--|:--|
| **Priority** | 🟡 Medium |
| **Affected tools** | `dataverse_create_attribute` |
| **Status** | 🔜 Planned (v0.4) |

**Problem:** The `create_attribute` tool currently supports: String, Integer, Decimal, Boolean, DateTime, Money, Memo, Picklist, BigInt. The following important column types are not yet supported:

| Missing type | Impact |
|:-------------|:-------|
| **Lookup** | Cannot create relationship columns — most critical gap |
| **MultiSelectPicklist** | Cannot create multi-value choice columns |
| **Image** | Cannot create image columns |
| **AutoNumber** | Cannot create auto-incrementing columns |

**Workaround:** Create these column types via the Dataverse UI (make.powerapps.com) or a direct Web API call.

**Planned fix:** Add support incrementally, starting with Lookup columns (which require creating a relationship via `POST /RelationshipDefinitions`).

---

## Constraints & Degraded Tools

These are not bugs — they are inherent limitations of the current implementation or the Dataverse Web API:

| Tool | Constraint | Reason |
|:-----|:-----------|:-------|
| `dataverse_update_entity` | Boolean flag updates may fail with `0x80060888` | Environment-level restriction on managed metadata |
| `dataverse_search` | Returns empty results if Relevance Search is disabled | Requires admin to enable org-wide Relevance Search |
| `dataverse_batch_execute` | No `$<Content-ID>` cross-referencing | Would require changeset dependency parser — out of scope for now |
| `dataverse_execute_fetchxml` | No automatic pagination | FetchXML paging cookies must be handled manually |
| `dataverse_retrieve_multiple_with_paging` | Max 50,000 records | Safety cap to prevent runaway queries |
| `dataverse_query` | Max 5,000 per call | Use `retrieve_multiple_with_paging` for larger datasets |
