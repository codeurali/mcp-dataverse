---
title: Capabilities
description: Full reference of all 100 MCP Dataverse tools, 4 resource types, and guided workflow templates.
---

# Full Capabilities Reference

> **Version**: 0.7.10 | **API Version**: Dataverse Web API v9.2 | **Transport**: stdio · HTTP/SSE

100 tools (81 core and 19 MCP App bridge tools) · 4 resources · 5 prompts across 28 categories.

For detailed input/output examples, see the [Use Cases](/use-cases) section.

---

## Tool Summary

| #   | Category                | Count  | Tools                                                                                                                                                                                       |
| :-- | :---------------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Auth**                | 1      | `whoami`                                                                                                                                                                                    |
| 2   | **Metadata**            | 9      | `list_tables`, `get_table_metadata`, `get_relationships`, `list_global_option_sets`, `get_option_set`, `get_entity_key`, `get_attribute_option_set`, `update_entity`, `resolve_entity_name` |
| 3   | **Query**               | 3      | `query`, `execute_fetchxml`, `retrieve_multiple_with_paging`                                                                                                                                |
| 4   | **CRUD**                | 6      | `get`, `create`, `update`, `delete`, `upsert`, `assign`                                                                                                                                     |
| 5   | **Relations**           | 4      | `associate`, `associate_bulk`, `disassociate`, `query_associations`                                                                                                                         |
| 6   | **Actions & Functions** | 6      | `execute_action`, `execute_function`, `execute_bound_action`, `execute_bound_function`, `list_dependencies`, `retrieve_dependencies_for_delete`                                             |
| 7   | **Batch**               | 1      | `batch_execute`                                                                                                                                                                             |
| 8   | **Change Tracking**     | 1      | `change_detection`                                                                                                                                                                          |
| 9   | **Solutions**           | 2      | `publish_customizations`, `create_sitemap`                                                                                                                                                  |
| 10  | **Impersonation**       | 1      | `impersonate`                                                                                                                                                                               |
| 11  | **Customization**       | 4      | `list_custom_actions`, `list_plugin_steps`, `set_workflow_state`, `list_connection_references`                                                                                              |
| 12  | **Environment**         | 4      | `get_environment_variable`, `set_environment_variable`, `create_environment_variable`, `environment_capabilities`                                                                           |
| 13  | **Trace**               | 2      | `get_plugin_trace_logs`, `get_workflow_trace_logs`                                                                                                                                          |
| 14  | **Search**              | 1      | `search`                                                                                                                                                                                    |
| 15  | **Audit**               | 1      | `get_audit_log`                                                                                                                                                                             |
| 16  | **Quality**             | 1      | `detect_duplicates`                                                                                                                                                                         |
| 17  | **Annotations**         | 2      | `get_annotations`, `create_annotation`                                                                                                                                                      |
| 18  | **Users**               | 2      | `list_users`, `get_user_roles`                                                                                                                                                              |
| 19  | **RBAC**                | 7      | `list_roles`, `assign_role_to_user`, `remove_role_from_user`, `assign_role_to_team`, `get_role_privileges`, `add_role_privileges`, `replace_role_privileges`                                |
| 20  | **Views**               | 1      | `list_views`                                                                                                                                                                                |
| 21  | **Files**               | 2      | `upload_file_column`, `download_file_column`                                                                                                                                                |
| 22  | **Org**                 | 2      | `list_business_units`, `list_teams`                                                                                                                                                         |
| 23  | **Workflows**           | 4      | `list_workflows`, `get_workflow`, `list_guides`, `get_guide`                                                                                                                                |
| 24  | **Assistance**          | 2      | `suggest_tools`, `list_tool_tags`                                                                                                                                                           |
| 25  | **Attributes**          | 4      | `create_attribute`, `update_attribute`, `delete_attribute`, `create_lookup_attribute`                                                                                                       |
| 26  | **Schema (write)**      | 2      | `create_table`, `create_relationship`                                                                                                                                                       |
| 27  | **Record Access**       | 4      | `check_record_access`, `grant_access`, `revoke_access`, `merge_records`                                                                                                                     |
| 28  | **Web Resources**       | 2      | `create_web_resource`, `set_table_icon`
|     | **Total (core)**        | **81** |

All tool names are prefixed with `dataverse_` (e.g., `dataverse_query`, `dataverse_create`).

On top of the 81 core tools, 19 bridge tools serve five interactive MCP Apps: table browser, FetchXML workbench, plugin trace viewer, schema explorer and RBAC inspector. They are called by the app interfaces rather than by the agent directly, and they return machine-facing JSON.

---

## Architecture Overview

<ArchitectureTree />

All tool handlers validate inputs with **Zod** before calling the Dataverse Web API. Auth tokens are cached and refreshed proactively; transient errors (429, 503, 504) are retried with exponential backoff.

---

## MCP Resources

Four read-only MCP resources provide direct contextual data to AI clients that support the MCP Resources spec (Claude Desktop, Cursor). Each returns JSON or plain text without requiring a tool call.

| URI                                              | Type     | MIME Type          | Description                                                  |
| :----------------------------------------------- | :------- | :----------------- | :----------------------------------------------------------- |
| `dataverse://tables`                             | Static   | `application/json` | Lists all tables in the environment (LogicalName, DisplayName, EntitySetName) |
| `dataverse://server/instructions`                | Static   | `text/plain`       | Agent best practices and tool usage guidelines               |
| `dataverse://tables/{tableName}/schema`          | Template | `application/json` | All columns, types, requirement levels, and constraints for a table |
| `dataverse://tables/{tableName}/relationships`   | Template | `application/json` | All 1:N, N:1, and N:N relationships for a table              |

> **Client support:** Resource support varies by client. Claude Desktop and Cursor load them directly. If your client does not, use `dataverse_list_tables` + `dataverse_get_table_metadata` as substitutes.

---

## MCP Prompts

Five built-in prompt templates guide AI agents through complex multi-step Dataverse workflows. Each prompt composes tools in a recommended sequence and returns a structured report.

| Prompt name           | Required args              | Optional args                            | Purpose                                         |
| :-------------------- | :------------------------- | :--------------------------------------- | :---------------------------------------------- |
| `analyze-org-health`  | _(none)_                   | _(none)_                                 | Full org health: table count, roles, workflows summary |
| `data-quality-check`  | `tableName`                | `sampleSize` (default: `50`, max: `500`) | Nullity rates, duplicate detection, completeness score |
| `schema-review`       | `tableName`                | _(none)_                                 | Schema best practices for naming, types, relations, views |
| `security-audit`      | _(none)_                   | _(none)_                                 | Over-privileged users, empty teams, orphaned role assignments |
| `analyze-workflow`    | _(none)_                   | `workflowName` (substring filter), `statusFilter` (`active`/`inactive`/`all`, default: `active`) | Workflow health, error rates, ownership |

---

## Key Features

### Structured Outputs

Every tool returns a consistent structure:

```json
{
  "summary": "Human-readable summary of the result",
  "data": {},
  "suggestions": ["Next steps the AI agent can take"]
}
```

When an error has a well-known root cause, tools also include an `errorCategory` field to enable programmatic error handling:

| Value             | Meaning                                                |
| :---------------- | :----------------------------------------------------- |
| `ENV_LIMITATION`  | Feature not enabled or unavailable in this environment |
| `PERMISSIONS`     | Insufficient privileges for the operation              |
| `SCHEMA_MISMATCH` | Input conflicts with the table’s metadata schema       |

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

| Status              | Behavior                                  | Attempts                 |
| :------------------ | :---------------------------------------- | :----------------------- |
| **401**             | Invalidate token, retry with fresh token  | 1                        |
| **429 / 503 / 504** | Exponential backoff (2^attempt × 1000 ms) | `maxRetries` (default 3) |
| **Other**           | Throw immediately with actionable message | 0                        |

---

## Security

| Feature               | Details                                                 |
| :-------------------- | :------------------------------------------------------ |
| Token encryption      | AES-256-GCM cached credentials at `~/.mcp-dataverse/`   |
| OData injection       | `esc()` utility for single-quote escaping               |
| File column safety    | `columnName` validated against `/^[a-zA-Z0-9_]+$/`      |
| Impersonation cleanup | `MSCRMCallerId` cleaned in `finally` block              |
| No secrets in logs    | PATs, tokens and headers are excluded from tool responses by design |

---

## Limitations

| Area                   | Limitation                                                                             |
| :--------------------- | :------------------------------------------------------------------------------------- |
| **Transport**          | stdio (default) and HTTP. Server must be spawned or run as HTTP service.               |
| **Single environment** | One Dataverse environment per server instance                                          |
| **No streaming**       | Responses are complete JSON; large result sets may exceed AI context limits            |
| **`$top` max**         | `dataverse_query` caps at 5 000 per call; use `retrieve_multiple_with_paging` for more |
| **Paging max**         | `retrieve_multiple_with_paging` caps at 50 000 records                                 |
| **Batch max**          | 1 000 operations per `$batch` request                                                  |
| **No `$<Content-ID>`** | Cross-referencing created entities within a changeset not supported                    |
| **Token expiry**       | Refresh tokens expire after ~90 days of inactivity                                     |

For the complete technical reference with parameter tables, see [CAPABILITIES.md on GitHub](https://github.com/codeurali/mcp-dataverse/blob/master/CAPABILITIES.md).
