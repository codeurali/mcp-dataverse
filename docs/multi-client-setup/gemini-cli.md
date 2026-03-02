---
layout: default
title: Gemini CLI
parent: Multi-Client Setup
nav_order: 5
---

# Guide: mcp-dataverse with Gemini CLI (Google)

This guide covers the installation of Gemini CLI from scratch through to a first working MCP Dataverse call from the terminal.

---

## What is Gemini CLI?

Gemini CLI is an open-source AI agent (Apache 2.0) from Google that runs directly in the terminal. It provides access to Gemini models (including Gemini 3 with a 1M token context window) and has native support for MCP servers.

**Notable advantage**: a generous free tier — 60 requests/min and 1,000 requests/day with a simple Google account.

---

## Prerequisites

| Item | Minimum version | Notes |
|---------|-----------------|----------|
| Node.js | 18+ (20+ recommended) | [nodejs.org](https://nodejs.org) |
| Google Account | Free | For OAuth authentication; a Gemini API Key is also possible |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

---

## 1. Install Gemini CLI

### Via npm (recommended — all platforms)

```bash
npm install -g @google/gemini-cli
```

### Via npx — without permanent installation

```bash
npx @google/gemini-cli
```

### Via Homebrew (macOS / Linux)

```bash
brew install gemini-cli
```

### Via MacPorts (macOS)

```bash
sudo port install gemini-cli
```

---

## 2. Verify the installation

```bash
gemini --version
```

> **Windows** — If the command does not respond immediately, verify the installed version via npm instead:
> ```powershell
> npm list -g @google/gemini-cli
> ```

---

## 3. Google Authentication

Launch Gemini CLI for the first time to choose the authentication method:

```bash
gemini
```

### Option A — Google Account (OAuth) — recommended for individuals

Select **Login with Google** at the prompt. A browser opens for authentication. This option provides the free tier (60 req/min, 1,000 req/day).

### Option B — Gemini API Key

Generate a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then:

```bash
export GEMINI_API_KEY="AIza..."   # macOS / Linux
$env:GEMINI_API_KEY = "AIza..."   # Windows PowerShell
gemini
```

### Option C — Vertex AI (enterprise)

Vertex AI requires a Google Cloud account with the Gemini API enabled and credentials configured.

**Via Application Default Credentials (ADC) — recommended**
```bash
# Installer gcloud CLI si nécessaire : https://cloud.google.com/sdk/docs/install
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
gemini
```

**Via a service account key**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/service-account.json"
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
gemini
```

> For personal use, the OAuth method (Option A) is recommended. Vertex AI is reserved for enterprises with specific governance requirements.

---

## 4. Configure mcp-dataverse

Gemini CLI reads its MCP servers from `~/.gemini/settings.json`.

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

### Configuration file path

| OS | Path |
|----|--------|
| Windows | `%USERPROFILE%\.gemini\settings.json` |
| macOS / Linux | `~/.gemini/settings.json` |

### Using an mcp-dataverse configuration file

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

---

## 5. Dataverse Authentication

On the first call to an MCP tool, the server initiates a Device Code flow:

1. The URL and code are displayed **in the Gemini CLI terminal**
2. Open the URL in a browser, enter the code, and sign in with the Microsoft 365 account that has access to Dataverse
3. The token is stored locally — authentication is not repeated each session

> The code expires after 5 minutes. If it expires, ask another MCP question to regenerate a code.

---

## 6. Verify the integration

From a Gemini CLI session, send:

> **"Who am I in Dataverse?"**

Gemini will call `dataverse_whoami` via MCP and return the user's name and ID.

MCP tools are invoked automatically by the model according to the context of your question:

> "Which tables exist in my Dataverse environment?"
> "Show me the records in the contacts table."

> **Note**: The `@server://resource/path` syntax in Gemini CLI is used to reference *exposed MCP resources*, not to invoke tools directly. Tool invocation is automatic.

---

## Advanced settings

Add to the `env` block to adjust timeouts and retries:

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

## Quick troubleshooting

| Symptom | Likely cause | Solution |
|----------|---------------|---------|
| `ENOENT npx` or `command not found` | Node.js not in PATH | Install Node.js 20+ |
| MCP server not loaded | `settings.json` file not found | Check `~/.gemini/settings.json` |
| Invalid JSON | Syntax error in settings.json | Validate with a JSON linter |
| Device code expired | 5-minute time limit exceeded | Ask another question to regenerate a code |
| Dataverse token expired | 90+ days of inactivity | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Resources

- [Official Gemini CLI GitHub repository](https://github.com/google-gemini/gemini-cli)
- [MCP Server Integration Documentation](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [CLI Diagnostics](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli): `npx mcp-dataverse doctor`
