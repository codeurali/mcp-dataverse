---
layout: default
title: Claude Desktop
parent: Multi-Client Setup
nav_order: 2
---

# Guide: mcp-dataverse on Claude Desktop

This guide covers the installation of Claude Desktop from scratch through to a first working MCP Dataverse call.

---

## Prerequisites

| Item | Minimum version | Note |
|---------|-----------------|----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx must be available in the PATH |
| Anthropic account | Paid plan (Pro, Max, Team or Enterprise) | The free plan is not sufficient |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

---

## 1. Install Claude Desktop

### Windows

1. Download the installer from **[claude.ai/download](https://claude.ai/download)**
2. Run `ClaudeSetup.exe` and follow the wizard (silent installation is possible with `/S`)
3. Start Claude Desktop and sign in with your Anthropic account

> An arm64 version is also available on the same page for Windows ARM machines.

### macOS

1. Download the `.dmg` file from **[claude.ai/download](https://claude.ai/download)**
2. Drag the **Claude** icon into the Applications folder
3. Launch Claude from Launchpad or Spotlight and sign in

---

## 2. Locate the configuration file

Claude Desktop reads its MCP configuration from a JSON file whose location depends on the OS:

| OS | Path |
|----|--------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

If the file does not yet exist, create it (the parent directory exists after the first installation).

---

## 3. Configure mcp-dataverse

Open `claude_desktop_config.json` in a text editor and add (or merge) the `mcpServers` key:

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
      }
    }
  }
}
```

Replace `https://yourorg.crm.dynamics.com` with the actual URL of your Dataverse organisation.

### Using a config file instead of an environment variable

If you prefer to store the URL in `~/.mcp-dataverse/config.json` (created by `npx mcp-dataverse install`), use `MCP_CONFIG_PATH`:

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "MCP_CONFIG_PATH": "C:\\Users\\VotreNom\\.mcp-dataverse\\config.json"
      }
    }
  }
}
```

### Global installation (optional)

If `mcp-dataverse` is installed globally (`npm install -g mcp-dataverse`), replace `npx` with the direct executable:

```json
{
  "command": "mcp-dataverse",
  "env": {
    "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
  }
}
```

---

## 4. Restart Claude Desktop

> **Important** — Claude Desktop must be **fully closed and restarted** after each modification to the configuration file. A simple tab reload is not sufficient.

On Windows: right-click the icon in the system tray → **Quit**, then relaunch.  
On macOS: `Cmd+Q`, then relaunch from Launchpad.

---

## 5. Dataverse Authentication

On the first call to an MCP tool, the server initiates a device code authentication flow (Device Code Flow):

1. In Claude Desktop, click the **MCP icon** (hammer 🔨) in the lower-right corner of the input area
2. Open the **server logs** to see the URL and the sign-in code
3. Open the URL in a browser, enter the code, then sign in with the Microsoft 365 account that has access to Dataverse
4. Once authenticated, the server stores the token locally — there is no need to repeat this step

> The device code expires after 5 minutes. If the sign-in window is not opened in time, re-run the tool from Claude Desktop to generate a new code.

---

## 6. Verify the installation

In the Claude Desktop input area, send the following message:

> **"Who am I in Dataverse?"**

Claude will call `dataverse_whoami` and return the name and ID of the authenticated user. A valid response confirms that the integration is working.

---

## Quick troubleshooting

| Symptom | Probable cause | Solution |
|----------|---------------|----------|
| The server does not appear in Claude | Config not saved or Claude not restarted | Check the JSON, restart Claude completely |
| The device code does not appear | MCP logs not visible | Click the MCP icon → Server logs |
| `ENOENT npx` | Node.js not in the PATH | Install Node.js 20+ and relaunch Claude |
| Invalid URL error | Incorrect format | The URL must begin with `https://` and end with `.dynamics.com` |
| Token expired after 90+ inactive days | Refresh token revoked | Re-run: `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Resources

- [Connecting a local MCP server to Claude Desktop](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Getting started and authentication](https://codeurali.github.io/mcp-dataverse/getting-started)
- [CLI diagnostics](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
