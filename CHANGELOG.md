# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — [Semantic Versioning](https://semver.org/).

---

## [0.4.1] — 2026-03-06

### Fixed

- **A1 — Customization lock retry**: `requestWithRetry` now detects HTTP 400 responses with Dataverse error code `0x80071151` (import-job lock) and automatically retries up to 5 times with exponential backoff (5 s → 10 s → 20 s → 40 s → 80 s). Prevents all write tools from failing during concurrent deployments.
- **A2 — Timeout masking success on `dataverse_create_lookup_attribute`**: A network timeout on the relationship creation POST no longer results in a confusing error. The tool now verifies via `getTableMetadata` whether the attribute was actually created; if found, it returns a success response with a warning and skips publish (the operation was committed server-side).
- **A3 — `dataverse_get_relationships` missing custom lookups on large tables**: The three relationship navigation properties (`OneToManyRelationships`, `ManyToOneRelationships`, `ManyToManyRelationships`) now follow `@odata.nextLink` pagination. Previously only the first page was fetched; on tables with 100+ relationships (e.g. `lead`) custom lookup columns from page 2 were silently dropped.
- **A4 — `dataverse_get_attribute_option_set` unsupported on MultiSelectPicklist**: The metadata type list now includes `MultiSelectPicklistAttributeMetadata`, allowing option retrieval for multi-select columns (previously returned a "not a valid option-set attribute" error).

---

## [0.4.0] — 2026-03-05

### Added

- **Attribute Management** — 4 new tools:
  - `dataverse_create_attribute` — create columns for String, Memo, Integer, Decimal, Money, DateTime, Boolean, Picklist, MultiSelectPicklist, AutoNumber, Image types with full type-specific parameters (maxLength, precision, picklistOptions, autoNumberFormat, etc.)
  - `dataverse_update_attribute` — update column properties (display name, description, requirement level, searchability)
  - `dataverse_delete_attribute` — remove custom columns with a `confirm: true` guardrail (⚠️ permanent — deletes all data in the column)
  - `dataverse_create_lookup_attribute` — create a lookup (N:1) column that defines a 1:N relationship between two tables
- **HTTP Transport hardening**:
  - Bearer token auth with HMAC-SHA256 timing-safe verification (eliminates length timing oracle)
  - `WWW-Authenticate: Bearer realm="MCP Dataverse"` header auto-sent on 401
  - Configurable CORS via `MCP_HTTP_CORS_ORIGIN` env var
  - GET/DELETE requests without a `sessionId` now return 400 instead of silently failing
  - `enableJsonResponse` toggle via `MCP_HTTP_JSON_RESPONSE` env var for non-streaming clients

### Changed

- Schema: `confirm` parameter uses `const: true` on all destructive tools (uniform guardrail)
- Preflight: `hasSysAdmin` environment flag now handled in `checkPrerequisites` before tool dispatch
- Quality: `detect_duplicates` caches `EntitySetName` to eliminate redundant metadata calls per invocation
- Code: `attribute.tools.ts` split into `attribute.definitions.ts` (JSON schemas, 253 lines) + `attribute.tools.ts` (handlers, 202 lines) — both under the 400-line file limit
- `config.example.json` renamed to `config.example.jsonc` (supports comments)

### Fixed

- `MultiSelectPicklist` attribute type now correctly uses `OptionSetType: "MultiSelect"` (not `"Picklist"`)
- Batch executor: request body boundary now uses CRLF (`\r\n`) per RFC 2046 spec
- `dataverse_search`: URL now constructed from `environmentUrl` config (eliminates relative `../../` path hack)
- `dataverse_execute_function`: aliased typed parameters now correctly passed (not coerced to strings)
- `dataverse_execute_bound_function`: namespace prefix correctly applied when calling bound functions
- Metadata write operations: `MSCRM.MergeLabels: true` header added on all PUT/PATCH calls to preserve multi-language label translations
- `createRelationship`: reads `OData-EntityId` response header (metadata POST returns 204 No Content with no body)
- `buildLookupRelationshipBody`: SchemaName formula no longer generates double publisher prefix; 100-char length guard added
- `suggest_tools`: no longer surfaces non-callable internal tools to the AI agent

---

## [0.3.8] — 2026-03-02

### Changed

- **README** cleaned up — removed Battle-Tested section, removed Smithery/MCP Registry links (not yet listed), simplified troubleshooting
- **Roadmap v0.4** now includes Azure AD app registration and Managed Identity auth methods
- **Roadmap simplified** — removed MCP Resources milestone (tools already cover solutions, views, option sets), promoted Prompts to v0.5, moved OBO to ideas backlog
- **Docs site** switched to light theme with automatic dark mode (follows OS preference), modern accent colors
- **Community page** simplified — focus on testers, removed contributing/code sections

---

## [0.3.7] — 2026-03-02

### Added

- **GitHub Pages documentation site** — full Jekyll + Just the Docs theme at `codeurali.github.io/mcp-dataverse`
- New doc pages: Getting Started, Roadmap, Community, Capabilities, 5 Use-Case guides
- **Roadmap v0.4** expanded with schema consistency reinforcement (parameter naming, `errorCategory`, preflight checks)
- **Upcoming auth methods** documented — Azure AD (Client Credentials) and Managed Identity planned, architecture confirmed ready

### Changed

- CAPABILITIES.md updated to 63 tools, version alignment, ETag fix documented
- README.md refreshed with new docs site URLs and community links
- CHANGELOG backfilled with all versions from v0.2.0 through v0.3.6

---

## [0.3.6] — 2026-03-02

### Fixed

- **BUG-021 final fix** — `dataverse_update_entity`: `HasNotes` now sent as plain `boolean` (was incorrectly wrapped in `{ Value: bool }` — Dataverse expects `Edm.Boolean`, not `BooleanManagedProperty`)
- `dataverse_update_entity`: graceful error handling for `0x80060888` — returns structured JSON with actionable suggestions (e.g. enable org-level audit) instead of raw exception
- `IsAuditEnabled` / `ChangeTrackingEnabled` both return clear guidance when the operation is blocked at org level

---

## [0.3.5] — 2026-03-01

### Fixed

- **BUG-021** — `dataverse_update_entity`: `IsAuditEnabled` wrapped as `BooleanManagedProperty` (`{ Value: bool }`); `@odata.type: "#Microsoft.Dynamics.CRM.EntityMetadata"` added to PATCH body
- **BUG-022** — `dataverse_assign_role_to_user`: idempotence now functional — pre-check via `$expand=systemuserroles_association` before `associate`; returns `"already_assigned"` if role already present
- **BUG-023** — `dataverse_remove_role_from_user`: idempotence now functional — pre-check before `disassociate`; returns `"not_assigned"` if role absent

---

## [0.3.4] — 2026-03-01

### Added

- `dataverse_list_connection_references` — list Connection References in the environment (active/inactive count, connector details)

---

## [0.3.3] — 2026-03-01

### Added

- `dataverse_list_roles` — list Dataverse security roles with optional `nameContains` filter
- `dataverse_assign_role_to_user` — assign a security role to a user (`confirm: true` required)
- `dataverse_remove_role_from_user` — remove a security role from a user (`confirm: true` required)

---

## [0.3.2] — 2026-03-01

### Added

- `dataverse_update_entity` — modify entity metadata flags (HasNotes, ChangeTracking, Audit) with `confirm: true` required; auto-publishes by default
- `dataverse_create_environment_variable` — create an environment variable definition + value in Dataverse (`confirm: true` required)
- **Write guardrails** — `checkWriteGuardrails` on destructive tools surfaces `[WARN] DESTRUCTIVE_OP` in `data.warnings[]`

---

## [0.3.1] — 2026-03-01

### Fixed

- **BUG-018** — `dataverse_query`: `count=true` now shows total in summary (`"N records returned from X (total in dataset: Y)"`)
- **BUG-019** — `dataverse_get`: `expand` parameter now properly forwarded to `getRecord` (was silently ignored)
- **BUG-020** — `formattedValues: true` parameter added to `dataverse_query`, `dataverse_get`, `dataverse_execute_fetchxml`, `dataverse_retrieve_multiple_with_paging` — transmits `Prefer: odata.include-annotations` header; picklist fields return `{ value, label }` objects

### Added

- **Query guardrails** — `checkQueryGuardrails` surfaces warnings in response: `[WARN] NO_SELECT`, `[INFO] NO_FILTER`, `[WARN] LARGE_RESULT_SET`

---

## [0.3.0] — 2026-03-01

### Added

- `dataverse_list_workflows` — **reimplemented**: queries the real Dataverse `workflows` entity (Cloud Flows, Business Rules, Classic Workflows); supports `category`, `nameContains`, `top` parameters
- `dataverse_get_workflow` — **reimplemented**: retrieves a Dataverse Process by GUID with enriched `categoryLabel` / `stateLabel`
- `dataverse_list_guides` — new tool replacing old `list_workflows` behavior (lists 10 built-in MCP operational guides)
- `dataverse_get_guide` — new tool replacing old `get_workflow` behavior (returns step-by-step MCP guide by name)

### Fixed

- **BUG-013** — `dataverse_get_attribute_option_set`: summary showed "0 options" — handler used `Options` (PascalCase) but client returns `options` (camelCase)
- **BUG-014** — `dataverse_list_dependencies`: summary showed "1 dependencies" — fallback wrapped entire result object; now reads `count` directly
- **BUG-015** — `dataverse_retrieve_multiple_with_paging`: summary showed "X records across 1 pages" — used `result.pages` instead of `result.pageCount`
- `dataverse_publish_customizations`: added 120 s timeout for `PublishAllXml` / `PublishXml` (previously timed out on large solutions)
- `dataverse_list_users`: removed `.refine()` — all parameters now truly optional
- `dataverse_batch_execute`: summary now correctly shows `"2/2 operations succeeded"` instead of `"0/N"`
- `dataverse_solution_components`: summary count now accurate
- `dataverse_create_annotation`: actionable error message when `HasNotes=false` (instructions to enable Notes in Power Apps maker portal)

### Improved

- Enriched error messages across 6 tools: `get_environment_variable`, `set_workflow_state`, `execute_action`, `execute_bound_action`, `execute_bound_function`, `change_detection`

---

## [0.2.0] — 2026-02-28

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
