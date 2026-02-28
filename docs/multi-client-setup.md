# Multi-Client Setup

How to configure **mcp-dataverse** with every major MCP client. Pick your editor or tool below, paste the config, and you're ready in under 5 minutes.

> **Prerequisites**: Node.js 20+, a Dataverse environment URL (`https://yourorg.crm.dynamics.com`).  
> See [getting-started.md](getting-started.md) for authentication details (device code flow).

---

## Quick Reference

| Client | Transport | Config location |
|--------|-----------|-----------------|
| [VS Code (Copilot)](#vs-code-github-copilot) | stdio | `.vscode/mcp.json` or user-level settings |
| [Claude Desktop](#claude-desktop) | stdio | OS-specific `claude_desktop_config.json` |
| [Claude Code (CLI)](#claude-code-cli) | stdio | `claude mcp add` or `~/.claude.json` |
| [Codex CLI (OpenAI)](#codex-cli-openai) | stdio | `~/.codex/config.json` or env vars |
| [Gemini CLI (Google)](#gemini-cli-google) | stdio | `~/.gemini/settings.json` |
| [Cursor](#cursor) | stdio | `.cursor/mcp.json` |
| [Windsurf](#windsurf) | stdio | `~/.codeium/windsurf/mcp_config.json` |
| [HTTP (multi-client)](#http-multi-client-setup) | http | Any client supporting Streamable HTTP |

---

## Configuration Values

Every client configuration needs your Dataverse environment URL. You can provide it in two ways:

**Option A — Environment variable** (recommended for client configs):

```
DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com
```

**Option B — Config file** (created by `npx mcp-dataverse install`):

```
MCP_CONFIG_PATH=/path/to/.mcp-dataverse/config.json
```

The config file (`~/.mcp-dataverse/config.json`) contains:

```json
{
  "environmentUrl": "https://yourorg.crm.dynamics.com",
  "requestTimeoutMs": 30000,
  "maxRetries": 3
}
```

**Optional env vars** for fine-tuning:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATAVERSE_ENV_URL` | — | Dataverse org URL (required if no config file) |
| `MCP_CONFIG_PATH` | `~/.mcp-dataverse/config.json` | Path to config file |
| `REQUEST_TIMEOUT_MS` | `30000` | HTTP timeout in ms |
| `MAX_RETRIES` | `3` | Retry count on transient errors |

---

## VS Code (GitHub Copilot)

> Requires VS Code 1.99+ with GitHub Copilot extension (Agent mode).

### Recommended — Interactive installer

```bash
npx mcp-dataverse install
```

The wizard saves your config and registers the server via `code --add-mcp`. Done — no manual editing needed.

### Manual — Workspace scope

Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "mcp-dataverse": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
      }
    }
  }
}
```

### Manual — User scope (all workspaces)

**Ctrl+Shift+P** → **MCP: Open User Configuration**, then add the same `mcp-dataverse` entry.

### Using a config file instead of env vars

```json
{
  "servers": {
    "mcp-dataverse": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "MCP_CONFIG_PATH": "${userHome}/.mcp-dataverse/config.json"
      }
    }
  }
}
```

### Using a global install

If you installed globally (`npm install -g mcp-dataverse`), replace `npx` with a direct call:

```json
{
  "servers": {
    "mcp-dataverse": {
      "type": "stdio",
      "command": "mcp-dataverse",
      "env": {
        "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
      }
    }
  }
}
```

> **Auth prompt**: On first tool call, check **View → Output → MCP** for the device code sign-in URL.

---

## Claude Desktop

Edit the Claude Desktop configuration file:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

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

> **Restart required** — Claude Desktop must be fully quit and relaunched after editing the config file.

> **Auth prompt**: The device code URL appears in Claude Desktop's MCP server logs (click the MCP icon → server logs).

---

## Claude Code (CLI)

### Quick add

```bash
claude mcp add mcp-dataverse -- npx -y mcp-dataverse
```

Set the environment variable before launching Claude Code:

```bash
# macOS / Linux
export DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com

# Windows (PowerShell)
$env:DATAVERSE_ENV_URL = "https://yourorg.crm.dynamics.com"
```

### Manual config

Edit `~/.claude.json`:

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

## Codex CLI (OpenAI)

Codex CLI discovers MCP servers from its configuration file.

Edit `~/.codex/config.json` (or set `CODEX_CONFIG_PATH`):

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

Codex CLI also reads servers from `.vscode/mcp.json` if present in the workspace.

---

## Gemini CLI (Google)

Edit `~/.gemini/settings.json`:

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

Gemini CLI supports stdio-based MCP servers natively.

---

## Cursor

Create `.cursor/mcp.json` in your workspace root:

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

> **Note**: Cursor uses `mcpServers` (not `servers`) in its config format.

---

## Windsurf

Create or edit `~/.codeium/windsurf/mcp_config.json`:

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

## HTTP Multi-Client Setup

By default, each client spawns its own `mcp-dataverse` process via stdio. The HTTP transport lets you run **one shared server** that multiple clients connect to simultaneously.

### When to use HTTP vs stdio

| | stdio (default) | HTTP (`--transport http`) |
|-|-----------------|--------------------------|
| **Setup** | Zero config — client manages the process | Start server manually, configure URL in clients |
| **Clients** | One process per client | Multiple clients share one server |
| **Auth** | Each process authenticates independently | Single auth session, shared across connections |
| **Use case** | Single user, single editor | Team dashboards, web tools, multi-editor workflows |
| **Network** | Local only (stdin/stdout) | Local or remote (TCP) |

### Start the HTTP server

```bash
npx mcp-dataverse --transport http --port 3001
```

Output:

```
MCP Dataverse HTTP server listening on http://localhost:3001/mcp
```

The server exposes:

- `POST /mcp` — Streamable HTTP MCP endpoint
- `GET /health` — Health check (`{"status":"ok","version":"...","tools":50}`)

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  VS Code     │     │  Claude      │     │  Custom App  │
│  (Copilot)   │     │  Desktop     │     │  (Web UI)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │  HTTP POST /mcp
                   ┌────────▼────────┐
                   │  mcp-dataverse  │
                   │  HTTP server    │
                   │  :3001          │
                   └────────┬────────┘
                            │  HTTPS (Bearer token)
                   ┌────────▼────────┐
                   │   Dataverse     │
                   │   Web API       │
                   └─────────────────┘
```

### Connecting clients to the HTTP server

For clients that support an HTTP/URL-based MCP endpoint, point them to:

```
http://localhost:3001/mcp
```

> **Security note**: The HTTP server binds to `localhost` by default. For remote access, place it behind a reverse proxy with authentication. Do not expose the server directly to the internet — it grants full Dataverse API access with the authenticated user's permissions.

---

## Additional Configuration

### Overriding timeout and retries

Add these to the `env` block of any client config:

```json
{
  "env": {
    "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com",
    "REQUEST_TIMEOUT_MS": "60000",
    "MAX_RETRIES": "5"
  }
}
```

### Multiple Dataverse environments

Run separate server instances with different environment URLs. In VS Code, give each a unique name:

```json
{
  "servers": {
    "dataverse-dev": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": { "DATAVERSE_ENV_URL": "https://myorg-dev.crm.dynamics.com" }
    },
    "dataverse-prod": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": { "DATAVERSE_ENV_URL": "https://myorg.crm.dynamics.com" }
    }
  }
}
```

---

## Troubleshooting

### Run the diagnostic CLI

```bash
npx mcp-dataverse doctor
```

This checks Node.js version, configuration, authentication, and Dataverse API connectivity in one command.

### Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Server not appearing in client | Config not saved or client not restarted | Save the config file and fully restart the client |
| Auth prompt not showing | Output panel not visible | VS Code: **View → Output → MCP**. Claude Desktop: check MCP server logs |
| `Invalid configuration` error | Bad URL format | Ensure `DATAVERSE_ENV_URL` starts with `https://` and ends with `.dynamics.com` |
| `ENOENT npx` | Node.js not on PATH | Install Node.js 20+ and ensure `npx` is available in your shell |
| Device code expired | Took longer than 5 min to sign in | Retry the tool call — a fresh code is generated |
| Token refresh fails | Inactive for 90+ days | Re-authenticate: `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |
| Timeout errors | Large queries or slow network | Increase `REQUEST_TIMEOUT_MS` to `60000` or higher |
| HTTP server: `EADDRINUSE` | Port already in use | Use a different port: `--port 3002` |

### Where to find logs

| Client | Log location |
|--------|-------------|
| VS Code | **View → Output** → select **MCP** in the dropdown |
| Claude Desktop | Click the MCP plug icon → **Server logs** |
| Claude Code | Printed directly in the terminal |
| Cursor | **Output** panel → MCP |
| HTTP server | Printed to stderr in the terminal running the server |

### Verifying the connection

After setup, test with a simple prompt in your AI client:

> _"Who am I in Dataverse?"_

This calls `dataverse_whoami` and confirms authentication and connectivity are working.
