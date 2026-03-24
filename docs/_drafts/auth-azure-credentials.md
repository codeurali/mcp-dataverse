---
layout: default
title: Auth — Azure Credentials (Service Principal)
nav_order: 6
permalink: /auth-azure-credentials
---

# Authentication — Azure Credentials (Client Credentials / Service Principal)

> **Use this when:** the MCP server runs **unattended** — on a server, in Docker, in a CI/CD
> pipeline — and needs to authenticate to Dataverse without any human interaction.

---

## What it is

The MCP server authenticates with its **own application identity** (an App Registration in Entra ID),
not with a user account. It exchanges a client secret for an access token using the
[OAuth 2.0 Client Credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow).

Think of it as: the MCP server has its own service account (clientId + secret). It logs in
automatically, no browser, no device code prompt.

**Use this when:**

- Running in Docker, on a VM, on-premises, or in any CI/CD pipeline
- You want a dedicated non-human identity with exact Dataverse permissions you control
- Running outside Azure (if inside Azure, [Managed Identity](auth-testing-guide.md#method-3--managed-identity) is strictly better — zero secrets)

**Do not use when:**

- Running locally for personal development → use [Device Code](auth-device-code.md) instead
- Hosted on Azure → prefer [Managed Identity](auth-testing-guide.md#method-3--managed-identity) (no secrets)

---

## Flow diagram

```
MCP Server (any host)
┌─────────────────────────────────────────────────┐
│                                                 │
│  ClientCredentialsAuthProvider                  │
│    clientId  = <App Registration appId>         │
│    clientSecret = <secret from env var>         │
│    authority = login.microsoftonline.com/{tid}  │
│                                                 │
│  1. acquireTokenByClientCredential()            │
└──────────────────┬──────────────────────────────┘
                   │
                   │ POST /oauth2/v2.0/token
                   │ grant_type=client_credentials
                   │ scope=https://yourorg.crm.dynamics.com/.default
                   ▼
         Entra ID (login.microsoftonline.com)
                   │
                   │ Access token (1 hour)
                   │ No refresh token — re-acquired 60 s before expiry
                   ▼
         Dataverse API
                   │
                   │ Authorized as Application User
                   ▼
         Results → MCP → Client
```

Token is cached in memory; no disk cache. On expiry, a new token is silently acquired.

---

## Prerequisites

|                                    |                                                           |
| :--------------------------------- | :-------------------------------------------------------- |
| Entra tenant + Azure portal access | To create the App Registration                            |
| Dataverse admin access             | To create the Application User and assign a security role |
| `pac` CLI (optional)               | For automated Application User creation                   |

---

## Setup — step by step

### Step 1 — Create an App Registration

In **Azure portal → Entra ID → App Registrations → New registration**:

- Name: e.g. `mcp-dataverse-svc`
- Supported account types: `Single tenant (…only)`
- No redirect URI needed

Note the **Application (client) ID** — this is your `clientId`.
Note the **Directory (tenant) ID** — this is your `tenantId`.

Alternatively via CLI:

```bash
az ad app create --display-name "mcp-dataverse-svc" --sign-in-audience AzureADMyOrg
# Note the appId output
```

### Step 2 — Generate a client secret

In the App Registration → **Certificates & secrets → New client secret**:

- Description: `mcp-server-prod`
- Expiry: 12 months (set a calendar reminder to rotate before expiry)
- Copy the **Value** immediately — it is only shown once

```bash
az ad app credential reset --id <appId> --display-name "mcp-server-prod"
# Outputs: appId, password (secret), tenant
```

> ⚠️ **The secret is sensitive.** Never put it in `config.json` committed to Git.
> Use an environment variable or Key Vault reference.

### Step 3 — Create an Application User in Dataverse

Dataverse does not automatically trust an Entra App Registration.
You must explicitly register it as an Application User and assign a security role.

```bash
# Register the App ID with Dataverse
pac admin application register --application-id <appId>

# Assign a security role to the Application User
pac admin assign-user \
  --environment https://yourorg.crm.dynamics.com \
  --user <appId> \
  --role "System Administrator" \
  --application-user
```

> **Principle of least privilege:** assign the minimum role needed for the MCP operations you
> intend to use. A read-only role is sufficient if the server only reads data.

Alternatively, in the Power Platform admin center:
**Environment → Settings → Users + permissions → Application users → New app user**
→ select the App Registration → assign the security role.

### Step 4 — Configure `config.json`

Put the IDs in the file — **not the secret**:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "authMethod": "client-credentials",
  "tenantId": "YOUR_TENANT_ID",
  "clientId": "YOUR_APP_CLIENT_ID"
}
```

Pass the secret via environment variable:

```bash
# Linux / macOS
export AZURE_CLIENT_SECRET="your-secret-value"

# Windows PowerShell
$env:AZURE_CLIENT_SECRET = "your-secret-value"

# Windows cmd
set AZURE_CLIENT_SECRET=your-secret-value
```

#### For CI/CD pipelines

**GitHub Actions:**

```yaml
- name: Run MCP Doctor
  env:
    DATAVERSE_ENV_URL: ${{ vars.DATAVERSE_ENV_URL }}
    AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
  run: npx mcp-dataverse doctor
```

**Azure DevOps:**

```yaml
- task: PowerShell@2
  env:
    DATAVERSE_ENV_URL: $(DATAVERSE_ENV_URL)
    AZURE_CLIENT_SECRET: $(AZURE_CLIENT_SECRET)
  inputs:
    targetType: inline
    script: npx mcp-dataverse doctor
```

#### Docker (environment variable injection)

```bash
docker run \
  -e DATAVERSE_ENV_URL="https://yourorg.crm.dynamics.com" \
  -e AZURE_CLIENT_SECRET="your-secret-value" \
  -v $(pwd)/config.json:/app/config.json \
  mcp-dataverse
```

---

## Configuration reference

| Config key / Env var                   | Type   | Required | Notes                          |
| :------------------------------------- | :----- | :------: | :----------------------------- |
| `environmentUrl` / `DATAVERSE_ENV_URL` | string |    ✅    | Dataverse org URL              |
| `authMethod`                           | string |    ✅    | Must be `"client-credentials"` |
| `tenantId`                             | string |    ✅    | Entra tenant ID                |
| `clientId`                             | string |    ✅    | App Registration `appId`       |
| `clientSecret` / `AZURE_CLIENT_SECRET` | string |    ✅    | **Never commit to Git**        |

> `tenantId` and `clientId` are non-secret identifiers — safe in `config.json`.
> Only `clientSecret` must stay out of source control.

---

## Verify the connection

```bash
npx mcp-dataverse doctor
```

Expected:

```
✅ Config loaded — authMethod: client-credentials
✅ Token acquired (client-credentials)
✅ WhoAmI OK → UserId: d5b06e2c-ff26-f111-88b4-002248da8f40 | Org: yourorg
```

The `UserId` you see is the Dataverse object ID of the **Application User**, not a personal account.

---

## Secret rotation

Client secrets expire. Set a calendar reminder 2 weeks before expiry.

```bash
# Option A — add a new secret BEFORE the old one expires (zero downtime)
az ad app credential reset \
  --id <appId> \
  --display-name "mcp-server-prod-v2" \
  --years 1
# Update AZURE_CLIENT_SECRET in App Service / Key Vault / CI-CD secrets
# Wait for deployment to confirm the new secret works
# Then delete the old secret from the App Registration

# Option B — rotate immediately (causes brief downtime)
az ad app credential reset --id <appId>
# Update AZURE_CLIENT_SECRET everywhere at once
```

---

## Troubleshooting

| Error message                            | Cause                                         | Fix                                                |
| :--------------------------------------- | :-------------------------------------------- | :------------------------------------------------- |
| `AADSTS7000215: Invalid client secret`   | Secret is wrong or expired                    | Generate a new secret in App Registrations         |
| `AADSTS700016: Application not found`    | `clientId` is incorrect                       | Check the `appId` in App Registrations             |
| `AADSTS90002: Tenant not found`          | `tenantId` is incorrect                       | Check the Directory ID in Azure portal → Overview  |
| `Principal user is missing`              | Application User not created in Dataverse     | Run `pac admin application register`               |
| `User does not have required privileges` | Security role lacks needed privileges         | Expand the role, or assign a higher-privilege role |
| `Request timeout`                        | `requestTimeoutMs` too low for large payloads | Increase to `60000` in `config.json`               |

---

## Annexe — Technical internals

### Token acquisition (`client-credentials-auth-provider.ts`)

```
1. Check memory cache:
   └── if cachedToken && expiry > now + 60 s → return cached token
2. acquireTokenByClientCredential (MSAL ConfidentialClientApplication)
   POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
   scope = {environmentUrl}/.default
3. Token returned: ~1 hour lifetime
4. No refresh token — a fresh client-credentials token is acquired on expiry
5. Concurrent calls: promise de-duplication (pendingAuth guard)
```

### Scope used

`{environmentUrl}/.default` — this requests all Dataverse API permissions
granted to the Application User via its security role. No additional API permission
grants are needed in the App Registration itself (those are for delegated permissions only).

### Why `/.default` and not a specific scope

Client credentials flow uses application permissions, not delegated scopes.
The Dataverse resource server (`https://yourorg.crm.dynamics.com`) interprets `/.default`
as "grant the permissions assigned to this application principal."

### Memory-only token cache

Unlike the Device Code flow, client credentials tokens are **not persisted to disk**.
The cached token lives only in the Node.js process memory. On server restart, a fresh token
is acquired automatically (usually within a few milliseconds).

---

## See also

- [auth-device-code.md](auth-device-code.md) — simpler local development mode
- [auth-entra-jwt.md](auth-entra-jwt.md) — Entra JWT for hosted HTTP server (inbound auth)
- [auth-testing-guide.md](auth-testing-guide.md) — quick comparison of all methods
