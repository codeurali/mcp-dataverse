# Delta Sync

Incremental data synchronization using Dataverse change tracking.

## Overview

The `dataverse_change_detection` tool uses Dataverse's built-in change tracking (delta queries) to detect new, modified, and deleted records since a previous sync point. This avoids re-querying entire tables on every sync cycle.

> **Prerequisite**: Change tracking must be enabled on the target table in Dataverse settings (**Tables → Properties → Track changes**).

Annotations: `readOnlyHint: true`, `idempotentHint: true`.

---

## Initial Sync

On the first call, pass `deltaToken: null` to get an initial snapshot and receive a token for future calls.

```json
{
  "entitySetName": "accounts",
  "deltaToken": null,
  "select": ["name", "revenue", "modifiedon"]
}
```

**Response:**

```json
{
  "summary": "150 changed records detected",
  "data": {
    "newAndModified": [
      {
        "accountid": "abc12345-...",
        "name": "Contoso Ltd",
        "revenue": 5000000,
        "modifiedon": "2025-06-15T10:30:00Z"
      }
    ],
    "deleted": [],
    "nextDeltaToken": "8;pagingcookie=..."
  },
  "suggestions": [
    "Store the returned deltaToken for subsequent incremental sync"
  ]
}
```

> Store `nextDeltaToken` — you'll need it for all subsequent calls.

---

## Incremental Sync

Pass the stored `deltaToken` to retrieve only changes since the last sync:

```json
{
  "entitySetName": "accounts",
  "deltaToken": "8;pagingcookie=...",
  "select": ["name", "revenue", "modifiedon"]
}
```

**Response:**

```json
{
  "summary": "3 changed records detected",
  "data": {
    "newAndModified": [
      {
        "accountid": "def67890-...",
        "name": "Fabrikam Inc",
        "revenue": 3000000,
        "modifiedon": "2025-06-16T14:20:00Z"
      }
    ],
    "deleted": [{ "accountid": "old11111-..." }],
    "nextDeltaToken": "8;pagingcookie=...updated..."
  },
  "suggestions": [
    "Store the returned deltaToken for subsequent incremental sync"
  ]
}
```

Fields in the response:

| Field            | Description                                     |
| ---------------- | ----------------------------------------------- |
| `newAndModified` | Records created or updated since the last token |
| `deleted`        | IDs of records deleted since the last token     |
| `nextDeltaToken` | Token for the next incremental call             |

---

## Best Practices

### Always specify `$select`

```json
{
  "entitySetName": "contacts",
  "deltaToken": "...",
  "select": ["fullname", "emailaddress1", "modifiedon"]
}
```

Limiting columns keeps payloads small, especially for tables with many fields.

### Store tokens persistently

The `deltaToken` is your sync bookmark. Store it in a database, file, or environment variable between sync runs. If lost, you must re-do an initial sync (`deltaToken: null`).

### Handle deletions

The `deleted` array contains only record IDs (no other fields). Your sync logic should remove or mark these records as deleted in your target system.

### Recurring sync pattern

A typical integration loop:

1. **First run**: call with `deltaToken: null` → process all records → store `nextDeltaToken`
2. **Each subsequent run**: call with stored token → process changes → update stored token
3. **On error**: retry with the same token (the call is idempotent)
4. **Token expired**: if the token is too old (typically after 90 days), Dataverse returns an error — fall back to a full initial sync

### Combine with batch for writes

When syncing changes to another system, use [`dataverse_batch_execute`](managing-records.md#batch-operations) to push multiple updates efficiently.

---

## Limitations

| Limitation                              | Detail                                                     |
| --------------------------------------- | ---------------------------------------------------------- |
| Table must have change tracking enabled | Enable in Dataverse table properties                       |
| Token expiry                            | Tokens may expire after extended periods (~90 days)        |
| No field-level change detail            | You get the full record, not which specific fields changed |
| Deleted records                         | Only IDs are returned — no other field data                |

---

## Related

- [Querying data](querying-data.md) — for ad-hoc reads outside sync patterns
- [Managing records](managing-records.md) — write changes detected by sync
- [Inspecting schema](inspecting-schema.md) — verify table supports change tracking
