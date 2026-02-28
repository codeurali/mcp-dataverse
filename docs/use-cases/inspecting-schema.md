# Inspecting Schema

Tools for exploring Dataverse table definitions, columns, relationships, option sets, and alternate keys.

> All schema tools have `readOnlyHint: true` — they only read metadata.

## Listing Tables — `dataverse_list_tables`

Returns all tables in the environment. Custom tables only by default.

### Example: List custom tables

```json
{}
```

### Example: Include system tables

```json
{
  "includeSystemTables": true
}
```

**Response:**

```json
{
  "summary": "24 tables (custom only) found.",
  "data": [
    {
      "logicalName": "account",
      "displayName": "Account",
      "entitySetName": "accounts"
    },
    {
      "logicalName": "new_project",
      "displayName": "Project",
      "entitySetName": "new_projects"
    }
  ],
  "suggestions": [
    "Use dataverse_get_table_metadata to inspect a specific table's columns and types"
  ]
}
```

> With `includeSystemTables: true`, expect 1700+ tables. Use this sparingly.

---

## Table Metadata — `dataverse_get_table_metadata`

Returns full column definitions: logical names, display names, data types, required levels, and lookup targets.

### Example: Inspect the account table

```json
{
  "logicalName": "account",
  "includeAttributes": true
}
```

**Response (abbreviated):**

```json
{
  "summary": "Metadata for account: 142 attributes",
  "data": {
    "LogicalName": "account",
    "EntitySetName": "accounts",
    "PrimaryIdAttribute": "accountid",
    "PrimaryNameAttribute": "name",
    "Attributes": [
      {
        "LogicalName": "name",
        "DisplayName": "Account Name",
        "AttributeType": "String",
        "RequiredLevel": "ApplicationRequired"
      },
      {
        "LogicalName": "revenue",
        "DisplayName": "Annual Revenue",
        "AttributeType": "Money"
      },
      {
        "LogicalName": "_parentaccountid_value",
        "DisplayName": "Parent Account",
        "AttributeType": "Lookup",
        "Targets": ["account"]
      }
    ]
  },
  "suggestions": [
    "Use dataverse_query to read records from this table",
    "Use dataverse_get_relationships to see related tables"
  ]
}
```

### Key fields to note

| Field           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `EntitySetName` | Use this in `dataverse_query` and `dataverse_get`          |
| `LogicalName`   | Column name for `$select`, `$filter`, and record data      |
| `RequiredLevel` | `ApplicationRequired` = mandatory when creating records    |
| `AttributeType` | Data type: String, Money, Lookup, DateTime, Picklist, etc. |
| `Targets`       | For Lookups — which tables the lookup can reference        |

Set `includeAttributes: false` to get only table-level metadata (faster).

---

## Exploring Relationships — `dataverse_get_relationships`

Returns 1:N, N:1, and N:N relationship definitions for a table.

### Example: All relationships for contact

```json
{
  "logicalName": "contact"
}
```

### Example: Only N:N relationships

```json
{
  "logicalName": "contact",
  "relationshipType": "ManyToMany"
}
```

**Response (abbreviated):**

```json
{
  "summary": "Relationships for contact",
  "data": {
    "oneToMany": [
      {
        "SchemaName": "contact_activity_parties",
        "ReferencingEntity": "activityparty",
        "ReferencingAttribute": "partyid"
      }
    ],
    "manyToOne": [
      {
        "SchemaName": "account_primary_contact",
        "ReferencedEntity": "account",
        "ReferencingAttribute": "parentcustomerid"
      }
    ],
    "manyToMany": [
      {
        "SchemaName": "contactleads_association",
        "Entity1LogicalName": "contact",
        "Entity2LogicalName": "lead"
      }
    ]
  }
}
```

Use the `SchemaName` as the `relationshipName` parameter in [`dataverse_associate`](managing-records.md#associating-nn-relationships) and `dataverse_disassociate`.

---

## Option Sets

### Global option sets — `dataverse_list_global_option_sets`

Lists all shared option sets in the environment:

```json
{}
```

### Global option set values — `dataverse_get_option_set`

Get the labels and integer values for a global option set:

```json
{
  "name": "budgetstatus"
}
```

### Attribute-level option set — `dataverse_get_attribute_option_set`

Get option values for a specific column on a specific table:

```json
{
  "entityLogicalName": "opportunity",
  "attributeLogicalName": "statuscode"
}
```

> Always look up option set values before using integer codes in `$filter` expressions.

---

## Alternate Keys — `dataverse_get_entity_key`

Returns alternate key definitions for a table — needed for [`dataverse_upsert`](managing-records.md#upserting-with-alternate-keys).

```json
{
  "tableName": "account"
}
```

**Response:**

```json
{
  "summary": "Alternate keys for account",
  "data": [
    {
      "SchemaName": "new_accountnumber_key",
      "KeyAttributes": ["new_accountnumber"],
      "EntityKeyIndexStatus": "Active"
    }
  ]
}
```

> Only keys with `EntityKeyIndexStatus: "Active"` can be used for upsert operations.

---

## Typical Workflow

1. **`dataverse_list_tables`** — find the table you need
2. **`dataverse_get_table_metadata`** — get column names, types, required fields
3. **`dataverse_get_relationships`** — understand how tables connect
4. **`dataverse_get_entity_key`** — check if alternate keys exist for upsert
5. Now [query](querying-data.md) or [manage records](managing-records.md) with confidence

---

## Related

- [Querying data](querying-data.md) — use schema knowledge to build correct queries
- [Managing records](managing-records.md) — create/update with the right field names
