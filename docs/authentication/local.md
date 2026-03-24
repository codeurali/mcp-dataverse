---
layout: default
title: Device Code
parent: Authentication
nav_order: 1
permalink: /authentication/local
---

# Device Code

Authenticate as yourself using your Microsoft work account. No App Registration, no secrets, no Azure configuration.

**Intended for:** local development, personal use on your own machine.  
**Not for:** unattended servers, CI/CD, shared deployments.

---

## Configuration

`~/.mcp-dataverse/config.json` (created by `npx mcp-dataverse install`):

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com"
}
```

`device-code` is the default — no `authMethod` field required.

---

## First sign-in

On first use, the MCP server prints:

```
To sign in, use a web browser to open https://microsoft.com/devicelogin
and enter the code ABCD-EFGH to authenticate.
```

Open the URL, enter the code, complete the sign-in. The token is cached in
`~/.mcp-dataverse/msal-cache.json` and stays valid for approximately 90 days.

---

## Verify

```bash
npx mcp-dataverse doctor
```

Expected:

```
✅ Config loaded — authMethod: device-code
✅ Token acquired (device-code / cached)
✅ WhoAmI OK → UserId: … | Org: …
```

---

## Prerequisites

- Node.js 20+
- A Dataverse environment URL
- A Microsoft work account with access to that environment
