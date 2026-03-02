---
layout: default
title: Windsurf
parent: Multi-Client Setup
nav_order: 6
---

# Guide: mcp-dataverse on Windsurf

This guide covers installing Windsurf from scratch through to a first working MCP Dataverse call within the editor.

---

## What is Windsurf?

Windsurf is described by its creators (Cognition / Codeium) as the first "agentic" IDE, forked from VS Code. Its primary AI, **Cascade**, maintains full contextual awareness of the codebase in real time. It natively supports the MCP protocol for connecting external tools such as Dataverse to the AI.

---

## Prerequisites

| Item | Minimum version | Notes |
|------|-----------------|-------|
| OS | Windows 10+ / macOS 13 (Ventura)+ / Linux (Ubuntu 20.04+) | |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx must be available |
| Windsurf account | Free (Free tier available) | [windsurf.com](https://windsurf.com) |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

---

## 1. Install Windsurf

### Windows

1. Download from **[windsurf.com/download](https://windsurf.com/download)**
   - x64 version: for standard Intel/AMD PCs
   - arm64 version: for Windows ARM PCs (Surface Pro X, Snapdragon, etc.)
2. Run the `.exe` file and follow the installation wizard

### macOS

1. Download the `.dmg` file from **[windsurf.com/download](https://windsurf.com/download)**
2. Drag the **Windsurf** icon into the Applications folder

### Linux

1. Download the package for your distribution from **[windsurf.com/download](https://windsurf.com/download)**
2. For `.deb` (Debian/Ubuntu): `sudo dpkg -i windsurf-*.deb`
3. For `.rpm` (Fedora/RHEL): `sudo rpm -i windsurf-*.rpm`

---

## 2. Create an account and sign in

On first launch, Windsurf prompts you to create an account or sign in via Google / GitHub. The Free plan includes 25 Cascade credits per month.

---

## 3. Configure mcp-dataverse

Windsurf supports two MCP configuration scopes:

| Scope | Path | When to use |
|-------|------|-------------|
| **Global** (all workspaces) | `~/.codeium/windsurf/mcp_config.json` | Shared configuration across all projects |
| **Workspace** (current project) | `.windsurf/mcp.json` at the project root | Isolated per-project configuration, recommended for teams |

### Global scope

| OS | Path |
|----|------|
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| macOS / Linux | `~/.codeium/windsurf/mcp_config.json` |

Create or edit this file:

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

Replace the URL with that of your Dataverse organisation.

### Workspace scope

Create the file `.windsurf/mcp.json` at the root of your project (committing this file allows the configuration to be shared with the team):

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

> The workspace scope takes precedence over the global scope when both are present.

### Using an mcp-dataverse config file

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "MCP_CONFIG_PATH": "/home/user/.mcp-dataverse/config.json"
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

### Advanced parameters

```json
{
  "env": {
    "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com",
    "REQUEST_TIMEOUT_MS": "60000",
    "MAX_RETRIES": "5"
  }
}
```

---

## 4. Accessing MCP settings in Windsurf

**Via the Cascade graphical interface:**

1. In the **Cascade** panel, click the **MCPs** icon (menu at the top right of the panel)
2. OR: **Windsurf Settings** → **Cascade** → **MCP Servers**

**By editing the file directly:**

Open `~/.codeium/windsurf/mcp_config.json` (`%USERPROFILE%\.codeium\windsurf\mcp_config.json` on Windows) in any text editor.

> The command palette `Ctrl+Shift+P` / `Cmd+Shift+P` → **Windsurf: Open MCP Config** may also work depending on the installed version, but is not officially documented.

After modifying the file, **reload the window** (`Developer: Reload Window`) for the servers to be recognised.

---

## 5. Dataverse authentication

On the first call to an MCP tool from Cascade, the server initiates a Device Code flow:

1. In Windsurf, open the **Output** panel → select **MCP** from the dropdown list
2. The login URL and code are displayed
3. Open the URL in a browser, enter the code, and sign in with the Microsoft 365 account that has access to Dataverse
4. The token is stored locally — authentication is not repeated each session

> The code expires after 5 minutes. Submit a new question via Cascade to generate a fresh one.

---

## 6. Verify the integration

Open the **Cascade** panel (wave icon at the bottom right or `Ctrl+L`) and send:

> **"Who am I in Dataverse?"**

Cascade will call `dataverse_whoami` and display the user's name and ID. A correct response confirms the full connection is working.

---

## Quick troubleshooting

| Symptom | Likely cause | Solution |
|---------|-------------|---------|
| MCP server not loaded | `mcp_config.json` file missing or malformed | Check `~/.codeium/windsurf/mcp_config.json` |
| `ENOENT npx` | Node.js not found in PATH | Install Node.js 20+ and reload Windsurf |
| Device code not visible | Output panel not open | Output → dropdown list → MCP |
| Invalid JSON | Syntax error | Validate the JSON with a linter |
| Expired token (90+ days) | Refresh token revoked | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Resources

- [Windsurf official site](https://windsurf.com)
- [Windsurf MCP documentation](https://docs.windsurf.com/windsurf/cascade/mcp)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [CLI diagnostic](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli): `npx mcp-dataverse doctor`
