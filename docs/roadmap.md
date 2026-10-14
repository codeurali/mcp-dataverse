---
title: Roadmap
description: What MCP Dataverse has shipped, what is implemented but not yet released, and what is planned next.
---

# Roadmap

MCP Dataverse follows semantic versioning. This page tracks what has shipped, what is merged but unreleased, and what is planned. Every item marked as released is in the [CHANGELOG](https://github.com/codeurali/mcp-dataverse/blob/master/CHANGELOG.md).

---

## Released

| Version | Date | Highlights | Status |
| :------ | :--- | :--------- | :----- |
| 0.7.10 | 2026-10-13 | MCP Registry publication fix | <Status kind="done">Released</Status> |
| 0.7.9 | 2026-10-10 | Startup crash fix on clean `npx` installs ([#5](https://github.com/codeurali/mcp-dataverse/issues/5)) | <Status kind="done">Released</Status> |
| 0.7.7 | 2026-07-21 | `npx mcp-dataverse update` command | <Status kind="done">Released</Status> |
| 0.7.6 | 2026-07-21 | `dataverse_create_web_resource`, `dataverse_set_table_icon`, `iconVectorName` on `create_table`; five MCP Apps (table browser, FetchXML workbench, plugin trace viewer, schema explorer, RBAC inspector) | <Status kind="done">Released</Status> |
| 0.7.5 | 2026-04-14 | Four regression fixes on `check_record_access`, `merge_records`, `create_relationship` | <Status kind="done">Released</Status> |
| 0.7.0 | 2026-04-12 | `create_table`, `create_relationship`, record-level access (`check_record_access`, `grant_access`, `revoke_access`), `merge_records` | <Status kind="done">Released</Status> |
| 0.6.0 | 2026-04-12 | Four MCP resources and five MCP prompts | <Status kind="done">Released</Status> |
| 0.5.0 | 2026-03-24 | Client credentials, managed identity, Entra JWT validation for inbound HTTP | <Status kind="done">Released</Status> |
| 0.4.x | 2026-03-05 to 2026-03-08 | Streamable HTTP transport, attribute CRUD (`create_attribute`, `update_attribute`, `delete_attribute`, lookup columns), consistent parameter naming, `errorCategory` in error responses, Web API audit fixes | <Status kind="done">Released</Status> |

Also available today: FetchXML auto-pagination (`fetchAll=true` on `dataverse_execute_fetchxml`, cookie paging up to 100 pages or 50,000 records).

---

## Implemented, not yet released

These changes are merged on `master` and listed under *Unreleased* in the CHANGELOG.

| Item | Status |
| :--- | :----- |
| **Read-only mode** (`MCP_READ_ONLY=true`): expose only the 64 read-only tools and refuse every other call | <Status kind="progress">Unreleased</Status> |
| Annotations on the six tools that had none, so clients and read-only mode classify every tool | <Status kind="progress">Unreleased</Status> |
| MCP `structuredContent` and `outputSchema` on all 81 core tools, so clients receive typed results instead of parsing text | <Status kind="progress">Unreleased</Status> |
| Idle HTTP session eviction (`MCP_HTTP_SESSION_TTL_MS`, default 30 minutes) | <Status kind="progress">Unreleased</Status> |
| `MCP_HTTP_REQUIRE_AUTH=true` strict mode: the HTTP server refuses to start without inbound authentication | <Status kind="progress">Unreleased</Status> |
| Salted key derivation for at-rest encryption of cached credentials | <Status kind="progress">Unreleased</Status> |
| `MCP_TRANSPORT` and `MCP_HTTP_PORT` environment variables honoured at startup | <Status kind="progress">Unreleased</Status> |

---

## Planned

| Item | Status |
| :--- | :----- |
| Global option set CRUD: create, update and delete shared option sets (read tools already exist) | <Status kind="planned">Planned</Status> |
| Alternate key CRUD: define and manage entity keys for upsert scenarios (read tool already exists) | <Status kind="planned">Planned</Status> |
| Native credential storage (Windows DPAPI, macOS Keychain) | <Status kind="planned">Planned</Status> |

## Under consideration

Solution import and export (`ExportSolution`, `ImportSolution`) is not scheduled. The solution list and component tools were removed in 0.4.6 to keep application lifecycle management out of scope, and this item would reverse that decision.

---

## Feature requests

Have an idea? [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with the `enhancement` label.
