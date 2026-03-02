# Guide : mcp-dataverse en mode HTTP (multi-client)

Ce guide explique comment démarrer mcp-dataverse en mode serveur HTTP afin que plusieurs éditeurs ou outils IA puissent partager la même instance du serveur MCP simultanément.

---

## Pourquoi le mode HTTP ?

Le mode par défaut (`stdio`) crée un processus mcp-dataverse distinct pour **chaque** client IA. Le mode HTTP démarre **un seul processus** sur un port réseau, auquel tous les clients se connectent.

| Mode | Transport | Processus | Adapté pour |
|------|-----------|-----------|-------------|
| stdio | Pipe stdin/stdout | 1 par client | Un seul éditeur |
| **http** | HTTP + SSE/Streaming | **1 partagé** | Plusieurs éditeurs, équipes, dashboards |

### Cas d'usage typiques

- Travailler simultanément dans Cursor ET dans Claude Desktop sur le même Dataverse
- Un pipeline CI/CD qui appelle des outils Dataverse via HTTP
- Un dashboard (ex : n8n, LangGraph) qui interroge Dataverse via MCP
- Partager une session authentifiée entre plusieurs membres d'une équipe (session locale uniquement)

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | |

---

## 1. Démarrer le serveur HTTP

### Commande minimale

```bash
npx -y mcp-dataverse --transport http --port 3001
```

Le serveur démarre et écoute sur `http://localhost:3001`.

### Avec l'URL Dataverse en variable d'environnement

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

### Avec un fichier de config mcp-dataverse

```bash
MCP_CONFIG_PATH=~/.mcp-dataverse/config.json npx -y mcp-dataverse --transport http --port 3001
```

---

## 2. Vérifier que le serveur est actif

```bash
curl http://localhost:3001/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "version": "x.y.z",
  "tools": 63
}
```

---

## 3. Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/mcp` | `POST`, `GET` | Endpoint MCP principal (Streamable HTTP). POST pour envoyer des messages JSON-RPC ; GET pour ouvrir un flux SSE de notifications serveur. |
| `/health` | `GET` | Vérifie que le serveur est opérationnel |

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

## 5. Connecter les clients au serveur HTTP

### Claude Desktop

Modifier `claude_desktop_config.json` :

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

### Client HTTP générique (curl, scripts)

Le protocole MCP Streamable HTTP requiert d'abord d'initialiser une session avant tout appel d'outil.

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

> Les clients MCP natifs (Cursor, Claude Desktop…) gèrent le cycle `initialize` → session → tools/call automatiquement. Pour les scripts personnalisés, ce cycle doit être géré explicitement.

---

## 6. Authentification Dataverse

Il suffit qu'**un seul** client déclenche l'authentification — tous les autres bénéficient ensuite de la même session.

1. Démarrer le serveur HTTP dans un terminal
2. Faire un premier appel depuis n'importe quel client connecté
3. Le terminal affiche l'URL et le code Device Code
4. Ouvrir l'URL dans un navigateur, saisir le code, se connecter avec le compte Microsoft 365
5. Le token est stocké localement et partagé par toutes les connexions entrantes

---

## 7. Démarrage automatique (optionnel)

### systemd (Linux)

Créer `/etc/systemd/system/mcp-dataverse.service` :

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

## 8. Sécurité

> **Par défaut, le serveur écoute uniquement sur `localhost` (127.0.0.1).** Il n'est accessible que depuis la machine locale.

Pour exposer le serveur à d'autres machines (partage en équipe) :

1. Utiliser un **reverse proxy** (nginx, Caddy, Traefik) avec TLS
2. Ajouter une couche d'authentification devant le proxy (`Authorization: Bearer …`)
3. Ne jamais exposer le port 3001 directement sur Internet

**Ne pas exposer le serveur HTTP sans authentification**, même en réseau local d'entreprise : le serveur agit avec les permissions du compte Dataverse authentifié.

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| `Connection refused` sur `/health` | Serveur non démarré | Vérifier le terminal du serveur |
| Port 3001 déjà utilisé | Autre processus | `--port 3002` ou libérer le port |
| Client ne trouve pas les outils | URL incorrecte | Vérifier que l'URL pointe sur `/mcp` (pas `/`) |
| Token non partagé | Clients en mode stdio en parallèle | Vérifier que tous les clients utilisent le mode `http` |
| Code Device Code invisible | Serveur démarré en arrière-plan | Utiliser pm2 logs ou journalctl |

---

## Ressources

- [Page multi-client officielle](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started) : `npx mcp-dataverse doctor`
- [Guide démarrage rapide](https://codeurali.github.io/mcp-dataverse/getting-started)
