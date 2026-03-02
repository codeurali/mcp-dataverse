---
layout: default
title: Codex CLI
parent: Multi-Client Setup
nav_order: 3
---

# Guide: mcp-dataverse on Codex CLI (OpenAI)

This guide covers installing Codex CLI from scratch through to a first working MCP Dataverse call from the terminal.

---

## What is Codex CLI?

Codex CLI is OpenAI's local code agent. It runs in the terminal, accesses your local files, and supports MCP servers to extend its capabilities to external tools such as Dataverse.

---

## Prerequisites

| Item | Minimum version | Note |
|---------|-----------------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) — required for `npx mcp-dataverse` (not for Codex CLI itself) |
| OpenAI account | ChatGPT Plus, Pro, Team, Edu or Enterprise | Or an OpenAI API key with credits |
| Dataverse URL | `https://yourorg.crm.dynamics.com` | Your Power Platform organisation |

> **Note:** When installed via npm (`npm install -g @openai/codex`), Codex CLI is a Node.js/JavaScript package. Native builds (Rust or otherwise) may exist for certain platforms, but the npm version — the most widely used — runs on Node.js. Node.js remains required to launch the mcp-dataverse server via `npx`.

---

## 1. Install Codex CLI

### Via npm (all platforms)

```bash
npm install -g @openai/codex
```

### Via Homebrew (macOS only)

```bash
brew install --cask codex
```

### Via direct binary

Download the binary for your platform from the [latest GitHub release](https://github.com/openai/codex/releases/latest) and add it to your PATH.

---

## 2. Verify the installation

```bash
codex --version
```

---

## 3. OpenAI Authentication

Launch Codex CLI:

```bash
codex
```

At the prompt, select **Sign in with ChatGPT** to use your ChatGPT plan (Plus, Pro, Team, Edu, or Enterprise).

To use an API key instead:

```bash
export OPENAI_API_KEY="sk-..."   # macOS / Linux
$env:OPENAI_API_KEY = "sk-..."   # Windows PowerShell
codex
```

---

## 4. Configure mcp-dataverse

Codex CLI reads its MCP servers from `~/.codex/config.toml` (TOML format).

Create or edit this file to add `mcp-dataverse`:

```toml
[mcp_servers.mcp-dataverse]
command = "npx"
args = ["-y", "mcp-dataverse"]

[mcp_servers.mcp-dataverse.env]
DATAVERSE_ENV_URL = "https://yourorg.crm.dynamics.com"
```

Replace `https://yourorg.crm.dynamics.com` with the actual URL of your organisation.

### Configuration file path

| OS | Path |
|----|--------|
| Windows | `%USERPROFILE%\.codex\config.toml` |
| macOS / Linux | `~/.codex/config.toml` |

### Using an mcp-dataverse configuration file

An alternative to `DATAVERSE_ENV_URL` for centralising configuration:

```toml
[mcp_servers.mcp-dataverse]
command = "npx"
args = ["-y", "mcp-dataverse"]

[mcp_servers.mcp-dataverse.env]
MCP_CONFIG_PATH = "/Users/votreNom/.mcp-dataverse/config.json"
```

---

## 5. Dataverse Authentication

On the first call to an MCP tool, the server initiates a Device Code flow:

1. The URL and code are displayed **in the Codex terminal**
2. Open the URL in a browser, enter the code, and sign in with the Microsoft 365 account that has access to Dataverse
3. The token is stored locally — authentication is not repeated each session

> The code expires after 5 minutes. If it expires, re-invoke the tool from Codex to generate a new one.

---

## 6. Verify the integration

In a Codex CLI session, send:

> **"Who am I in Dataverse?"**

Codex will call `dataverse_whoami` and return the user's name and ID. A correct response validates the entire chain.

---

## Fine-tuning parameters

Add the following to the `env` block to adjust timeouts and retries:

```toml
[mcp_servers.mcp-dataverse.env]
DATAVERSE_ENV_URL = "https://yourorg.crm.dynamics.com"
REQUEST_TIMEOUT_MS = "60000"
MAX_RETRIES = "5"
```

---

## Quick troubleshooting

| Symptom | Probable cause | Solution |
|----------|---------------|---------|
| `ENOENT npx` | Node.js not in PATH | Install Node.js and verify that `npx` is in the PATH |
| MCP server not loaded | Config file in wrong location or incorrect format | Check `~/.codex/config.toml` (TOML format, not JSON) |
| TOML syntax error | Invalid TOML in config file | Validate the TOML with a linter (VS Code extension **Even Better TOML**) |
| Device code expired | 5-minute timeout exceeded | Re-send the query in Codex to regenerate a code |
| Token expired (90+ days) | Refresh token revoked | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Resources

- [Official Codex CLI GitHub repository](https://github.com/openai/codex)
- [Codex documentation](https://developers.openai.com/codex)
- [Codex configuration reference](https://developers.openai.com/codex/config-reference)
- [Full multi-client reference](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [CLI diagnostics](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli): `npx mcp-dataverse doctor`
