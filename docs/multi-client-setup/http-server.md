---
layout: default
title: HTTP Server
parent: Multi-Client Setup
nav_order: 7
---

# Guide: mcp-dataverse in HTTP Mode (multi-client)

This guide explains how to start mcp-dataverse in HTTP server mode so that multiple editors or AI tools can share the same MCP server instance simultaneously.

---

## Why HTTP Mode?

The default mode (`stdio`) creates a separate mcp-dataverse process for **each** AI client. HTTP mode starts **a single process** on a network port, to which all clients connect.

| Mode | Transport | Process | Suited for |
|------|-----------|---------|------------|
| stdio | stdin/stdout pipe | 1 per client | A single editor |
| **http** | HTTP + SSE/Streaming | **1 shared** | Multiple editors, teams, dashboards |

### Typical Use Cases

- Working simultaneously in Cursor AND in Claude Desktop on the same Dataverse
- A CI/CD pipeline that calls Dataverse tools via HTTP
- A dashboard (e.g. n8n, LangGraph) that queries Dataverse via MCP
- Sharing an authenticated session between several team members (local session only)

---

## Prerequisites

| Item | Minimum Version | Note |
|------|----------------|------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | |

---

## 1. Starting the HTTP Server

### Minimal Command

```bash
npx -y mcp-dataverse --transport http --port 3001
```

The server starts and listens on `http://localhost:3001`.

### With the Dataverse URL as an Environment Variable

```bash
# Linux / macOS
DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com npx -y mcp-dataverse --transport http --port 3001

# Windows (PowerShell)
$env:DATAVERSE_ENV_URL="https://yourorg.crm.dynamics.com"
npx -y mcp-dataverse --transport http --port 3001

# Windows (cmd)
set DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com
npx -y mcp-dataverse --transport http --port 3001
```

### With an mcp-dataverse Configuration File

```bash
MCP_CONFIG_PATH=~/.mcp-dataverse/config.json npx -y mcp-dataverse --transport http --port 3001
```

---

## 2. Verifying the Server is Running

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "x.y.z",
  "tools": 63
}
```

---

## 3. Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | `POST`, `GET` | Main MCP endpoint (Streamable HTTP). POST to send JSON-RPC messages; GET to open an SSE stream of server notifications. |
| `/health` | `GET` | Checks that the server is operational |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Machine locale                       │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │ Claude Desktop│    │                               │  │
│  └──────┬───────┘    │   mcp-dataverse               │  │
│         │            │   --transport http             │  │
│  ┌──────┴───────┐    │   --port 3001                 │  │
│  │    Cursor     │───►│                               │  │
│  └──────┬───────┘    │   POST /mcp & GET /mcp        │  │
│         │            │   GET /health                 │  │
│  ┌──────┴───────┐    │                               │  │
│  │    n8n / CI  │    └───────────────┬───────────────┘  │
│  └──────────────┘                    │                   │
│                                      ▼                   │
│                          https://yourorg.crm.dynamics.com│
└─────────────────────────────────────────────────────────┘
```

---

## 5. Connecting Clients to the HTTP Server

### Claude Desktop

Modify `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### Cursor — `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### Windsurf — `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "mcp-dataverse": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add --transport http mcp-dataverse http://localhost:3001/mcp
```

### Generic HTTP Client (curl, scripts)

The MCP Streamable HTTP protocol requires a session to be initialised before any tool call.

```bash
# Étape 1 — Initialiser la session (récupérer le mcp-session-id)
curl -s -D - -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "curl-test", "version": "1.0" }
    }
  }'
# La réponse contient le header : mcp-session-id: <uuid>

# Étape 2 — Appel d'outil (avec le session ID récupéré)
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <uuid-de-létape-1>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": { "name": "dataverse_whoami", "arguments": {} }
  }'
```

> Native MCP clients (Cursor, Claude Desktop, etc.) handle the `initialize` → session → tools/call cycle automatically. For custom scripts, this cycle must be managed explicitly.

---

## 6. Dataverse Authentication

Only **one** client needs to trigger authentication — all others then benefit from the same session.

1. Start the HTTP server in a terminal
2. Make an initial call from any connected client
3. The terminal displays the Device Code URL and code
4. Open the URL in a browser, enter the code, and sign in with a Microsoft 365 account
5. The token is stored locally and shared across all incoming connections

---

## 7. Automatic Start-up (Optional)

### systemd (Linux)

Create `/etc/systemd/system/mcp-dataverse.service`:

```ini
[Unit]
Description=MCP Dataverse HTTP Server
After=network.target

[Service]
Environment=DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com
ExecStart=/usr/bin/npx -y mcp-dataverse --transport http --port 3001
Restart=on-failure
User=votreuser

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mcp-dataverse
sudo systemctl start mcp-dataverse
```

### pm2 (Windows / macOS / Linux)

```bash
npm install -g pm2
DATAVERSE_ENV_URL=https://yourorg.crm.dynamics.com pm2 start "npx -y mcp-dataverse --transport http --port 3001" --name mcp-dataverse
pm2 save
pm2 startup
```

---

## 8. Security

> **By default, the server listens only on `localhost` (127.0.0.1).** It is only accessible from the local machine.

To expose the server to other machines (team sharing):

1. Use a **reverse proxy** (nginx, Caddy, Traefik) with TLS
2. Add an authentication layer in front of the proxy (`Authorization: Bearer …`)
3. Never expose port 3001 directly to the Internet

**Do not expose the HTTP server without authentication**, even on a corporate local network: the server acts with the permissions of the authenticated Dataverse account.

---

## Quick Troubleshooting

| Symptom | Probable Cause | Solution |
|---------|---------------|---------|
| `Connection refused` on `/health` | Server not started | Check the server terminal |
| Port 3001 already in use | Another process | `--port 3002` or free the port |
| Client cannot find tools | Incorrect URL | Verify the URL points to `/mcp` (not `/`) |
| Token not shared | Clients running in stdio mode in parallel | Verify all clients are using `http` mode |
| Device Code not visible | Server started in the background | Use pm2 logs or journalctl |

---

## Resources

- [Official multi-client page](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started) : `npx mcp-dataverse doctor`
- [Guide démarrage rapide](https://codeurali.github.io/mcp-dataverse/getting-started)
