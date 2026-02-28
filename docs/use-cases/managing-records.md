# Managing Records

Tools for creating, updating, deleting, and linking Dataverse records.

## Creating Records — `dataverse_create`

Creates a new record and returns the GUID.

> **Tip**: Use [`dataverse_get_table_metadata`](inspecting-schema.md) first to confirm required fields and correct logical names.

### Example: Create a contact

```json
{
  "entitySetName": "contacts",
  "data": {
    "firstname": "Jane",
    "lastname": "Doe",
    "emailaddress1": "jane.doe@contoso.com",
    "_parentcustomerid_value": "00000000-0000-0000-0000-000000000001"
  }
}
```

> For lookup fields, use the `_fieldname_value` format with the related record's GUID.

**Response:**

```json
{
  "summary": "Created record abc12345-... in contacts",
  "data": { "id": "abc12345-...", "message": "Record created successfully" },
  "suggestions": [
    "Use dataverse_get to retrieve the full record",
    "Use dataverse_associate to link related records"
  ]
}
```

Annotations: `readOnlyHint: false`, `destructiveHint: false`.

---

## Updating Records — `dataverse_update`

Updates an existing record using **PATCH semantics** — only the fields you provide are changed.

### Example: Update a contact's email

```json
{
  "entitySetName": "contacts",
  "id": "abc12345-0000-0000-0000-000000000001",
  "data": {
    "emailaddress1": "jane.new@contoso.com"
  }
}
```

### Optimistic concurrency with etag

Prevent lost updates by passing the `etag` from a prior `dataverse_get`:

```json
{
  "entitySetName": "contacts",
  "id": "abc12345-0000-0000-0000-000000000001",
  "data": { "telephone1": "+1-555-0199" },
  "etag": "W/\"12345678\""
}
```

If the record was modified by someone else since the GET, the update fails with a `412 Precondition Failed` error instead of silently overwriting.

---

## Upserting with Alternate Keys — `dataverse_upsert`

Create-or-update a record without knowing its GUID — match by alternate key instead.

> Use [`dataverse_get_entity_key`](inspecting-schema.md#alternate-keys) to discover available keys.

### Example: Upsert by single alternate key

```json
{
  "entitySetName": "accounts",
  "alternateKey": "new_accountnumber",
  "alternateKeyValue": "ACC-2025-001",
  "data": {
    "name": "Contoso Ltd",
    "revenue": 5000000
  }
}
```

### Example: Compound alternate key

```json
{
  "entitySetName": "new_projects",
  "alternateKeys": { "new_projectcode": "PRJ-100", "new_region": "EMEA" },
  "data": { "new_status": 1 }
}
```

### Mode control

| Mode                 | Behavior                                |
| -------------------- | --------------------------------------- |
| `"upsert"` (default) | Creates if not found, updates if exists |
| `"createOnly"`       | Fails if the record already exists      |
| `"updateOnly"`       | Fails if the record does not exist      |

Annotations: `idempotentHint: true`.

---

## Deleting Records — `dataverse_delete`

Permanently deletes a record. **Irreversible** — `confirm: true` is required.

```json
{
  "entitySetName": "contacts",
  "id": "abc12345-0000-0000-0000-000000000001",
  "confirm": true
}
```

If `confirm` is omitted or `false`, the server returns a safety message without deleting.

Annotations: `destructiveHint: true`.

---

## Associating N:N Relationships — `dataverse_associate`

Links two records via a named relationship. Use [`dataverse_get_relationships`](inspecting-schema.md#exploring-relationships) to find the `relationshipName`.

```json
{
  "entitySetName": "contacts",
  "id": "abc12345-...",
  "relationshipName": "contactleads_association",
  "relatedEntitySetName": "leads",
  "relatedId": "def67890-..."
}
```

## Disassociating Relationships — `dataverse_disassociate`

Removes a link between two records.

```json
{
  "entitySetName": "contacts",
  "id": "abc12345-...",
  "relationshipName": "contactleads_association",
  "relatedEntitySetName": "leads",
  "relatedId": "def67890-..."
}
```

Annotations: `destructiveHint: true` (removes a relationship).

---

## Batch Operations — `dataverse_batch_execute`

Executes up to 1000 operations in a single HTTP `$batch` request.

### Example: Bulk create contacts

```json
{
  "requests": [
    {
      "method": "POST",
      "url": "contacts",
      "body": { "firstname": "Alice", "lastname": "Smith" }
    },
    {
      "method": "POST",
      "url": "contacts",
      "body": { "firstname": "Bob", "lastname": "Jones" }
    },
    {
      "method": "POST",
      "url": "contacts",
      "body": { "firstname": "Carol", "lastname": "Lee" }
    }
  ],
  "useChangeset": true
}
```

With `useChangeset: true`, all operations are atomic — if one fails, all are rolled back.

**Response:**

```json
{
  "summary": "Batch executed: 3/3 operations succeeded",
  "data": { "results": [], "count": 3 },
  "suggestions": [
    "Use batch for bulk create/update operations to reduce HTTP round-trips"
  ]
}
```

### Mixed operations

```json
{
  "requests": [
    { "method": "GET", "url": "accounts?$select=name&$top=1" },
    {
      "method": "PATCH",
      "url": "contacts(abc12345-...)",
      "body": { "jobtitle": "Manager" }
    },
    { "method": "DELETE", "url": "tasks(def67890-...)" }
  ]
}
```

> GET requests are excluded from changesets. Only POST, PATCH, DELETE are wrapped in atomic transactions.

---

## Assigning Records — `dataverse_assign`

Changes the owner of a record to a different user or team.

```json
{
  "entitySetName": "accounts",
  "id": "abc12345-...",
  "ownerType": "systemuser",
  "ownerId": "user-guid-here"
}
```

To assign to a team:

```json
{
  "ownerType": "team",
  "ownerId": "team-guid-here"
}
```

---

## Related

- [Inspecting schema](inspecting-schema.md) — confirm field names and types before writing
- [Querying data](querying-data.md) — read data after creating or updating
- [Delta sync](delta-sync.md) — detect changes after modifications
