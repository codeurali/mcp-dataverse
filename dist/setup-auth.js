#!/usr/bin/env node
import{a as n}from"./chunk-SUDI4JM6.js";import{a as s}from"./chunk-24RDOMG4.js";async function t(){process.stderr.write(`MCP Dataverse \u2014 One-time Authentication Setup
`),process.stderr.write(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`);let e=process.argv[2];e&&(process.env.DATAVERSE_ENV_URL=e);let r;try{r=n()}catch{process.stderr.write(`Environment URL is required.
Usage: npx mcp-dataverse-auth https://yourorg.crm.dynamics.com
Or set DATAVERSE_ENV_URL before running.
`),process.exit(1)}process.stderr.write(`Environment : ${r.environmentUrl}
`),process.stderr.write(`Token cache : ~/.mcp-dataverse/msal-cache.json

`),process.stderr.write(`A browser window will open. Sign in with your Microsoft account.

`),await new s(r.environmentUrl).setupViaDeviceCode(),process.stderr.write(`
\u2713 Authentication successful!
  Token cached in ~/.mcp-dataverse/msal-cache.json

  Restart the MCP server in VS Code to apply.
`)}t().catch(e=>{process.stderr.write(`
Setup failed: ${e instanceof Error?e.message:String(e)}
`),process.exit(1)});
