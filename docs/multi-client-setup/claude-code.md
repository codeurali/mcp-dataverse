---
layout: default
title: Claude Code (CLI)
parent: Multi-Client Setup
nav_order: 1
---

# Guide: mcp-dataverse on Claude Code (CLI)

This guide covers the installation of Claude Code from scratch through to a first working MCP Dataverse call from the terminal.

---

## Prerequisites

| Item | Minimum version | Note |
|---------|-----------------|----------|
| OS | Windows 10 1809+ / macOS 13+ / Ubuntu 20.04+ | See [network configuration](https://code.claude.com/docs/en/network-config) for restricted environments |
| RAM | 4 GB+ | Recommended |
| Node.js | 20+ | Required for `npx mcp-dataverse` |
| Anthropic account | Pro, Max, Teams, Enterprise or Console | The free plan does not include Claude Code |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

> **Windows**: [Git for Windows](https://git-scm.com/downloads/win) is required. Claude Code uses Git Bash internally.

---

## 1. Install Claude Code

### Native installation (recommended)

Claude Code updates automatically in the background and does not require Node.js to be pre-installed.

**macOS / Linux / WSL**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows – PowerShell**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows – CMD**
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> Install [Git for Windows](https://git-scm.com/downloads/win) beforehand if not already done.

### Via Homebrew (macOS/Linux)

```bash
brew install --cask claude-code
```

### Via WinGet (Windows)

```powershell
winget install Anthropic.ClaudeCode
```

> Homebrew and WinGet installations **do not update automatically**. Use `brew upgrade claude-code` or `winget upgrade Anthropic.ClaudeCode` for manual updates.

---

## 2. Verify the installation

```bash
claude --version
claude doctor
```

`claude doctor` checks the Node.js version, configuration, authentication, and network connectivity.

---

## 3. First launch and Anthropic authentication

Launch Claude Code in the working directory:

```bash
claude
```

At the prompt, select **Sign in with Claude.ai** and follow the instructions in the browser. Claude Code requires a Pro, Max, Teams, Enterprise plan or a Console API account.

---

## 4. Configure mcp-dataverse

### Quick method — `mcp add` command

Register the server with the built-in environment variable and global scope (`--scope user`) so that the tool is available in all projects:

**macOS / Linux / WSL**
```bash
claude mcp add --transport stdio --scope user \
  mcp-dataverse \
  -e DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com \
  -- npx -y mcp-dataverse
```

**Windows (PowerShell)**
```powershell
claude mcp add --transport stdio --scope user `
  mcp-dataverse `
  -e DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com `
  -- cmd /c npx -y mcp-dataverse
```

> **Native Windows**: the `cmd /c` wrapper is mandatory — without it, `npx` cannot be executed directly and returns a "Connection closed" error.

> **Argument order**: the server name (`mcp-dataverse`) must be placed **before** the `-e`/`--env` flag. Due to the variadic behaviour of `-e <env...>`, placing the name after the environment variable causes the error `Invalid environment variable format: mcp-dataverse`.

This command writes the entry to `~/.claude.json` automatically.

#### Available scopes (`--scope`)

| Scope | Availability | Generated file |
|-------|--------------|----------------|
| `local` (default) | Current directory only | `.claude/settings.local.json` |
| `project` | All project members | `.mcp.json` at the root |
| `user` | All your projects (recommended) | `~/.claude.json` |

### Manual method — editing `~/.claude.json`

Open (or create) `~/.claude.json` and add the `mcpServers` key:

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

### Workspace scope (project-specific)

To restrict the server to a single project, create `.mcp.json` at the project root:

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

---

## 5. Dataverse authentication

On the first call of an MCP tool, the server initiates a Device Code flow:

1. The code and URL are displayed **directly in the Claude Code terminal**
2. Open the URL in a browser, enter the code, and sign in with the Microsoft 365 account that has access to Dataverse
3. The token is stored locally — there is no need to repeat this step

> The code expires after 5 minutes. If it expires, re-run the command to generate a new one.

---

## 6. Verify the integration

From the Claude Code session, ask:

> **"Who am I in Dataverse?"**

Claude will call `dataverse_whoami`. A response showing the user's name confirms that everything is working.

---

## Multiple Dataverse environments

To work with multiple organisations, define separate entries:

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

## Quick troubleshooting

| Symptom | Probable cause | Solution |
|----------|---------------|---------|
| `ENOENT npx` | Node.js absent from PATH | Install Node.js 20+ |
| Device code not displayed | Environment variable not defined before launch | Set `DATAVERSE_ENV_URL` in the shell before launching `claude` |
| Remove an MCP server | — | `claude mcp remove mcp-dataverse` |
| List configured MCP servers | — | `claude mcp list` |
| Migrate from npm to native installation | npm deprecated | `curl -fsSL https://claude.ai/install.sh \| bash` then `npm uninstall -g @anthropic-ai/claude-code` |

---

## Resources

- [Official Claude Code documentation – Advanced setup](https://code.claude.com/docs/en/setup)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [CLI diagnostics](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli): `npx mcp-dataverse doctor`
