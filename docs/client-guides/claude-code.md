# Guide : mcp-dataverse sur Claude Code (CLI)

Ce guide couvre l'installation de Claude Code depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel depuis le terminal.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| OS | Windows 10 1809+ / macOS 13+ / Ubuntu 20.04+ | Voir [configuration réseau](https://code.claude.com/docs/en/network-config) pour les environnements restreints |
| RAM | 4 Go+ | Recommandé |
| Node.js | 20+ | Requis pour `npx mcp-dataverse` |
| Compte Anthropic | Pro, Max, Teams, Enterprise ou Console | Le plan gratuit n'inclut pas Claude Code |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

> **Windows** : [Git for Windows](https://git-scm.com/downloads/win) est requis. Claude Code utilise Git Bash en interne.

---

## 1. Installer Claude Code

### Installation native (recommandée)

Claude Code se met à jour automatiquement en arrière-plan et ne nécessite pas Node.js préinstallé.

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

> Installer [Git for Windows](https://git-scm.com/downloads/win) avant si ce n'est pas encore fait.

### Via Homebrew (macOS/Linux)

```bash
brew install --cask claude-code
```

### Via WinGet (Windows)

```powershell
winget install Anthropic.ClaudeCode
```

> Les installations Homebrew et WinGet **ne se mettent pas à jour automatiquement**. Utiliser `brew upgrade claude-code` ou `winget upgrade Anthropic.ClaudeCode` pour les mises à jour manuelles.

---

## 2. Vérifier l'installation

```bash
claude --version
claude doctor
```

`claude doctor` vérifie la version de Node.js, la configuration, l'authentification et la connectivité réseau.

---

## 3. Premier lancement et authentification Anthropic

Lancer Claude Code dans le répertoire de travail :

```bash
claude
```

À l'invite, sélectionner **Sign in with Claude.ai** et suivre les instructions dans le navigateur. Claude Code nécessite un plan Pro, Max, Teams, Enterprise ou un compte Console API.

---

## 4. Configurer mcp-dataverse

### Méthode rapide — commande `mcp add`

Enregistrer le serveur avec la variable d'environnement intégrée et en portée globale (`--scope user`) pour que l'outil soit disponible dans tous les projets :

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

> **Windows natif** : le wrapper `cmd /c` est obligatoire — sans lui, `npx` ne peut pas être exécuté directement et retourne une erreur "Connection closed".

> **Ordre des arguments** : le nom du serveur (`mcp-dataverse`) doit impérativement être placé **avant** le flag `-e`/`--env`. En raison du comportement variadic de `-e <env...>`, placer le nom après la variable d'environnement provoque l'erreur `Invalid environment variable format: mcp-dataverse`.

Cette commande écrit l'entrée dans `~/.claude.json` automatiquement.

#### Portées disponibles (`--scope`)

| Scope | Disponibilité | Fichier généré |
|-------|--------------|----------------|
| `local` (défaut) | Répertoire courant uniquement | `.claude/settings.local.json` |
| `project` | Tous les membres du projet | `.mcp.json` à la racine |
| `user` | Tous vos projets (recommandé) | `~/.claude.json` |

### Méthode manuelle — édition de `~/.claude.json`

Ouvrir (ou créer) `~/.claude.json` et ajouter la clé `mcpServers` :

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

### Portée workspace (projet spécifique)

Pour limiter le serveur à un seul projet, créer `.mcp.json` à la racine du projet :

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

## 5. Authentification Dataverse

Au premier appel d'un outil MCP, le serveur lance un flux Device Code :

1. Le code et l'URL s'affichent **directement dans le terminal** Claude Code
2. Ouvrir l'URL dans un navigateur, entrer le code, se connecter avec le compte Microsoft 365 ayant accès à Dataverse
3. Le token est stocké localement — pas besoin de répéter cette étape

> Le code expire après 5 minutes. En cas d'expiration, relancer la commande pour en générer un nouveau.

---

## 6. Vérifier l'intégration

Depuis la session Claude Code, poser la question :

> **"Who am I in Dataverse?"**

Claude appellera `dataverse_whoami`. Une réponse indiquant le nom de l'utilisateur confirme que tout fonctionne.

---

## Plusieurs environnements Dataverse

Pour travailler avec plusieurs organisations, définir des entrées distinctes :

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

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| `ENOENT npx` | Node.js absent du PATH | Installer Node.js 20+ |
| Code de périphérique non affiché | Variable d'environnement non définie avant le lancement | Définir `DATAVERSE_ENV_URL` dans le shell avant de lancer `claude` |
| Supprimer un serveur MCP | — | `claude mcp remove mcp-dataverse` |
| Lister les serveurs MCP configurés | — | `claude mcp list` |
| Migrer depuis npm vers l'installation native | npm deprecated | `curl -fsSL https://claude.ai/install.sh \| bash` puis `npm uninstall -g @anthropic-ai/claude-code` |

---

## Ressources

- [Documentation officielle Claude Code – Advanced setup](https://code.claude.com/docs/en/setup)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
