---
title: Security and guardrails
description: How MCP Dataverse authenticates with Microsoft Entra ID, what the server can and cannot do, which guardrails exist, and the limits you should plan around.
---

# Security and guardrails

An agent connected to Dataverse can read and change business data, so the useful questions are: who does it act as, what stops a mistake, and what does the server not protect against. This page answers all three, including the gaps.

**The short version.** MCP Dataverse holds no privileges of its own. Every call runs under a Microsoft Entra ID identity that you choose, and Dataverse security roles decide what is allowed. The guardrails reduce accidental damage. They are not a substitute for giving the identity only the access it needs.

---

## Authentication with Microsoft Entra ID

Three modes, all built on Microsoft's own identity platform through the MSAL library. The server never sees a user's password.

| Mode | Calls run as | Secret handling | Use it for |
| :--- | :----------- | :-------------- | :--------- |
| **Device code** (default) | The signed-in user, delegated. Their Dataverse roles apply. | No secret. Sign-in happens at Microsoft. A token cache is kept on disk, encrypted. | Local development and personal use |
| **Client credentials** | An Entra app registration, as a Dataverse **Application User** | Client secret, from `AZURE_CLIENT_SECRET` or encrypted in `config.json`. Tokens stay in memory. | CI/CD and unattended jobs |
| **Managed identity** | An Azure resource identity, as a Dataverse **Application User** | None. Azure issues the token. Tokens stay in memory. | Servers hosted on Azure |

Details worth knowing:

- Only `https://*.dynamics.com` environment URLs are accepted.
- Device-code sign-in uses Microsoft's shared public client ID, not an app registration that you own.
- Setup guides: [local](/authentication/local), [service principal](/authentication/service-principal), [managed identity](/authentication/hosted).

### Where credentials are stored

- **Device-code token cache:** `~/.mcp-dataverse/msal-cache.json`, encrypted with AES-256-GCM, file mode `0600`. The key is derived from machine and user identifiers plus a random per-install salt kept next to the cache.
- **Client secret in `config.json`:** encrypted the same way. Prefer the `AZURE_CLIENT_SECRET` environment variable, or managed identity, so that no secret is stored at all.

This protects the cache from casual copying. It does not protect against another process running as the same user, and it is not an operating-system keychain. If that matters in your environment, use client credentials with an environment variable, or managed identity.

---

## Hosted mode: who may call the server

In stdio mode the server is a local process and has no inbound authentication; whoever can start it acts as the configured identity.

In HTTP mode you choose how callers authenticate:

| Option | What is checked |
| :----- | :-------------- |
| **Entra ID JWT** (`ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`) | Signature against Microsoft's published keys, issuer, audience, RS256 algorithm, expiry and not-before. The `scp` claim is checked when `ENTRA_REQUIRED_SCOPE` is set. |
| **Static secret** (`MCP_HTTP_SECRET`) | Bearer token, compared in constant time. |

Recommended settings for any shared deployment:

- Set one of the two options above, and set `MCP_HTTP_REQUIRE_AUTH=true` so the server refuses to start without authentication.
- Set `MCP_HTTP_CORS_ORIGIN` to your application's origin.
- Put TLS in front of the server.

Be aware of the defaults. With nothing configured, the HTTP server accepts every request, listens on all interfaces, and allows any CORS origin, and it logs a warning at startup. That is meant for local development.

Entra mode authenticates the caller. It does not give each caller their own Dataverse identity: calls to Dataverse still use the single identity the server is configured with, so everyone who reaches the server shares its permissions.

---

## Authorization: Dataverse decides

The server adds no permissions. A missing privilege comes back as a `PERMISSIONS` error from Dataverse, which the agent can read and report.

- **Use a dedicated identity with a minimal custom security role.** For client credentials, create an Application User with only the privileges the workflow needs. This is the most effective control available.
- **Try it on a sandbox environment first.**
- **Avoid System Administrator** for the identity unless the task requires it.

### Impersonation

`dataverse_impersonate` runs one wrapped tool call as another user by setting the `MSCRMCallerId` header for that call only, and restoring it afterwards. Dataverse requires the executing account to hold the "Act on behalf of another user" privilege. The tool refuses to impersonate users with the System Administrator role, and it denies the request if that role lookup fails.

---

## Guardrails

Out of 100 tools, **64 are read-only**. The rest write, and six are marked destructive: `dataverse_delete`, `dataverse_disassociate`, `dataverse_replace_role_privileges`, `dataverse_delete_attribute`, `dataverse_revoke_access` and `dataverse_merge_records`.

| Guardrail | What it does |
| :-------- | :----------- |
| **Explicit confirmation** | 14 tools require `confirm: true`: record and association deletion, role assignment and privilege changes, column creation, update and deletion, table updates, table icons, environment variable creation, and record merging. A missing or false value is rejected. |
| **Read-only mode** | Set `MCP_READ_ONLY=true` (or `readOnly` in `config.json`) and the server exposes only the 64 read-only tools and refuses every other call. Tools without a read-only hint are treated as writes. Available from the next release. |
| **Tool annotations** | Every tool declares read-only, destructive, idempotent and open-world hints so clients can ask for approval. These are hints for the client; the server enforces them only in read-only mode. |
| **Input validation** | Every call is validated with Zod. Table and relationship names are restricted to a safe identifier pattern, and OData string literals are escaped. |
| **Query limits** | `top` is capped at 5,000. A query with no filter is limited to 50 rows by default. Paging stops at 50,000 records. |
| **Batch limit** | A batch holds at most 1,000 operations. With `useChangeset`, the group is atomic. |
| **Output limit** | Results above about 900 KB are replaced by a summary, to keep them within client limits. |
| **Timeouts and retries** | 30 second request timeout. Throttling and transient errors (429, 503, 504) are retried with backoff, honouring `Retry-After`. |
| **Typed errors** | Failures return a category (`PERMISSIONS`, `ENV_LIMITATION`, `SCHEMA_MISMATCH`, `NETWORK`, `VALIDATION`, `UNKNOWN`) and, when a prerequisite is missing, the steps to fix it, instead of a raw stack trace. |
| **Guardrail warnings** | Large result sets, missing `$select` or `$filter`, and destructive or batch operations produce warnings the agent is told to relay. They do not block the call. |

---

## What is not protected

Plan around these limits.

- **There is no per-tool allowlist.** Outside read-only mode, all 100 tools are exposed. If an identity may delete records, the agent can ask to. Use read-only mode, limit the identity, or choose the tools your MCP client allows.
- **`confirm` guards against model mistakes, not against a determined caller.** Anyone who can call the server can pass `confirm: true`. Batch requests, custom actions, record sharing (`grant_access`, `revoke_access`), `create_table` and `create_relationship` do not use `confirm`. A batch can contain deletes.
- **Annotations are advisory** outside read-only mode: a client decides whether to act on them.
- **Record content is passed to the model as returned.** Text stored in records, notes or audit logs can contain instructions aimed at an agent, and the server does not filter it. Treat agent output on untrusted data accordingly, and keep write approvals on in your client.
- **Hosted mode shares one identity** among all callers, as described above.
- **Secrets in logs have not been formally audited.** Tokens and secrets are not written to tool output, but Dataverse error text is passed through, and a failed JWT check logs the unverified claims of the rejected token to stderr.
- **No server-side audit trail.** The server logs to stderr. Enable Dataverse auditing if you need a record of what was changed and by which identity.

---

## Supply chain

- Four direct runtime dependencies: the MCP SDK, MSAL, jose and Zod.
- MIT license. Releases are published to npm and to the official MCP Registry from GitHub Actions, and every change is listed in the [CHANGELOG](https://github.com/codeurali/mcp-dataverse/blob/master/CHANGELOG.md). The source repository is private; the package on npm contains the compiled server.

---

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use **Report a vulnerability** in the Security tab of the [GitHub repository](https://github.com/codeurali/mcp-dataverse/security). It creates a private advisory visible only to the maintainer and to you. The full policy is in [SECURITY.md](https://github.com/codeurali/mcp-dataverse/blob/master/SECURITY.md).
