# MCP Dataverse Server

![MCP Dataverse Logo](assets/logo.webp)

![Node 20+](https://img.shields.io/badge/Node.js-20%2B-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue) ![MCP](https://img.shields.io/badge/MCP-1.0-purple) ![npm](https://img.shields.io/npm/v/mcp-dataverse) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

MCP server that exposes the Microsoft Dataverse Web API as **50 AI-callable tools** — enabling GitHub Copilot, Claude, and other MCP clients to query, create, and manage Dataverse records without hallucinating schema.

## Install

### One-click (VS Code)

[![Install in VS Code](https://img.shields.io/badge/VS%20Code-Install-0078d4?logo=visualstudiocode)](https://vscode.dev/redirect/mcp/install?name=mcp-dataverse&config=%7B%22args%22%3A%5B%22-y%22%2C%22mcp-dataverse%22%5D%2C%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22env%22%3A%7B%22DATAVERSE_ENV_URL%22%3A%22%24%7Binput%3Adataverse_env_url%7D%22%2C%22AUTH_MODE%22%3A%22%24%7Binput%3Adataverse_auth_mode%7D%22%2C%22PAC_PROFILE_NAME%22%3A%22%24%7Binput%3Adataverse_pac_profile%7D%22%7D%7D&inputs=%5B%7B%22id%22%3A%22dataverse_env_url%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22Dataverse%20URL%20%28e.g.%20https%3A%2F%2Fyourorg.crm.dynamics.com%29%22%7D%2C%7B%22default%22%3A%22pac%22%2C%22id%22%3A%22dataverse_auth_mode%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22Auth%20mode%3A%20pac%20%28default%29%20or%20msal%22%7D%2C%7B%22default%22%3A%22default%22%2C%22id%22%3A%22dataverse_pac_profile%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22PAC%20CLI%20profile%20name%20%28default%3A%20default%29%22%7D%5D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS%20Code%20Insiders-Install-24bfa5?logo=visualstudiocode)](https://insiders.vscode.dev/redirect/mcp/install?name=mcp-dataverse&config=%7B%22args%22%3A%5B%22-y%22%2C%22mcp-dataverse%22%5D%2C%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22env%22%3A%7B%22DATAVERSE_ENV_URL%22%3A%22%24%7Binput%3Adataverse_env_url%7D%22%2C%22AUTH_MODE%22%3A%22%24%7Binput%3Adataverse_auth_mode%7D%22%2C%22PAC_PROFILE_NAME%22%3A%22%24%7Binput%3Adataverse_pac_profile%7D%22%7D%7D&inputs=%5B%7B%22id%22%3A%22dataverse_env_url%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22Dataverse%20URL%20%28e.g.%20https%3A%2F%2Fyourorg.crm.dynamics.com%29%22%7D%2C%7B%22default%22%3A%22pac%22%2C%22id%22%3A%22dataverse_auth_mode%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22Auth%20mode%3A%20pac%20%28default%29%20or%20msal%22%7D%2C%7B%22default%22%3A%22default%22%2C%22id%22%3A%22dataverse_pac_profile%22%2C%22password%22%3Afalse%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22PAC%20CLI%20profile%20name%20%28default%3A%20default%29%22%7D%5D)

> VS Code will prompt for your Dataverse URL, auth mode, and PAC profile during installation.

### Command line

```bash
# VS Code
code --add-mcp '{"name":"mcp-dataverse","command":"npx","args":["-y","mcp-dataverse"]}'

# VS Code Insiders
code-insiders --add-mcp '{"name":"mcp-dataverse","command":"npx","args":["-y","mcp-dataverse"]}'
```

### Manual (mcp.json)

Add to your `.vscode/mcp.json` (or user settings):

```json
{
  "servers": {
    "dataverse": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-dataverse"]
    }
  }
}
```

## Prerequisites

- Node.js 20+
- PAC CLI installed & authenticated → [aka.ms/PowerAppsCLI](https://aka.ms/PowerAppsCLI)
- VS Code + GitHub Copilot (Agent mode)

## Quick Start (< 5 min)

### 1. Clone & install

```bash
git clone <repo-url> mcp-dataverse && cd mcp-dataverse
npm install
```

### 2. Configure

```bash
cp config.example.json config.json
```

Edit `config.json`:

| Field              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `environmentUrl`   | Your org URL, e.g. `https://yourorg.crm.dynamics.com` |
| `authMode`         | `"pac"` (recommended) or `"msal"`                     |
| `pacProfileName`   | PAC CLI profile name (default: `"default"`)           |
| `requestTimeoutMs` | HTTP timeout in ms (default: `30000`)                 |
| `maxRetries`       | Retry count on transient errors (default: `3`)        |

### 3. Authenticate

```bash
npm run auth:setup
```

Runs device code authentication. Follow the URL printed to the terminal — sign in with your Power Platform account. Token is cached in `.msal-cache.json` for silent reuse.

> Only required for `authMode: "pac"`. Skip if PAC CLI (`pac auth create`) is already authenticated.

### 4. Build

```bash
npm run build
```

### 5. Verify the connection

```bash
npx tsx tests/live/test-whoami.ts
```

Expected output:

```
WhoAmI result: { UserId: 'xxxxxxxx-...', BusinessUnitId: 'xxxxxxxx-...', OrganizationId: 'xxxxxxxx-...' }
```

### 6. Configure VS Code

`.vscode/mcp.json` is already present in this repo. If you need to add it manually:

```json
{
  "servers": {
    "dataverse": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/server.js"],
      "env": {}
    }
  }
}
```

1. Restart VS Code
2. Open GitHub Copilot chat → switch to **Agent mode** (⚡)
3. Test: _"List the Dataverse tables in my environment"_

---

## Tools (50)

| Tool                                         | Category      | Description                                                                         |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `dataverse_whoami`                           | Auth          | Verify connection; returns UserId, BusinessUnitId, OrgId                            |
| `dataverse_list_tables`                      | Metadata      | List all tables (`customOnly` filter available)                                     |
| `dataverse_get_table_metadata`               | Metadata      | Full schema: columns, types, logical names                                          |
| `dataverse_get_relationships`                | Metadata      | All 1:N, N:1, N:N relationships for a table; filter by `relationshipType`           |
| `dataverse_list_global_option_sets`          | Metadata      | All global option sets in the environment                                           |
| `dataverse_get_option_set`                   | Metadata      | Options and values for a specific option set                                        |
| `dataverse_get_entity_key`                   | Metadata      | Alternate key definitions for a table (fields, index status, customizable flag)     |
| `dataverse_query`                            | Query         | OData query with `$select`, `$filter`, `$orderby`, `$expand`, `$count`              |
| `dataverse_execute_fetchxml`                 | Query         | Raw FetchXML for aggregations and complex joins                                     |
| `dataverse_retrieve_multiple_with_paging`    | Query         | Paginated query following `@odata.nextLink`, with configurable `maxTotal` cap       |
| `dataverse_get`                              | CRUD          | Retrieve a single record by GUID                                                    |
| `dataverse_create`                           | CRUD          | Create a record; returns the new GUID                                               |
| `dataverse_update`                           | CRUD          | Patch a record — only specified fields are changed                                  |
| `dataverse_delete`                           | CRUD          | Delete a record (requires explicit confirm)                                         |
| `dataverse_upsert`                           | CRUD          | Create-or-update via alternate key                                                  |
| `dataverse_assign`                           | CRUD          | Assign a record to a different user or team owner                                   |
| `dataverse_associate`                        | Relations     | Associate two records via a named relationship                                      |
| `dataverse_disassociate`                     | Relations     | Remove an association between two records                                           |
| `dataverse_execute_action`                   | Actions       | Execute a global (unbound) Dataverse action                                         |
| `dataverse_execute_function`                 | Actions       | Execute a global read-only function (e.g. `WhoAmI`)                                 |
| `dataverse_execute_bound_action`             | Actions       | Execute an action bound to a specific record                                        |
| `dataverse_execute_bound_function`           | Actions       | Execute an OData bound function on a specific record                                |
| `dataverse_retrieve_dependencies_for_delete` | Actions       | Check what components block deletion of a Dataverse component                       |
| `dataverse_list_dependencies`                | Actions       | List component dependencies before modifying or deleting                            |
| `dataverse_batch_execute`                    | Batch         | Up to 1000 operations in a single HTTP batch request; optional atomic changeset     |
| `dataverse_change_detection`                 | Tracking      | Delta tracking using change tokens to detect record changes since last sync         |
| `dataverse_solution_components`              | Solution      | List all components in a named solution; filter by component type code              |
| `dataverse_publish_customizations`           | Solution      | Publish pending customizations (all or targeted entities/web resources/option sets) |
| `dataverse_impersonate`                      | Impersonation | Execute any tool on behalf of another Dataverse user via `MSCRMCallerId`            |
| `dataverse_list_custom_actions`              | Customization | Lists custom actions (custom API / SDK messages) in the environment                 |
| `dataverse_list_plugin_steps`                | Customization | Lists plugin step registrations with stage, mode, entity, and state                 |
| `dataverse_get_environment_variable`         | Environment   | Retrieve an environment variable definition and current value                       |
| `dataverse_set_environment_variable`         | Environment   | Set or update an environment variable value                                         |
| `dataverse_get_plugin_trace_logs`            | Trace         | Retrieve plugin execution trace logs for debugging                                  |
| `dataverse_get_workflow_trace_logs`          | Trace         | Retrieve async workflow/system job execution logs                                   |
| `dataverse_search`                           | Search        | Full-text Relevance Search across all configured tables                             |
| `dataverse_get_audit_log`                    | Audit         | Retrieve audit trail for a record showing change history                            |
| `dataverse_detect_duplicates`                | Quality       | Check for potential duplicates before creating a record                             |
| `dataverse_get_annotations`                  | Annotations   | Retrieve notes and file attachments linked to a record                              |
| `dataverse_list_users`                       | Users         | Search system users by name or email with BU filtering                              |
| `dataverse_get_user_roles`                   | Users         | Security roles assigned to a system user                                            |
| `dataverse_create_annotation`                | Annotations   | Create a note or file attachment linked to a record                                 |
| `dataverse_get_attribute_option_set`         | Metadata      | Local/entity-specific option set values (statecode, statuscode, picklist)           |
| `dataverse_list_solutions`                   | Solution      | List all solutions in the environment                                               |
| `dataverse_set_workflow_state`               | Customization | Enable or disable a workflow or process                                             |
| `dataverse_list_views`                       | Views         | List system and personal saved views for a table                                    |
| `dataverse_upload_file_column`               | Files         | Upload binary content to a file/image column on a record                            |
| `dataverse_download_file_column`             | Files         | Download binary content from a file/image column on a record                        |
| `dataverse_list_business_units`              | Org           | List business units in the environment (org hierarchy)                              |
| `dataverse_list_teams`                       | Teams         | List Dataverse teams with optional filter by team type                              |

---

## Advanced Configuration (MSAL)

For service-principal auth (CI/CD, unattended), set `authMode: "msal"` in `config.json`:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "authMode": "msal",
  "tenantId": "<azure-ad-tenant-id>",
  "clientId": "<app-registration-client-id>",
  "clientSecret": "<client-secret>"
}
```

> The app registration must have the **Dynamics CRM → user_impersonation** API permission and the corresponding Dataverse security role.

---

## Scripts

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `npm run build`            | Compile TypeScript → `dist/`        |
| `npm run dev`              | Watch mode — no build step needed   |
| `npm start`                | Start the compiled server           |
| `npm run auth:setup`       | One-time device code authentication |
| `npm run typecheck`        | Type-check without emitting output  |
| `npm run lint`             | ESLint on `src/`                    |
| `npm run test:unit`        | Unit tests only                     |
| `npm run test:integration` | Integration tests                   |
| `npm test`                 | All tests                           |

---

## Architecture

TypeScript MCP server over **stdio** transport. An `AuthProvider` (PAC CLI or MSAL) injects Bearer tokens into a native-`fetch`-based `HttpClient` wrapped by `DataverseClient`. Each tool module registers handlers with the MCP `Server` instance.

```
GitHub Copilot → stdio → MCP Server → Tool Router → DataverseClient → Dataverse Web API v9.2
                                                           └── AuthProvider (PAC CLI | MSAL)
```

---

## Security

- **Never commit `config.json`** or `.msal-cache.json` — both are in `.gitignore`
- Tokens are never logged; only diagnostic messages are written to stderr
- PAC CLI tokens are scoped to the authenticated user — no privilege escalation
- Service principal (`msal`) should be assigned the least-privilege Dataverse security role

---

## Troubleshooting

| Symptom                                    | Fix                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `No MSAL accounts found`                   | Run `npm run auth:setup` to re-authenticate                          |
| `"https://" is required`                   | Check `environmentUrl` in `config.json` — must start with `https://` |
| `pac: command not found`                   | Install PAC CLI and run `pac auth create --environment <url>`        |
| Server not appearing in Copilot Agent mode | Restart VS Code; check **Output → MCP** panel for errors             |
