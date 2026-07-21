# Plan: Table Icon Support

## Summary

Add the ability to set, read, and manage icons on model-driven app tables (entities) via the MCP Dataverse server. Icons are web resources referenced by `IconVectorName` (SVG, preferred), `IconLargeName`, `IconMediumName`, or `IconSmallName` (PNG, legacy) properties on `EntityMetadata`.

**New tools:** 2 (`dataverse_create_web_resource`, `dataverse_set_table_icon`)
**Modified tools:** 3 (`dataverse_create_table`, `dataverse_get_table_metadata`, `dataverse_list_tables`)
**Estimated effort:** ~220 lines across 8 files. No new dependencies.

---

## Verified API Endpoints

| # | Operation | Method | Endpoint | Doc |
|---|---|---|---|---|
| 1 | Create web resource | `POST` | `{org}/api/data/v9.2/webresourceset` | [webresource EntityType](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/webresource) |
| 2 | Create table with icon | `POST` | `{org}/api/data/v9.2/EntityDefinitions` | [Create table definitions](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-update-entity-definitions-using-web-api#create-table-definitions) |
| 3 | Set icon on existing table | `PATCH` | `{org}/api/data/v9.2/EntityDefinitions(LogicalName='x')` | [Update table definitions](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-update-entity-definitions-using-web-api#update-table-definitions) |
| 4 | Read table metadata (incl. icons) | `GET` | `{org}/api/data/v9.2/EntityDefinitions(LogicalName='x')` | [EntityMetadata reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/entitymetadata) |
| 5 | List tables (incl. IconVectorName) | `GET` | `{org}/api/data/v9.2/EntityDefinitions?$select=...,IconVectorName` | (same as above) |

### EntityMetadata Icon Properties

All are plain `Edm.String` — no OData type wrapper needed.

| Property | Description |
|---|---|
| `IconVectorName` | SVG vector icon web resource name (modern, preferred) |
| `IconLargeName` | 32x32 image web resource name (legacy) |
| `IconMediumName` | 16x16 image web resource name (legacy) |
| `IconSmallName` | Small image web resource name (legacy) |

### webresourcetype Codes

| Code | Format | Use for |
|---|---|---|
| 5 | PNG | `IconLargeName`, `IconMediumName` |
| 6 | JPG | `IconLargeName`, `IconMediumName` |
| 7 | GIF | legacy |
| 10 | ICO | legacy |
| **11** | **SVG** | **`IconVectorName`** (recommended) |

---

## Phase 1 — Web Resource Upload (prerequisite)

Icons must exist as web resources before a table can reference them. No existing tool creates web resources.

### New file: `src/tools/webresource.tools.ts`

**Tool: `dataverse_create_web_resource`**

| Param | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Unique name with publisher prefix, e.g. `new_icon.svg` |
| `displayName` | string | yes | Human-friendly label |
| `webResourceType` | enum | yes | `"SVG"` \| `"PNG"` \| `"JPG"` \| `"GIF"` \| `"ICO"` |
| `contentBase64` | string | yes | Base64-encoded file bytes |
| `description` | string | no | Optional description |

Returns: `webresourceid` (GUID) and `name`.

### Modify: `src/dataverse/dataverse-client.ts`

Add method on `DataverseClient`:

```typescript
async createWebResource(body: Record<string, unknown>): Promise<string>
```

POSTs to `webresourceset`, returns the web resource GUID from the response. Same pattern as existing `createRecord()` or `createEntityDefinition()`.

---

## Phase 2 — Read Icon Data

### Modify: `src/dataverse/types.ts`

Add to `EntityMetadata` interface:

```typescript
IconVectorName?: string;
IconLargeName?: string;
IconMediumName?: string;
```

### Modify: `src/dataverse/dataverse-client.ts` (line 154)

Add `,IconVectorName` to the `$select` in `listTables()`. No other icon fields needed on list — `IconVectorName` is the modern one, keep it lean.

### No change needed: `getTableMetadata()`

Already fetches the full entity definition without `$select`, so all icon properties are returned by Dataverse automatically. `simplifyMetadata()` passes them through (they're plain strings).

---

## Phase 3 — Set Icon on Table Creation

### Modify: `src/tools/schema.tools.defs.ts`

Add optional `iconVectorName` property to `dataverse_create_table` input schema:

```json
"iconVectorName": {
  "type": "string",
  "description": "Optional SVG web resource name for the table icon (e.g., 'new_myicon.svg'). Requires the web resource to exist first."
}
```

### Modify: `src/tools/schema.tools.ts`

1. Add `iconVectorName` to `CreateTableInput` Zod schema (optional string)
2. In `handleCreateTable()`, before `createEntityDefinition(body)`, conditionally add:

```typescript
if (input.iconVectorName) {
  body["IconVectorName"] = input.iconVectorName;
}
```

`IconVectorName` is `Edm.String` — no `@odata.type` wrapper needed, same as `SchemaName`.

---

## Phase 4 — Set/Change Icon on Existing Tables

### Modify: `src/tools/metadata-write.tools.ts`

Add a new dedicated tool (follows the "one tool, one concern" pattern used everywhere else — `dataverse_create_attribute` vs `dataverse_update_attribute`, etc.).

**Tool: `dataverse_set_table_icon`**

| Param | Type | Required | Description |
|---|---|---|---|
| `entityLogicalName` | string | yes | Logical name of the table |
| `iconVectorName` | string | no | SVG web resource name (set `""` to remove) |
| `iconLargeName` | string | no | Legacy 32x32 PNG web resource name |
| `iconMediumName` | string | no | Legacy 16x16 PNG web resource name |
| `confirm` | boolean | yes | Must be `true` to confirm schema modification |

Validation: at least one of `iconVectorName`, `iconLargeName`, `iconMediumName` must be provided.

Handler:

```typescript
async function handleSetTableIcon(args, client) {
  // 1. Parse + validate input (Zod)
  // 2. Guardrails check
  // 3. Verify entity exists (preflight)
  // 4. Build PATCH body with only the provided icon properties
  // 5. await client.updateEntityDefinition(logicalName, body)
  // 6. formatData() response
}
```

Reuses existing `client.updateEntityDefinition()` — no new client method needed. PATCH body example:

```json
{ "IconVectorName": "new_myicon.svg" }
```

Pass `""` (empty string) to remove an icon.

---

## Phase 5 — Tool Registration

### Modify: `src/server.ts`

```typescript
// New import
import { webresourceTools, handleWebresourceTool } from "./tools/webresource.tools.js";

// New registry entry (insert alphabetically or after fileTools)
{ tools: webresourceTools, handler: handleWebresourceTool },
```

`dataverse_set_table_icon` is added to the existing `metadataWriteTools` array and handled by the existing `handleMetadataWriteTool` switch statement — no new registration needed.

---

## Files Changed Summary

| # | File | Change | Lines |
|---|---|---|---|
| 1 | `src/tools/webresource.tools.ts` | **New** — `dataverse_create_web_resource` tool + handler | ~100 |
| 2 | `src/dataverse/dataverse-client.ts` | Add `createWebResource()` method | ~15 |
| 3 | `src/dataverse/dataverse-client.ts` | Add `IconVectorName` to `listTables()` `$select` | 1 |
| 4 | `src/dataverse/types.ts` | Add `IconVectorName?`, `IconLargeName?`, `IconMediumName?` | 3 |
| 5 | `src/tools/schema.tools.defs.ts` | Add `iconVectorName` to `dataverse_create_table` schema | ~5 |
| 6 | `src/tools/schema.tools.ts` | Add `iconVectorName` to Zod + body builder | ~10 |
| 7 | `src/tools/metadata-write.tools.ts` | New `dataverse_set_table_icon` tool + handler | ~80 |
| 8 | `src/server.ts` | Register `webresourceTools` | ~3 |

**Total: ~217 lines across 8 files. No new dependencies. No breaking changes.**

---

## Typical Workflow

```
# 1. Upload icon as web resource
dataverse_create_web_resource({
  name: "new_project_icon.svg",
  displayName: "Project Icon",
  webResourceType: "SVG",
  contentBase64: "PHN2ZyB4bWxucz0i..."
})

# 2. Option A — Set icon at table creation
dataverse_create_table({
  schemaName: "new_project",
  displayName: "Project",
  displayCollectionName: "Projects",
  iconVectorName: "new_project_icon.svg"
})

# 2. Option B — Set icon on existing table
dataverse_set_table_icon({
  entityLogicalName: "new_project",
  iconVectorName: "new_project_icon.svg",
  confirm: true
})

# 3. Verify
dataverse_get_table_metadata({ logicalName: "new_project" })
# → IconVectorName: "new_project_icon.svg"
```

---

## Implementation Order

1. Phase 1 (web resource upload) — prerequisite for everything else
2. Phase 2 (types + metadata read) — no dependencies
3. Phase 3 (create with icon) — depends on Phase 2 types
4. Phase 4 (update icon) — depends on Phase 2 types
5. Phase 5 (registration) — last, ties everything together
