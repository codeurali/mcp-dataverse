# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — [Semantic Versioning](https://semver.org/).

---

## [0.2.0] — Unreleased

### Added

- `dataverse_assign` — assign a record to a different user or team owner via `ownerid@odata.bind`
- `dataverse_list_teams` — list Dataverse teams with optional filter by team type (Owner / Access / Office / Security)
- `dataverse_update` now accepts optional `etag` parameter for optimistic concurrency (`If-Match: <etag>`); when omitted, behaviour is unchanged (`If-Match: *`)

### Security

- MSAL token-cache file now written with `mode: 0o600` (owner read/write only) on POSIX systems

---

## [0.1.5] — 2026-02-21

### Removed

- Removed `Dockerfile` and `.dockerignore` — Docker adds unnecessary complexity for an stdio-based MCP server distributed via `npx`; PAC CLI auth (recommended) does not work in containers
- Removed Docker section from README

---

## [0.1.3] — 2025-06-22

### Fixed

- Server startup crash when installed via `npx` — incorrect `package.json` path resolution from `dist/` (was `../../package.json`, now `../package.json`)

### Security

- **[HIGH]** `entitySetName` now validated against a safe identifier regex (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`) across all tools — prevents path traversal within same origin (F-01)
- **[MEDIUM]** `relationshipName` and `relatedEntitySetName` now validated with the same safe identifier regex in relation tools (F-10)
- Consolidated all inline OData single-quote escaping calls to use the centralized `esc()` utility for consistency (F-06)

---

## [0.1.0] — 2025-04-01

### Added

48 tools covering the full Microsoft Dataverse Web API surface:

| Category                    | Tools                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                    | `dataverse_whoami`                                                                                                                                                                                                        |
| **Metadata** (7)            | `dataverse_list_tables`, `dataverse_get_table_metadata`, `dataverse_get_relationships`, `dataverse_list_global_option_sets`, `dataverse_get_option_set`, `dataverse_get_entity_key`, `dataverse_get_attribute_option_set` |
| **Query** (3)               | `dataverse_query`, `dataverse_execute_fetchxml`, `dataverse_retrieve_multiple_with_paging`                                                                                                                                |
| **CRUD** (5)                | `dataverse_get`, `dataverse_create`, `dataverse_update`, `dataverse_delete`, `dataverse_upsert`                                                                                                                           |
| **Relations** (2)           | `dataverse_associate`, `dataverse_disassociate`                                                                                                                                                                           |
| **Actions / Functions** (6) | `dataverse_execute_action`, `dataverse_execute_function`, `dataverse_execute_bound_action`, `dataverse_execute_bound_function`, `dataverse_retrieve_dependencies_for_delete`, `dataverse_list_dependencies`               |
| **Batch** (1)               | `dataverse_batch_execute`                                                                                                                                                                                                 |
| **Change Tracking** (1)     | `dataverse_change_detection`                                                                                                                                                                                              |
| **Solution** (3)            | `dataverse_list_solutions`, `dataverse_solution_components`, `dataverse_publish_customizations`                                                                                                                           |
| **Impersonation** (1)       | `dataverse_impersonate`                                                                                                                                                                                                   |
| **Customization** (3)       | `dataverse_list_custom_actions`, `dataverse_list_plugin_steps`, `dataverse_set_workflow_state`                                                                                                                            |
| **Environment** (2)         | `dataverse_get_environment_variable`, `dataverse_set_environment_variable`                                                                                                                                                |
| **Trace** (2)               | `dataverse_get_plugin_trace_logs`, `dataverse_get_workflow_trace_logs`                                                                                                                                                    |
| **Search** (1)              | `dataverse_search`                                                                                                                                                                                                        |
| **Audit** (1)               | `dataverse_get_audit_log`                                                                                                                                                                                                 |
| **Quality** (1)             | `dataverse_detect_duplicates`                                                                                                                                                                                             |
| **Annotations** (2)         | `dataverse_get_annotations`, `dataverse_create_annotation`                                                                                                                                                                |
| **Users** (2)               | `dataverse_list_users`, `dataverse_get_user_roles`                                                                                                                                                                        |
| **Views** (1)               | `dataverse_list_views`                                                                                                                                                                                                    |
| **Files** (2)               | `dataverse_upload_file_column`, `dataverse_download_file_column`                                                                                                                                                          |
| **Org** (1)                 | `dataverse_list_business_units`                                                                                                                                                                                           |

### Security

- AES-256-GCM encrypted PAC CLI token cache
- SSRF protection on all outbound HTTP via URL allowlist
- UUID validation on all record ID parameters
- OData injection protection via `esc()` utility
- Path traversal protection on action/function name inputs
- Impersonation gated behind `callerIdHeader` (fail-closed design)
