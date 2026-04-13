# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — [Semantic Versioning](https://semver.org/).

---

## [0.7.5] — 2026-04-14

### Fixed

- **BUG-041 — `dataverse_check_record_access` bound-function regression**: `RetrievePrincipalAccess` is a **bound** OData function on the principal entity (system user or team), not a standalone function. The previous implementation called it as an unbound function, causing runtime failures. Fixed: `executeBoundFunction(principalEntitySet, principalId, "RetrievePrincipalAccess", { Target })`. All 10 access-check tests now pass.
- **BUG-A — `dataverse_merge_records` missing `@odata.type`**: The `updateContent` payload was missing the mandatory `@odata.type` annotation (`application/json;type=entry`), causing the Merge action to reject non-empty update bodies. `@odata.type` is now injected automatically before the OData POST.
- **BUG-024 — `dataverse_create_relationship` lookup prefix**: The auto-generated lookup column name (`referencingEntity + "id"`) incorrectly reused the referencing entity schema name without deriving its publisher prefix. The prefix is now extracted directly from `referencingEntity` (first segment before `_`). Example: `account → new_testcr01` now correctly produces `new_accountid`.
- **BUG-B — `dataverse_merge_records` custom entity error**: Merging custom entities returned an opaque OData stack trace. The tool now catches the unsupported-entity error and returns a clear, actionable message explaining that `Merge` is restricted to OOB entity types (Account, Contact, Lead, Incident).

---

## [0.7.0] — 2026-04-12

### Added

- **`dataverse_create_table`** — Create a new custom entity (table) in Dataverse by POSTing to `/EntityDefinitions`. Accepts schema name, display names, ownership type (`UserOwned` / `OrganizationOwned`), notes, activities, audit flags, and primary name column config. Returns the new `metadataId`.
- **`dataverse_create_relationship`** — Create a One-to-Many or Many-to-Many relationship via `/RelationshipDefinitions`. Supports cascade delete configuration (1:N) and custom intersect entity names (N:N). Returns the new `metadataId`.
- **`dataverse_check_record_access`** — Check which access rights a user or team holds on a specific record using the `RetrievePrincipalAccess` OData function. Returns parsed rights list (`ReadAccess`, `WriteAccess`, etc.).
- **`dataverse_grant_access`** — Grant record-level sharing to a user or team via the `GrantAccess` Dataverse action. Supports all standard AccessMask rights.
- **`dataverse_revoke_access`** — Revoke all shared access from a user or team via the `RevokeAccess` Dataverse action.
- **`dataverse_merge_records`** — Merge two records of the same type via the `Merge` Dataverse action. The subordinate is deactivated and its data carried over to the target. Requires `confirm: true` to prevent accidental execution.

### Internal

- **`src/tools/schema.tools.ts`** — New module with `schemaTools` array and `handleSchemaTool` dispatcher.
- **`src/tools/record-access.tools.ts`** — New module with `recordAccessTools` array and `handleRecordAccessTool` dispatcher.
- **`src/dataverse/dataverse-client.metadata.ts`** — Added `createEntityDefinition(body)` method (POST `/EntityDefinitions`, extracts GUID from `OData-EntityId` response header).
- **`src/tools/router.tools.ts`** — Added tags and descriptions for all 6 new tools.
- **`tests/unit/schema-tools.test.ts`** and **`tests/unit/record-access-tools.test.ts`** — 25 new tests; total test suite: 691.

### Stats

- 79 tools (was 73) · 4 MCP resources · 5 MCP prompts · 27 categories

---

## [0.6.0] — 2026-04-12

### Added

- **MCP Prompts** — 5 pre-built workflow prompts exposed via the MCP `prompts/list` + `prompts/get` protocol endpoints. Clients that support MCP Prompts (Claude, Copilot) can invoke them as slash commands or one-click workflow starters:
  - `analyze-org-health` — Complete org health check: identity, table inventory, security roles, workflow health, plugin steps, audit logging.
  - `data-quality-check` — Data quality analysis for a table (required arg: `tableName`, optional: `sampleSize`): null rates, duplicates, stale records, referential integrity.
  - `schema-review` — Expert schema review for a table (required arg: `tableName`): columns, naming conventions, relationships, alternate keys, views.
  - `security-audit` — Security model audit: users, roles, over-privileged accounts, teams, business unit hierarchy.
  - `analyze-workflow` — Workflow/flow analysis (optional args: `workflowName`, `statusFilter`): ownership, execution traces, plugin overlap, modernisation candidates.
- **`prompts: {}` capability** — `server.ts` now advertises prompt support in the MCP server capabilities block.

### Internal

- **`src/prompts/prompt-provider.ts`** — Prompt catalogue (`PROMPTS` array) + `listPrompts()` / `getPrompt(name, args)` public API. Each builder function renders the step-by-step prompt text with the exact tool names the AI should call.
- **`tests/unit/prompt-provider.test.ts`** — 28 unit tests covering: prompt count, argument definitions, error handling (unknown name, missing required arg), tool name references per prompt, and argument interpolation.

---

## [0.5.0] — 2026-03-24

### Added

- **Client Credentials auth** — App Registration-based service identity for unattended scenarios: CI/CD pipelines, Docker, Azure services. Configured via `authMethod: "client-credentials"` plus `tenantId`, `clientId`, and `clientSecret` (or `AZURE_CLIENT_SECRET` env var — recommended over config file).
- **Managed Identity auth** — zero-secret outbound auth for Azure-hosted deployments (App Service, Container Apps, Azure VMs). Supports both system-assigned and user-assigned identities (`managedIdentityClientId`). Configured via `authMethod: "managed-identity"`.
- **Entra JWT inbound validation** — when the server runs in HTTP transport mode, bearer tokens are validated against Entra ID JWKS. Implements RFC 9728 `/.well-known/oauth-protected-resource` for automatic MCP client discovery. Validation covers RS256 signature, issuer (`login.microsoftonline.com/{tenantId}/v2.0`), audience (bare GUID), required scope, `exp`/`nbf`, and 30-second clock skew. JWKS is cached with automatic rotation on `kid` miss.
- **`authMethod` config option** — selects the auth provider: `"device-code"` (default, unchanged behavior), `"client-credentials"`, or `"managed-identity"`. Also available as the `AUTH_METHOD` environment variable.
- **New environment variables** — `AUTH_METHOD`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_MANAGED_IDENTITY_CLIENT_ID` map to their config equivalents. Documented in `config.example.jsonc`.

### Documentation

- New `/authentication` section with one page per method: Device Code, Client Credentials, Managed Identity. Includes Azure platform setup steps, Dataverse App User registration, environment variable reference, and a sequence diagram for the hosted flow.

### Internal

- **`src/auth/auth-provider.interface.ts`** — `AuthProvider` contract; all providers implement `getToken(resource): Promise<string>`.
- **`src/auth/auth-provider.factory.ts`** — Reads `authMethod` from config/env and instantiates the correct provider. Adding a new method requires no changes outside the factory.
- **`src/auth/client-credentials-auth-provider.ts`** — MSAL confidential client flow (client_credentials grant) with in-memory token cache.
- **`src/auth/managed-identity-auth-provider.ts`** — Azure IMDS token endpoint (`169.254.169.254`); falls back to `DefaultAzureCredential`-style resolution for user-assigned identities.
- **`src/auth/entra-jwt-validator.ts`** — HTTP middleware; validates inbound Bearer tokens for the HTTP server.
- **`src/auth/crypto-utils.ts`** — JWKS fetch + caching utilities extracted into a shared module.

---

## [0.4.7] — 2026-03-08

### Fixed

- **BUG-035 — `dataverse_add_role_privileges` wrong action name**: The OData bound action for adding privileges to a role is `AddPrivilegesRole` (no "To"). A spurious "To" introduced in a previous fix session caused `0x80060888 Resource not found` errors. Fixed in `role-privileges.tools.ts`; action name is now driven by the `CRM_BOUND_ACTIONS` constants file to prevent recurrence.
- **BUG-036 — `dataverse_replace_role_privileges` wrong action name**: Same root cause — `ReplacePrivilegesRole` (no "To") is the correct Dataverse OData action name. Fixed identically.
- **`scripts/check-file-size.js` false positive**: The line counter used `.split('\n').length` which counted a trailing newline as a phantom extra line, causing `dataverse-client.ts` (450 real lines) to fail the 450-line limit check. Fixed with `.trimEnd()` before splitting.

### Internal

- **`src/dataverse/crm-action-names.ts`** — New constants file (`CRM_BOUND_ACTIONS`, `CRM_FUNCTIONS`) as single source of truth for all Dataverse CRM action/function names. JSDoc links to the official Microsoft WebAPI reference. Prevents inline string typos for all future callers.
- **`tests/unit/role-privileges-tools.test.ts`** — 13 new contract tests including explicit `.not.toContain("To")` guards on action names. Total test suite: 588 tests.

---

## [0.4.6] — 2026-03-08

### Added

- **`dataverse_create_sitemap`** — New tool to create or update a model-driven app sitemap. Builds the XML structure from `areas` (groups) containing `sub_areas` (entries), publishes it to Dataverse, and optionally attaches it to an existing App Module via `appModuleUniqueName`. Zod-validated inputs; idempotent upsert via GET + conditional PATCH.

### Fixed

- **BUG-038 — `dataverse_suggest_tools` phantom registry**: `TOOL_TAGS` and `TOOL_DESCRIPTIONS` in `router.tools.ts` previously held arbitrary string keys that were out-of-sync with the real tool registry (phantom entries, missing real tools). Both maps are now rebuilt against the live 73-tool registry — every key is a real callable tool name. `suggest_tools` and `list_tool_tags` now return accurate routing guidance.
- **`dataverse_get_role_privileges` — documentation enriched**: Description now documents the Dataverse OData quirk where the entity set for role privileges is named `roleprivilegess` (double‑s). A FetchXML join pattern using `roleprivileges` ↔ `privilege` is included as a reliable alternative when the OData endpoint returns empty results.

### Removed

- **`dataverse_list_solutions`** — Removed. Listing solutions has low AI-agent utility and is adequately covered by the Dataverse UI or PAC CLI for human operators.
- **`dataverse_solution_components`** — Removed. Superseded; component management is out of scope for AI-agent automation at this stage.
- **`dataverse_add_solution_component`** — Removed. ALM operations require human review and are better handled via dedicated ALM tools (PAC CLI, pipelines).
- **`dataverse_remove_solution_component`** — Removed. Same rationale as above.

---

## [0.4.5] — 2026-03-06

### Fixed

- **BUG-033 — `dataverse_search`: `querytype` invalid as top-level parameter**: The `searchType: "full"` option was incorrectly sent as `body.querytype = "full"` (top-level). Per the Search API v2.0 spec, `querytype` belongs inside the serialized `options` string. `searchType: "full"` now maps to `body.options = '{"querytype":"lucene"}'`. `searchType: "simple"` (default) produces no `options` field.
- **BUG-034 — `dataverse_search`: `select` invalid as top-level parameter**: The `select` parameter was sent as a top-level field in the request body, which is not recognized by the v2.0 API. Selected columns must be per entity (`selectColumns`). `select` is now embedded inside each object of the `entities` array as `selectColumns`.
- **BUG-035 — `dataverse_search`: `entities` must be a JSON-serialized string**: The `entities` array was sent as a native JSON array. The Search API v2.0 requires `entities` to be a **JSON-serialized string** of entity objects (`"[{\"name\":\"account\",...}]"`), not a native array. Parameter is now serialized via `JSON.stringify(entityObjects)`.
- **BONUS — `facets` and `orderby` serialized as JSON strings**: Per the v2.0 API spec (both parameters typed as `string`), `facets` and `orderby` are now passed as `JSON.stringify(...)` of their arrays, not as native arrays.

---

## [0.4.4] — 2026-03-06

### Fixed

- **BUG-029 — `isError` absent from `content[0].text` body**: All tool errors returned `result.isError = true` at the MCP envelope level, but the inner `content[0].text` JSON body did not include `isError`. AI agents that parse the text body would not detect the error and could try to use the result as valid data. `output.utils.ts` now consistently sets `isError: true` inside the serialized text body whenever `errorCategory` is present.
- **BUG-032 — `dataverse_search`: `returntotalrecordcount` invalid in v2.0 payload**: The `returntotalrecordcount` parameter from the v1.0 API was still being sent in the v2.0 request body. The correct v2.0 parameter is `count` (boolean). Removed `returntotalrecordcount`; the v2.0 API already returns counts via `QueryContext.@Search.totalCount` in the response.

---

## [0.4.3] — 2026-03-06

### Fixed

- **BUG-025 — `dataverse_update_entity`: suggestions included non-modifiable attributes**: The suggestion list returned after a preflight failure or as guidance could include read-only system attributes. The suggestion generator now filters to modifiable attributes only.
- **BUG-028 — `dataverse_delete_attribute`: raw exception on protected columns**: Deleting OOB (out-of-box) attributes or columns with active dependencies raised an unhandled exception. The tool now catches `0x80048405` (managed attribute) and `HAS_DEPENDENCIES` codes and returns a structured error with `errorCategory: "SCHEMA_MISMATCH"` and an actionable message.
- **BUG-030 — `dataverse_update_entity`: missing preflight check**: Large metadata PATCH calls could fail mid-way if environment prerequisites were not met. A `hasSysAdmin` preflight check is now performed before executing any write.
- **BUG-031 — `dataverse_search`: `searchMode` invalid as top-level parameter in v2.0**: The `searchMode` parameter (valid in v1.0) is not a recognized top-level parameter in the v2.0 API. Removed from the request body to eliminate `0x80048d19` deserialization errors.

---

## [0.4.2] — 2026-03-07

### Changed

- **Uniform camelCase parameter names in `dataverse_create_annotation`**: `notetext` → `noteText`, `filename` → `fileName`, `mimetype` → `mimeType`, `documentbody` → `documentBody`. Dataverse wire field names in the POST body are unchanged.
- **`errorCategory` in all structured error responses**: `formatPrerequisiteError` now automatically infers and includes `errorCategory` (`ENV_LIMITATION` for `feature_disabled`, `PERMISSIONS` for `permission_required`, `SCHEMA_MISMATCH` for `schema_missing`). `dataverse_delete_attribute` (error codes `0x80048405`, `HAS_DEPENDENCIES`) and `dataverse_update_entity` (`0x80060888`) also include `errorCategory: "SCHEMA_MISMATCH"` in their error payloads.
- **`dataverse_search` expanded error detection**: The Relevance Search disabled check now uses a comprehensive regex covering HTTP 403/404/400, `0x80048D0B` (official Dataverse error code for disabled search), `search disabled`, `search not configured`, and `search unavailable` messages — up from 2 patterns to 7.
- **Search API upgraded to v2.0**: The Dataverse search endpoint is now `/api/search/v2.0/query` (was `v1.0`, which is legacy/deprecated).

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
