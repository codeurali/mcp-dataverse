---
layout: default
title: Getting Started
nav_order: 2
permalink: /getting-started
---

# Getting Started

Quick start guide for MCP Dataverse — an MCP server exposing 63 AI-callable tools for Microsoft Dataverse.

## Prerequisites

- **Node.js 20+**
- A **Dataverse environment** with a licensed user account (e.g. `https://yourorg.crm.dynamics.com`)
- An MCP-compatible client (VS Code + Copilot, Claude Desktop, Cursor, etc.)

## Installation

### Recommended — Interactive CLI

```bash
npx mcp-dataverse install
```

The wizard will:

1. Ask for your Dataverse environment URL
2. Save configuration to `~/.mcp-dataverse/config.json`
3. Register the server in VS Code via `code --add-mcp`
4. Authenticate with your Microsoft account (device code flow)

### Manual Configuration

Create `~/.mcp-dataverse/config.json`:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "requestTimeoutMs": 30000,
  "maxRetries": 3
}
```

See [multi-client-setup.md](multi-client-setup.md) for client-specific configuration.

## Configuration Options

| Option             | Type   | Default | Description                                               |
| ------------------ | ------ | ------- | --------------------------------------------------------- |
| `environmentUrl`   | string | —       | Your Dataverse org URL (must be `https://*.dynamics.com`) |
| `requestTimeoutMs` | number | `30000` | HTTP request timeout in milliseconds                      |
| `maxRetries`       | number | `3`     | Retry count on transient errors (0–10)                    |

## Environment Variables

All config values can be set via environment variables (useful for MCP client `env` blocks):

| Variable             | Maps to                             |
| -------------------- | ----------------------------------- |
| `DATAVERSE_ENV_URL`  | `environmentUrl`                    |
| `REQUEST_TIMEOUT_MS` | `requestTimeoutMs`                  |
| `MAX_RETRIES`        | `maxRetries`                        |
| `MCP_CONFIG_PATH`    | Path to a custom `config.json` file |

**Priority**: environment variables > `MCP_CONFIG_PATH` > `~/.mcp-dataverse/config.json` > `./config.json`.

## Authentication

MCP Dataverse uses **Microsoft device code flow** (MSAL Public Client) — no Azure AD app registration or PAT required.

### First connection

Authentication triggers on the **first tool call** after the server starts:

1. Open the VS Code **Output** panel → select **MCP**
2. A sign-in prompt appears with a device code (auto-copied to clipboard)
3. Open `https://microsoft.com/devicelogin`, paste the code, sign in with your work account
4. The Output panel confirms: `Authenticated ✓`

> If the device code times out, simply retry the tool call — a fresh code is generated automatically. If authentication fails repeatedly, restart the MCP server.

### Subsequent launches

Tokens are cached encrypted (AES-256-GCM) in `~/.mcp-dataverse/`. Renewal is fully silent — no prompt needed until the refresh token expires (~90 days of inactivity).

To force re-authentication:

```bash
npx mcp-dataverse-auth https://yourorg.crm.dynamics.com
```

### Upcoming authentication methods
{: .d-inline-block }

Planned
{: .label .label-yellow }

The authentication architecture is built on a pluggable `AuthProvider` interface with a factory pattern — adding new auth strategies requires no breaking changes. Two additional methods are planned:

| Method | Use case | Status |
|:-------|:---------|:-------|
| **Azure AD app registration** (Client Credentials) | Service-to-service, CI/CD pipelines, unattended scenarios | 🔜 Planned |
| **Managed Identity** | Azure-hosted deployments (App Service, Container Apps, Azure VM) — zero-secret auth | 🔜 Planned |

Both will be selectable via a `authMethod` configuration option (`"device-code"` / `"client-credentials"` / `"managed-identity"`).

## Running the Server

### Stdio transport (default)

Used by VS Code, Claude Desktop, Cursor, and most MCP clients:

```bash
npx mcp-dataverse
```

### HTTP transport

For clients that connect over HTTP (or for shared/remote access):

```bash
npx mcp-dataverse --transport http --port 3001
```

The MCP endpoint is available at `http://localhost:3001/mcp`.

## Diagnostics

Run the built-in health check to verify your configuration and connectivity:

```bash
npx mcp-dataverse doctor
```

This checks:

- Configuration file validity
- Dataverse environment reachability
- Authentication token status
- API connectivity (WhoAmI)

## Next Steps

- [Multi-client setup](multi-client-setup.md) — configure VS Code, Claude Desktop, Cursor, and more
- [Querying data](use-cases/querying-data.md) — OData, FetchXML, search
- [Inspecting schema](use-cases/inspecting-schema.md) — tables, columns, relationships
- [Managing records](use-cases/managing-records.md) — CRUD, batch, associations
- [Solutions & customizations](use-cases/solutions-and-customizations.md)
- [Delta sync](use-cases/delta-sync.md) — change tracking for incremental sync
