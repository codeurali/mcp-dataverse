---
title: Client Credentials (Service Principal)
description: Authenticate with an App Registration for unattended servers, CI/CD, and Docker deployments.
---

# Client Credentials

The MCP server authenticates with its own application identity (App Registration + client secret).
No user interaction required at runtime.

**Intended for:** unattended server, Docker, CI/CD pipeline, any deployment without browser access.  
**Identity calling Dataverse:** the App Registration's service principal — not an individual user account.

---

## Prerequisites

1. An **App Registration** in Entra ID
2. A **client secret** for that registration
3. A **Dataverse Application User** linked to that App Registration, with a security role assigned

---

## Step 1 — Create the App Registration

Using Azure CLI:

```bash
az ad app create --display-name "mcp-dataverse-svc" --sign-in-audience AzureADMyOrg
# Note the appId from the output — this is your clientId

az ad sp create --id <appId>
```

Or in the Azure portal: **Entra ID → App Registrations → New registration**.

Generate a client secret: **App Registration → Certificates & secrets → New client secret**.

---

## Step 2 — Create the Application User in Dataverse

```bash
pac admin application register --application-id <clientId>

pac admin assign-user \
  --environment https://yourorg.crm.dynamics.com \
  --user <clientId> \
  --role "System Administrator" \
  --application-user
```

> Use a dedicated security role with minimum required privileges in production.

---

## Step 3 — Configuration

`config.json` — IDs only, no secret in the file:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "authMethod": "client-credentials",
  "tenantId": "<tenantId>",
  "clientId": "<appId>"
}
```

Pass the client secret via environment variable:

```bash
export AZURE_CLIENT_SECRET="<secret>"        # Linux / macOS
$env:AZURE_CLIENT_SECRET = "<secret>"        # PowerShell
```

> `npx mcp-dataverse install` stores the secret encrypted on disk if you prefer not to use an
> environment variable.

---

## Verify

```bash
npx mcp-dataverse doctor
```

Expected:

```
✅ Config loaded — authMethod: client-credentials
✅ Token acquired (client-credentials)
✅ WhoAmI OK → UserId: … | Org: …
```

---

## Common errors

| Error | Cause | Fix |
|:------|:------|:----|
| `AADSTS7000215: Invalid client secret` | Secret wrong or expired | Regenerate in **Entra ID → App Registrations → Certificates & secrets** |
| `Principal user is missing` | App User not created in Dataverse | Run `pac admin application register` |
| `User does not have required privileges` | Security role missing | Add required privileges to the role assigned to the App User |
