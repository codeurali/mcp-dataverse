---
layout: default
title: Authentication — Setup & Testing
nav_order: 3
permalink: /auth-testing-guide
---

# Authentication — Setup & Testing

> **3 minutes to pick, configure and validate your authentication method.**
>
> For each method you will find: **what it is in plain English**, **when to use it**,
> **the exact `config.json` to paste**, and **one command to verify it works**.

---

## The 3 methods — at a glance

| Method                    | Who is it for?            |   Secrets to manage?    | Works outside Azure? |
| :------------------------ | :------------------------ | :---------------------: | :------------------: |
| `device-code` _(default)_ | Developer on their laptop |           No            |          ✅          |
| `client-credentials`      | Server, CI/CD, automation | Yes (one client secret) |          ✅          |
| `managed-identity`        | App **hosted on Azure**   |           No            |    ❌ Azure-only     |

> **Key rule:** `managed-identity` is for when the **MCP server itself runs inside Azure**
> (Container App, App Service, etc.). If you are running MCP on your local machine or in VS Code,
> use `device-code` or `client-credentials` instead.

---

## Method 1 — `device-code` (default)

### What it is

The simplest method. You don't need to create anything in Azure and there are no secrets to manage.
The MCP server authenticates **as you** — it prints a URL and a short code, you open that URL in
your browser, sign in with your Microsoft account, and you're done.

The token is cached on disk (`~/.mcp-dataverse/msal-cache.json`) and stays valid for about 90 days,
so you won't be asked to sign in again on every restart.

Think of it as: the MCP server borrows your identity, the same way you would sign in to a website.

**Use this when:** you are developing locally, exploring Dataverse from your laptop, or setting up
a local tool like Claude Desktop, Cursor, or VS Code Copilot on your own machine.

**Do not use when:** you need the server to run unattended (there is no browser on a server), or
in CI/CD pipelines.

### config.json

```json
{
  "environmentUrl": "https://orgb2165b70.crm12.dynamics.com"
}
```

That's it — `device-code` is the default so you do not need to write it explicitly.

### Verify the connection

```bash
npx mcp-dataverse doctor
```

On **first run** you will see something like:

```
To sign in, use a web browser to open https://microsoft.com/devicelogin
and enter the code ABCD-EFGH to authenticate.
```

Open that URL in your browser, enter the code, sign in. Then run `doctor` again:

```
✅ Config loaded — authMethod: device-code
✅ Token acquired (device-code / cached)
✅ WhoAmI OK → UserId: xxxxxxxx | Org: orgb2165b70
```

> Then call **`dataverse_whoami`** from your MCP client to confirm the Dataverse connection is live.

---

## Method 2 — `client-credentials`

### What it is

Here the MCP server authenticates with its **own application identity** — not your personal account.
You create a dedicated "service account" (called an App Registration) in Azure Active Directory,
and the server uses a client secret to prove its identity.

Advantages: runs 24/7 without any human interaction, on any server or CI/CD pipeline. You control
exactly what it can access in Dataverse through security roles.

Drawback: you must manage a client secret. **Never put the secret inside a file that gets committed
to Git.** Use an environment variable (`AZURE_CLIENT_SECRET`) or Key Vault instead.

Think of it as: the MCP server has its own username (App Registration) and password (client secret)
that it uses to log in automatically without any human being involved.

**Use this when:** the MCP runs on a server (on-premises, Docker, VM), in a GitHub Actions or
Azure DevOps pipeline, or anywhere automated and unattended.

**Prerequisites:**

- An **App Registration** in Entra ID (Azure Active Directory)
- The matching **Application User** created in Dataverse with the correct security role
- A **client secret** generated for the App Registration

> If you followed the Azure Setup Guide, these are already in place:
> App Registration `mcp-dataverse-prod`, App User created, role `MCP Dataverse Service` assigned.

### config.json

Put the IDs in the file — **not the secret**:

```json
{
  "environmentUrl": "https://orgb2165b70.crm12.dynamics.com",
  "authMethod": "client-credentials",
  "tenantId": "85bad2c4-4791-42da-9a21-fc843dba9033",
  "clientId": "58eb383d-1554-4a14-a656-27b8967de3ea"
}
```

Pass the secret via environment variable:

```powershell
# PowerShell (Windows)
$env:AZURE_CLIENT_SECRET = "your-secret-here"
```

```bash
# Bash / zsh
export AZURE_CLIENT_SECRET="your-secret-here"
```

For a **quick local test only**, you can put the secret directly in `config.json`:

```json
{
  "environmentUrl": "https://orgb2165b70.crm12.dynamics.com",
  "authMethod": "client-credentials",
  "tenantId": "85bad2c4-4791-42da-9a21-fc843dba9033",
  "clientId": "58eb383d-1554-4a14-a656-27b8967de3ea",
  "clientSecret": "TEMPORARY-never-commit-to-Git"
}
```

> ⚠️ `config.json` is already in `.gitignore` in this project — it will never be committed.
> The `clientId` and `tenantId` are just IDs (not secrets), so they are safe in `config.json`.
> Only the `clientSecret` value is sensitive.

### Verify the connection

```bash
npx mcp-dataverse doctor
```

Expected output:

```
✅ Config loaded — authMethod: client-credentials
✅ Token acquired (client-credentials)
✅ WhoAmI OK → UserId: d5b06e2c-ff26-f111-88b4-002248da8f40 | Org: orgb2165b70
```

> Then call **`dataverse_whoami`** from your MCP client to confirm.

**Common errors:**

| Message                                  | Cause                                     | Fix                                                            |
| :--------------------------------------- | :---------------------------------------- | :------------------------------------------------------------- |
| `AADSTS7000215: Invalid client secret`   | Secret is wrong or expired                | Regenerate the secret in Entra ID → App Registrations          |
| `Principal user is missing`              | Application User not created in Dataverse | Run `pac admin application register` then assign the role      |
| `User does not have required privileges` | Security role is missing privileges       | Add the missing privileges to the `MCP Dataverse Service` role |

---

## Method 3 — `managed-identity`

### ⚠️ Important: this only works when the MCP server runs inside Azure

Managed Identity is **not** for local development. It is for when you deploy the MCP server
as a cloud application (on Azure Container Apps, App Service, Azure Functions, etc.) and that
cloud application connects to Dataverse.

If you want to use MCP from VS Code on your laptop → use `device-code`.
If you want to deploy MCP as a shared cloud service that your VS Code connects to remotely
via HTTP → that cloud service can use `managed-identity`.

### What it is

The most secure method for Azure deployments: **zero secrets, zero rotation, zero risk of leakage**.
Azure automatically creates a special identity for your cloud resource (Container App, App Service…)
and handles obtaining tokens internally via a private network endpoint. Your application code never
sees a username or password at all.

Think of it as: your Azure resource has a built-in "badge" that Azure itself manages. When your app
needs to log in somewhere, it shows that badge. No human ever created or stores that badge — Azure
does it all.

**Use this when:** you are deploying the MCP server on Azure (Container App, App Service, Functions)
and want the most secure, maintenance-free authentication.

**Do not use when:** running locally, on-premises, or in CI/CD outside Azure.

---

### Variant A — System-assigned (simplest)

The identity is tied to your Azure resource. Delete the Container App → identity is gone too.
One resource, one identity.

#### config.json (deployed inside the Azure resource)

```json
{
  "environmentUrl": "https://orgb2165b70.crm12.dynamics.com",
  "authMethod": "managed-identity"
}
```

No tenant ID, no client ID, no secret — Azure handles everything.

#### Enable the identity on the resource (if not already done)

```bash
# Container App
az containerapp identity assign \
  --name mcp-dataverse-app \
  --resource-group mcp-dataverse-rg \
  --system-assigned

# App Service
az webapp identity assign \
  --name my-app-service \
  --resource-group mcp-dataverse-rg

# Get the principalId — needed to register the App User in Dataverse
az containerapp show \
  --name mcp-dataverse-app \
  --resource-group mcp-dataverse-rg \
  --query "identity.principalId" -o tsv
```

#### Register the identity as an Application User in Dataverse

```bash
pac admin application register --application-id <principalId>
pac admin assign-user \
  --environment https://orgb2165b70.crm12.dynamics.com \
  --user <principalId> \
  --role "MCP Dataverse Service" \
  --application-user
```

#### Verify the connection

```bash
az containerapp exec \
  --name mcp-dataverse-app \
  --resource-group mcp-dataverse-rg \
  --command "npx mcp-dataverse doctor"
```

Expected:

```
✅ Config loaded — authMethod: managed-identity
✅ Token acquired from IMDS (system-assigned)
✅ WhoAmI OK → UserId: <guid> | Org: orgb2165b70
```

---

### Variant B — User-assigned (portable, shared)

The identity is a standalone Azure resource — it survives independently of any Container App.
Useful when you want to reuse the same identity across multiple Azure resources (e.g. dev and
staging deployments sharing one Dataverse App User).

#### config.json

```json
{
  "environmentUrl": "https://orgb2165b70.crm12.dynamics.com",
  "authMethod": "managed-identity",
  "managedIdentityClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

The `managedIdentityClientId` is the **client ID** of the user-assigned identity
(not the `principalId` — they are different values).
This is just an ID, not a secret — it is safe in `config.json`.

#### Create the identity and assign it

```bash
# Create the identity
az identity create \
  --name mcp-dataverse-identity \
  --resource-group mcp-dataverse-rg

# Get the IDs
CLIENT_ID=$(az identity show --name mcp-dataverse-identity \
  --resource-group mcp-dataverse-rg --query clientId -o tsv)

PRINCIPAL_ID=$(az identity show --name mcp-dataverse-identity \
  --resource-group mcp-dataverse-rg --query principalId -o tsv)

# Assign to the Container App
az containerapp identity assign \
  --name mcp-dataverse-app \
  --resource-group mcp-dataverse-rg \
  --user-assigned $(az identity show \
      --name mcp-dataverse-identity \
      --resource-group mcp-dataverse-rg --query id -o tsv)

# Register in Dataverse
pac admin application register --application-id $PRINCIPAL_ID
pac admin assign-user \
  --environment https://orgb2165b70.crm12.dynamics.com \
  --user $PRINCIPAL_ID \
  --role "MCP Dataverse Service" \
  --application-user
```

#### Verify the connection

```bash
az containerapp exec \
  --name mcp-dataverse-app \
  --resource-group mcp-dataverse-rg \
  --command "npx mcp-dataverse doctor"
```

Expected:

```
✅ Config loaded — authMethod: managed-identity
✅ Token acquired from IMDS (user-assigned: <clientId>)
✅ WhoAmI OK → UserId: <guid> | Org: orgb2165b70
```

---

## All environment variables (alternative to config.json)

Every `config.json` key has an environment variable equivalent. Useful for deployments
where injecting a file is inconvenient.

| Environment variable               | config.json key           | Notes                                                       |
| :--------------------------------- | :------------------------ | :---------------------------------------------------------- |
| `DATAVERSE_ENV_URL`                | `environmentUrl`          | Required in all cases                                       |
| `AUTH_METHOD`                      | `authMethod`              | `device-code` \| `client-credentials` \| `managed-identity` |
| `AZURE_TENANT_ID`                  | `tenantId`                | `client-credentials` only                                   |
| `AZURE_CLIENT_ID`                  | `clientId`                | `client-credentials` only                                   |
| `AZURE_CLIENT_SECRET`              | `clientSecret`            | `client-credentials` — **prefer env var over config file**  |
| `AZURE_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | `managed-identity` user-assigned only                       |

---

## Pick your method in 30 seconds

```
Running MCP on your laptop / VS Code / Cursor?
  └─ device-code  ✅

Running MCP unattended (server, CI/CD, on-premises Docker)?
  └─ client-credentials  ✅

Deploying MCP as a cloud app on Azure?
  ├─ One resource, simplest setup  →  managed-identity system-assigned
  └─ Multiple resources / shared identity  →  managed-identity user-assigned
```
