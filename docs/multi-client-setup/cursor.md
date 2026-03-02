---
layout: default
title: Cursor
parent: Multi-Client Setup
nav_order: 4
---

# Guide: mcp-dataverse on Cursor

This guide covers installing Cursor from scratch through to a first working MCP Dataverse call within the editor.

---

## What is Cursor?

Cursor is an AI-first code editor, a fork of VS Code, developed by Anysphere. It integrates autonomous agents, intelligent autocompletion, and natively supports the MCP protocol to connect external tools directly to the AI.

---

## Prerequisites

| Item | Minimum version | Note |
|------|-----------------|------|
| OS | Windows 10+ / macOS 10.15 (Catalina)+ / Linux (Ubuntu 20.04+) | |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx must be available |
| Cursor account | Free (Hobby) to get started | Pro plan recommended for intensive use |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

---

## 1. Install Cursor

### Windows

1. Download from **[cursor.com/download](https://cursor.com/download)**
2. Run the downloaded `.exe` file and follow the installation wizard
3. Cursor installs by default in `%LOCALAPPDATA%\Programs\Cursor`

### macOS

1. Download the `.dmg` file from **[cursor.com/download](https://cursor.com/download)**
2. Drag the **Cursor** icon into the Applications folder
3. Launch Cursor from the Launchpad or with `open -a Cursor`

### Linux

1. Download the `.AppImage` or `.deb` file from **[cursor.com/download](https://cursor.com/download)**
2. For AppImage: `chmod +x Cursor-*.AppImage && ./Cursor-*.AppImage`
3. For `.deb` (Debian/Ubuntu): `sudo apt install ./cursor-*.deb`

---

## 2. Create an account and sign in

On first launch, Cursor offers to:
- Create a Cursor account (e-mail + password or OAuth via GitHub/Google)
- Import existing VS Code settings (extensions, keybindings, themes)

---

## 3. Configure mcp-dataverse

> **Important format note** — Cursor uses the `mcpServers` key (not `servers` as in VS Code).

### Workspace scope (recommended)

Create the `.cursor/mcp.json` file at the root of the workspace:

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

### Global scope (all workspaces)

Create `~/.cursor/mcp.json` in the home directory to make the tools available across all projects:

> **Windows** — The `~\.cursor` directory is not created automatically. If it does not exist yet:
> ```powershell
> New-Item -ItemType Directory -Force "$env:USERPROFILE\.cursor"
> ```

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

### Using an mcp-dataverse config file

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

### Multiple Dataverse environments

```json
{
  "mcpServers": {
    "dataverse-dev": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": { "DATAVERSE_ENV_URL": "https://myorg-dev.crm.dynamics.com" }
    },
    "dataverse-prod": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": { "DATAVERSE_ENV_URL": "https://myorg.crm.dynamics.com" }
    }
  }
}
```

---

## 4. Restart Cursor

After creating or modifying `.cursor/mcp.json`, **reload the window** for Cursor to pick up the MCP servers:

- `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) → **Developer: Reload Window**

---

## 5. Dataverse Authentication

On the first call to an MCP tool, the server initiates a Device Code flow:

1. Open the **Output** panel (`Ctrl+Shift+U`) → select **MCP Logs** from the drop-down list
2. The URL and sign-in code are displayed in this panel
3. Open the URL in a browser, enter the code, and sign in with the Microsoft 365 account that has access to Dataverse
4. The token is stored locally — authentication is not repeated each session

---

## 6. Verify the integration

Open the Cursor chat (Agent mode) and send:

> **"Who am I in Dataverse?"**

Cursor will call `dataverse_whoami` and display the user's name and ID. A correct response validates the entire chain.

---

## Quick Troubleshooting

| Symptom | Probable cause | Solution |
|---------|----------------|---------|
| MCP server not visible in Cursor | `.cursor/mcp.json` missing or incorrectly placed | Check that the file is at the root of the open workspace |
| `servers` key instead of `mcpServers` | Confusion with the VS Code format | Cursor requires `mcpServers`, not `servers` |
| `ENOENT npx` | Node.js not on PATH | Install Node.js 20+ and restart Cursor |
| Device code not visible | Output panel not open | Output → MCP in the drop-down list |
| Expired token (90+ days) | Refresh token revoked | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Resources

- [Official Cursor website](https://cursor.com)
- [MCP documentation in Cursor](https://cursor.com/docs/context/mcp)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [CLI diagnostic](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli): `npx mcp-dataverse doctor`
