---
layout: default
title: Auth — Device Code (Local)
nav_order: 5
permalink: /auth-device-code
---

# Authentication — Device Code (Default)

> **Use this when:** you run the MCP server **locally** on your laptop and want to connect to
> Dataverse as yourself — no App Registration, no secrets to manage.

---

## What it is

The simplest authentication method. The MCP server authenticates **as you** using your normal
Microsoft work account — the same identity you use to access Power Apps, make.powerapps.com, etc.

The flow:

1. The server prints a short URL and a code in the Output panel
2. You open the URL in a browser and type the code
3. You sign in with your Microsoft account (once)
4. The server caches the token; re-authentication happens automatically every ~90 days

Think of it as: the MCP server borrows your identity for the duration of your work session.

**No client secret. No App Registration in Entra. No Azure setup.**

---

## Flow diagram

```
Developer laptop
┌──────────────────────────────────────────────────────┐
│                                                      │
│  VS Code / Claude Desktop / Cursor                   │
│         │                                            │
│         │ MCP tool call (stdio transport)            │
│         ▼                                            │
│  MCP Server (node process)                           │
│         │                                            │
│         │ 1. No cached token — initiates device code │
│         ▼                                            │
│  MSAL Public Client                                  │
│  clientId: 1950a258-… (Microsoft Azure PowerShell)   │
└──────────────┬───────────────────────────────────────┘
               │
               │ 2. POST /oauth2/v2.0/devicecode
               ▼
     Entra ID (login.microsoftonline.com)
               │
               │ 3. Returns device_code + user_code + verification_uri
               │
               ▼ displayed in Output panel
     https://microsoft.com/devicelogin  ←── Developer opens in browser
               │  enters user_code
               │  signs in (+ MFA if required)
               │
               │ 4. Long-poll: POST /oauth2/v2.0/token (every 5 s, up to 5 min)
               │
               ▼
     Access Token + Refresh Token returned to MSAL
               │
               │ 5. Token cached to ~/.mcp-dataverse/msal-cache.json (AES-256-GCM)
               ▼
     Dataverse API (https://yourorg.crm.dynamics.com)
```

---

## Prerequisites

- A licensed Dataverse environment (`https://yourorg.crm.dynamics.com`)
- A work account that can sign in to that environment
- A browser available on the machine (the URL can be opened on any device)

No Azure portal access, no App Registration, no admin consent needed.

---

## Configuration

### Minimal `config.json`

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com"
}
```

`device-code` is the default `authMethod` — you do not need to write it explicitly.
Equivalent explicit form:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "authMethod": "device-code"
}
```

### Where to place `config.json`

| Location                                    | When used                                           |
| :------------------------------------------ | :-------------------------------------------------- |
| `~/.mcp-dataverse/config.json`              | Recommended — shared across all projects            |
| `./config.json` (next to the server binary) | Local override — used when the above does not exist |
| Custom path                                 | Set `MCP_CONFIG_PATH=/path/to/my-config.json`       |

### Environment variables

Each config value can be set via env vars (useful in MCP client `env` blocks):

| Variable             | Config key         | Notes                                |
| :------------------- | :----------------- | :----------------------------------- |
| `DATAVERSE_ENV_URL`  | `environmentUrl`   | Overrides the URL from `config.json` |
| `REQUEST_TIMEOUT_MS` | `requestTimeoutMs` | Default: `30000` ms                  |
| `MAX_RETRIES`        | `maxRetries`       | Default: `3`                         |
| `MCP_CONFIG_PATH`    | —                  | Path to a custom config file         |

**Priority:** env vars → `MCP_CONFIG_PATH` → `~/.mcp-dataverse/config.json` → `./config.json`

---

## First connection

Authentication happens on the **first tool call**, not on server start.

1. Open the **Output** panel in VS Code (View → Output → select **MCP**)
2. You will see:
   ```
   To sign in, use a web browser to open https://microsoft.com/devicelogin
   and enter the code ABCD-EFGH to authenticate.
   ```
3. The code is auto-copied to your clipboard (Windows and macOS only)
4. Open the URL, paste the code, sign in
5. The panel confirms:
   ```
   Authenticated ✓
   ```

Subsequent calls are silent — the token is restored from the encrypted cache.

---

## Verify the connection

```bash
npx mcp-dataverse doctor
```

### First run (no cached token)

```
✅ Config loaded — authMethod: device-code
⏳ Initiating device code flow…
   Open https://microsoft.com/devicelogin and enter ABCD-EFGH
```

After signing in:

```
✅ Token acquired (device-code)
✅ WhoAmI OK → UserId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Org: yourorg
```

### Subsequent runs (cached token)

```
✅ Config loaded — authMethod: device-code
✅ Token acquired (device-code / cached)
✅ WhoAmI OK → UserId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Org: yourorg
```

Then call `dataverse_whoami` from your MCP client to confirm the full round-trip.

---

## Token cache

| Detail                 | Value                                                     |
| :--------------------- | :-------------------------------------------------------- |
| Cache file             | `~/.mcp-dataverse/msal-cache.json`                        |
| Encryption             | AES-256-GCM, key derived from `COMPUTERNAME` + `USERNAME` |
| Access token lifetime  | ~1 hour (refreshed automatically from the refresh token)  |
| Refresh token lifetime | ~90 days (silent re-authentication via MSAL)              |
| After 90 days          | Device code prompt appears again once                     |

To force re-authentication (useful if the account changes or if the cache becomes corrupt):

```bash
rm ~/.mcp-dataverse/msal-cache.json   # Linux / macOS
del %USERPROFILE%\.mcp-dataverse\msal-cache.json  # Windows cmd
```

---

## Annexe — Technical internals

### MSAL client used

Device code flow uses the well-known **Microsoft Azure PowerShell** public client:

```
clientId: 1950a258-227b-4e31-a9cf-717495945fc2
```

This is a Microsoft-owned application that is pre-consented in every Entra tenant.
No custom App Registration is required. The resulting token has the same access rights
as an interactive user with the same account.

### Token scope

The scope requested is `{environmentUrl}/.default` — this grants the same Dataverse permissions
the user has through their security roles. No scope administration is needed.

### Why this does not work on a server

Device code flow requires a human to open a URL in a browser. Servers have no browser.
If you need the MCP server to run unattended (Docker, App Service, CI/CD), use:

- [auth-azure-credentials.md](auth-azure-credentials.md) — service principal with a client secret
- [auth-testing-guide.md](auth-testing-guide.md#method-3--managed-identity) — Managed Identity (Azure-only, no secrets)

---

## See also

- [auth-azure-credentials.md](auth-azure-credentials.md) — unattended / CI-CD mode
- [auth-entra-jwt.md](auth-entra-jwt.md) — hosted HTTP server with per-user Entra JWT
- [auth-testing-guide.md](auth-testing-guide.md) — quick comparison table
