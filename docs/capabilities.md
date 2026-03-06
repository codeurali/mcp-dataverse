---
layout: default
title: Capabilities
nav_order: 5
permalink: /capabilities
---

# Full Capabilities Reference

> **Version**: 0.4.5 | **API Version**: Dataverse Web API v9.2 | **Transport**: stdio · HTTP/SSE

67 tools across 25 categories for full Dataverse lifecycle management.

For detailed input/output examples, see the [Use Cases]({{ site.baseurl }}/use-cases) section.

---

## Tool Summary

| # | Category | Count | Tools |
|:--|:---------|:------|:------|
| 1 | **Auth** | 1 | `whoami` |
| 2 | **Metadata** | 8 | `list_tables`, `get_table_metadata`, `get_relationships`, `list_global_option_sets`, `get_option_set`, `get_entity_key`, `get_attribute_option_set`, `update_entity` |
| 3 | **Query** | 3 | `query`, `execute_fetchxml`, `retrieve_multiple_with_paging` |
| 4 | **CRUD** | 6 | `get`, `create`, `update`, `delete`, `upsert`, `assign` |
| 5 | **Relations** | 2 | `associate`, `disassociate` |
| 6 | **Actions & Functions** | 6 | `execute_action`, `execute_function`, `execute_bound_action`, `execute_bound_function`, `list_dependencies`, `retrieve_dependencies_for_delete` |
| 7 | **Batch** | 1 | `batch_execute` |
| 8 | **Change Tracking** | 1 | `change_detection` |
| 9 | **Solutions** | 3 | `list_solutions`, `solution_components`, `publish_customizations` |
| 10 | **Impersonation** | 1 | `impersonate` |
| 11 | **Customization** | 3 | `list_custom_actions`, `list_plugin_steps`, `set_workflow_state` |
| 12 | **Environment** | 3 | `get_environment_variable`, `set_environment_variable`, `create_environment_variable` |
| 13 | **Trace** | 2 | `get_plugin_trace_logs`, `get_workflow_trace_logs` |
| 14 | **Search** | 1 | `search` |
| 15 | **Audit** | 1 | `get_audit_log` |
| 16 | **Quality** | 1 | `detect_duplicates` |
| 17 | **Annotations** | 2 | `get_annotations`, `create_annotation` |
| 18 | **Users** | 2 | `list_users`, `get_user_roles` |
| 19 | **RBAC** | 4 | `list_roles`, `assign_role_to_user`, `remove_role_from_user`, `assign_role_to_team` |
| 20 | **Views** | 1 | `list_views` |
| 21 | **Files** | 2 | `upload_file_column`, `download_file_column` |
| 22 | **Org** | 2 | `list_business_units`, `list_teams` |
| 23 | **Workflows** | 2 | `list_workflows`, `get_workflow` |
| 24 | **Assistance** | 5 | `suggest_tools`, `list_guides`, `get_guide`, `list_connection_references`, `list_tool_tags` |
| 25 | **Attributes** | 4 | `create_attribute`, `update_attribute`, `delete_attribute`, `create_lookup_attribute` |
| | **Total** | **67** | |

All tool names are prefixed with `dataverse_` (e.g., `dataverse_query`, `dataverse_create`).

---

## Architecture Overview

```
MCP Dataverse Server (67 tools · 25 categories)
├── 🔑 Auth (1)
├── 📋 Metadata (8)
├── 🔍 Query (3)
├── ✏️ CRUD (6)
├── 🔗 Relations (2)
├── ⚡ Actions & Functions (6)
├── 📦 Batch (1)
├── 🔄 Change Tracking (1)
├── 🧩 Solutions (3)
├── 👤 Impersonation (1)
├── 🔧 Customization (3)
├── ⚙️ Environment (3)
├── 🔎 Trace (2)
├── 🔍 Search (1)
├── 📜 Audit (1)
├── ✅ Quality (1)
├── 📝 Annotations (2)
├── 👥 Users (2)
├── 🛡️ RBAC (4)
├── 👁️ Views (1)
├── 📁 Files (2)
├── 🏢 Org (2)
├── ⚙️ Workflows (2)
├── 🤖 Assistance (5)
└── 🏗️ Attributes (4)
```

All tool handlers validate inputs with **Zod** before calling the Dataverse Web API. Auth tokens are cached and refreshed proactively; transient errors (429, 503, 504) are retried with exponential backoff.

---

## Key Features

### Structured Outputs

Every tool returns a consistent structure:

```json
{
  "summary": "Human-readable summary of the result",
  "data": { },
  "suggestions": ["Next steps the AI agent can take"]
}
```

When an error has a well-known root cause, tools also include an `errorCategory` field to enable programmatic error handling:

| Value             | Meaning                                                  |
|:------------------|:---------------------------------------------------------|
| `ENV_LIMITATION`  | Feature not enabled or unavailable in this environment   |
| `PERMISSIONS`     | Insufficient privileges for the operation                |
| `SCHEMA_MISMATCH` | Input conflicts with the table’s metadata schema         |

### Guardrails

- **Destructive operations** (`delete`, `update_entity`) require `confirm: true`
- **Query guardrails** warn about missing `$select`, missing `$filter`, and large result sets
- **RBAC operations** are idempotent — assigning an already-assigned role returns `"already_assigned"` instead of an error

### ETag Support

`dataverse_update` accepts an optional `etag` parameter for optimistic concurrency control. When provided, the update only succeeds if the record hasn't been modified since the ETag was obtained.

### Impersonation

Any tool can be executed on behalf of another user via `dataverse_impersonate`, using the `MSCRMCallerId` header. Requires `prvActOnBehalfOfAnotherUser` privilege.

---

## Error Handling & Retry

| Status | Behavior | Attempts |
|:-------|:---------|:---------|
| **401** | Invalidate token, retry with fresh token | 1 |
| **429 / 503 / 504** | Exponential backoff (2^attempt × 1000 ms) | `maxRetries` (default 3) |
| **Other** | Throw immediately with actionable message | 0 |

---

## Security

| Feature | Details |
|:--------|:--------|
| Token encryption | AES-256-GCM cached credentials at `~/.mcp-dataverse/` |
| OData injection | `esc()` utility for single-quote escaping |
| File column safety | `columnName` validated against `/^[a-zA-Z0-9_]+$/` |
| Impersonation cleanup | `MSCRMCallerId` cleaned in `finally` block |
| No secrets in logs | PAT, tokens, and headers never appear in tool responses |

---

## Limitations

| Area | Limitation |
|:-----|:-----------|
| **Transport** | stdio (default) and HTTP. Server must be spawned or run as HTTP service. |
| **Single environment** | One Dataverse environment per server instance |
| **No streaming** | Responses are complete JSON; large result sets may exceed AI context limits |
| **`$top` max** | `dataverse_query` caps at 5 000 per call; use `retrieve_multiple_with_paging` for more |
| **Paging max** | `retrieve_multiple_with_paging` caps at 50 000 records |
| **Batch max** | 1 000 operations per `$batch` request |
| **No `$<Content-ID>`** | Cross-referencing created entities within a changeset not supported |
| **Token expiry** | Refresh tokens expire after ~90 days of inactivity |

For the complete technical reference with parameter tables, see [CAPABILITIES.md on GitHub](https://github.com/codeurali/mcp-dataverse/blob/master/CAPABILITIES.md).
