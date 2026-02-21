# MCP Dataverse — Publishing Guide

## Overview

The MCP server is distributed via **npm** and listed in the **MCP Registry** (which feeds VS Code's `@mcp` gallery).

## Prerequisites

- npm account ([npmjs.com](https://www.npmjs.com))
- GitHub account (for MCP Registry authentication)
- `mcp-publisher` CLI installed

## Step-by-step

### 1. Set your GitHub username

Replace `your-username` in these files:
- `package.json` → `mcpName` field
- `server.json` → `name` and `repository.url`

The `mcpName` in `package.json` **must match** the `name` in `server.json`.

Format: `io.github.ali-taggaz/dataverse`

### 2. Set the real repository URL

Update `package.json` → `repository.url` to point to the actual GitHub repo.

### 3. Publish to npm

```bash
npm run build
npm login
npm publish --access public
```

### 4. Install mcp-publisher CLI

```powershell
# Windows
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
rm mcp-publisher.tar.gz
# Move mcp-publisher.exe to a directory in your PATH
```

### 5. Authenticate with the MCP Registry

```bash
mcp-publisher login github
```

Follow the device code flow in your browser.

### 6. Publish to the MCP Registry

```bash
mcp-publisher publish
```

### 7. Verify

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.ali-taggaz/dataverse"
```

The server should now appear in VS Code's `@mcp` gallery search.

## Updating

For each new version:
1. Bump `version` in `package.json`, `server.json`, and the `packages[0].version` in `server.json`
2. `npm publish`
3. `mcp-publisher publish`

## One-Click Install URL

The README includes a `vscode:mcp/install` link. The URL format is:

```
vscode:mcp/install?{url-encoded-json-config}
```

Where the JSON config is: `{"name":"mcp-dataverse","command":"npx","args":["-y","mcp-dataverse"]}`

## Architecture Note

The server runs **locally** on the user's machine via stdio transport. This is required because:
- PAC CLI authentication uses local device code flow
- Credentials never leave the user's machine
- VS Code launches the server as a subprocess and communicates via stdin/stdout

## References

- [MCP Registry](https://github.com/modelcontextprotocol/registry)
- [MCP Registry Quickstart](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx)
- [VS Code MCP Developer Guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- [VS Code MCP User Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [server.json Schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json)
