# Querying Data

Tools for reading data from Dataverse: OData queries, FetchXML, paging, and full-text search.

> All query tools have `readOnlyHint: true` — they never modify data.

## Simple OData Queries — `dataverse_query`

Query a single table using OData operators (`$filter`, `$select`, `$orderby`, `$top`, `$expand`, `$count`).

### Example: Active accounts sorted by name

```json
{
  "entitySetName": "accounts",
  "select": ["name", "revenue", "telephone1"],
  "filter": "statecode eq 0",
  "orderby": "name asc",
  "top": 10
}
```

**Response format:**

```json
{
  "summary": "Retrieved 10 records from accounts",
  "data": {
    "count": 10,
    "records": [
      { "name": "Contoso Ltd", "revenue": 5000000, "telephone1": "+1-555-0100" }
    ]
  },
  "suggestions": [
    "Use dataverse_execute_fetchxml for complex joins or aggregations",
    "Add $select to minimize payload"
  ]
}
```

### Example: Expand related data

```json
{
  "entitySetName": "contacts",
  "select": ["fullname", "emailaddress1"],
  "expand": "parentcustomerid_account($select=name)",
  "top": 5
}
```

### Server-side aggregation with `$apply`

```json
{
  "entitySetName": "opportunities",
  "apply": "groupby((statuscode),aggregate($count as count))"
}
```

---

## FetchXML for Complex Queries — `dataverse_execute_fetchxml`

Use FetchXML when you need aggregations, multi-entity joins, or operators not available in OData.

### Example: Count contacts per account

```json
{
  "fetchXml": "<fetch aggregate='true'><entity name='contact'><attribute name='contactid' aggregate='count' alias='total'/><link-entity name='account' from='accountid' to='parentcustomerid'><attribute name='name' groupby='true' alias='accountname'/></link-entity></entity></fetch>"
}
```

> `entitySetName` is optional — the server auto-extracts it from `<entity name="...">`.

**Response:**

```json
{
  "summary": "FetchXML returned 5 records",
  "data": {
    "records": [{ "accountname": "Contoso Ltd", "total": 42 }]
  },
  "suggestions": [
    "Use dataverse_query for simple OData reads",
    "Add page/count attributes for large result sets"
  ]
}
```

### When to use FetchXML over OData

| Scenario                            | Recommended tool                          |
| ----------------------------------- | ----------------------------------------- |
| Simple filter + select on one table | `dataverse_query`                         |
| Aggregations (count, sum, avg)      | `dataverse_execute_fetchxml`              |
| Multi-table joins                   | `dataverse_execute_fetchxml`              |
| N:N relationship traversal          | `dataverse_execute_fetchxml`              |
| Paging beyond 5000 records          | `dataverse_retrieve_multiple_with_paging` |

---

## Paging — `dataverse_retrieve_multiple_with_paging`

Automatically follows OData `@odata.nextLink` to retrieve all matching records across pages.

### Example: Export all active contacts

```json
{
  "entitySetName": "contacts",
  "select": ["fullname", "emailaddress1", "createdon"],
  "filter": "statecode eq 0",
  "maxTotal": 10000
}
```

**Response:**

```json
{
  "summary": "Retrieved 8,342 contacts across 2 pages",
  "data": {
    "totalRetrieved": 8342,
    "records": []
  },
  "suggestions": []
}
```

> Default `maxTotal` is 5000, maximum is 50000. Use `$select` to reduce payload size.

---

## Full-Text Search — `dataverse_search`

Searches across all Relevance Search-enabled tables. Returns ranked results with scores.

> Requires Relevance Search to be enabled in Dataverse admin settings.

### Example: Search for "Contoso" across all tables

```json
{
  "query": "Contoso",
  "top": 5
}
```

### Example: Scoped search with filter

```json
{
  "query": "project management",
  "entities": ["account", "contact"],
  "searchMode": "all",
  "filter": "statecode eq 0",
  "select": ["name", "emailaddress1"]
}
```

### Example: Lucene syntax (advanced)

```json
{
  "query": "\"power platform\" AND (consulting OR services)",
  "searchType": "full",
  "facets": ["@search.entityname", "statecode"]
}
```

---

## Best Practices

| Practice                                 | Why                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Always specify `$select`                 | Reduces payload size and improves performance                                                     |
| Use `$top` to limit results              | Prevents large result sets from overwhelming context                                              |
| Prefer server-side filtering (`$filter`) | Client-side filtering wastes bandwidth and misses records beyond 5000                             |
| Use `dataverse_get` for single records   | Faster than `dataverse_query` with a GUID filter                                                  |
| Check schema first                       | Use [`dataverse_get_table_metadata`](inspecting-schema.md) to confirm field names before querying |

---

## Related

- [Inspecting schema](inspecting-schema.md) — find correct table and column names
- [Managing records](managing-records.md) — create, update, delete records
- [Delta sync](delta-sync.md) — track changes incrementally
