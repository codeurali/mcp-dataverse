---
title: Authentication
description: Choose between device code, service principal, or managed identity to connect MCP Dataverse to your environment.
---

# Authentication

Three methods for authenticating MCP Dataverse to Dataverse. Choose based on where the server runs and who manages the identity.

| Method | Where the server runs | Identity calling Dataverse | Secrets to manage |
|:-------|:---------------------|:--------------------------|:------------------|
| [Device Code](/authentication/local) | Your laptop | Your user account | None |
| [Client Credentials](/authentication/service-principal) | Any server or CI/CD | App Registration (service principal) | One client secret |
| [Managed Identity](/authentication/hosted) | Azure (App Service, Container Apps) | Azure-managed server identity | None |

**Decision guide:**

- Running MCP locally for personal use → **[Device Code](/authentication/local)**
- Running MCP unattended (server, Docker, pipeline) → **[Client Credentials](/authentication/service-principal)**
- Hosting MCP on Azure for team use → **[Managed Identity](/authentication/hosted)**

---

> **Hosted deployment note:** when the MCP server runs as a shared HTTP endpoint on Azure,
> there are two independent auth layers:
>
> - **Inbound** — how MCP clients authenticate *to the MCP server* (Entra ID JWT)
> - **Outbound** — how the MCP server authenticates *to Dataverse* (Managed Identity)
>
> The [Managed Identity](/authentication/hosted) page covers both layers.
