# Security policy

## Supported versions

Security fixes are released for the latest published version of `mcp-dataverse` on npm. Please update before reporting: run `npx mcp-dataverse update`.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Report it privately through GitHub: open the **Security** tab of this repository and choose **Report a vulnerability**. This creates a private advisory visible only to the maintainer and to you.

Include:

- the `mcp-dataverse` version (`npm ls mcp-dataverse`) and your Node.js version
- the transport (stdio or HTTP) and the authentication mode in use
- steps to reproduce, and what you expected to happen
- the impact as you understand it

You will get an acknowledgement as soon as the maintainer can respond, and a public fix and advisory once a patched version is available.

## Scope

In scope: the `mcp-dataverse` server, its installer and its HTTP transport (authentication, CORS, session handling), and the handling of credentials and tokens.

Out of scope: Dataverse or Microsoft Entra ID themselves, vulnerabilities in your own environment's security roles, and agent behaviour caused by instructions stored in Dataverse records (see [Security and guardrails](https://codeurali.github.io/mcp-dataverse/security#what-is-not-protected) for the known limits).
