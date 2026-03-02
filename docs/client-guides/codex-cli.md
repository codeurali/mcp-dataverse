# Guide : mcp-dataverse sur Codex CLI (OpenAI)

Ce guide couvre l'installation de Codex CLI depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel depuis le terminal.

---

## Qu'est-ce que Codex CLI ?

Codex CLI est l'agent de code local d'OpenAI. Il s'exécute dans le terminal, accède à vos fichiers locaux, et supporte les serveurs MCP pour étendre ses capacités vers des outils externes comme Dataverse.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) — nécessaire pour `npx mcp-dataverse` (pas pour Codex CLI lui-même) |
| Compte OpenAI | ChatGPT Plus, Pro, Team, Edu ou Enterprise | Ou une clé API OpenAI avec crédits |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

> **Note :** Installé via npm (`npm install -g @openai/codex`), Codex CLI est un package Node.js/JavaScript. Des builds natifs (Rust ou autre) peuvent exister pour certaines plateformes, mais la version npm — la plus répandue — s'exécute sur Node.js. Node.js reste nécessaire pour lancer le serveur mcp-dataverse via `npx`.

---

## 1. Installer Codex CLI

### Via npm (toutes plateformes)

```bash
npm install -g @openai/codex
```

### Via Homebrew (macOS uniquement)

```bash
brew install --cask codex
```

### Via binaire direct

Télécharger le binaire correspondant à votre plateforme depuis la [dernière release GitHub](https://github.com/openai/codex/releases/latest) et l'ajouter au PATH.

---

## 2. Vérifier l'installation

```bash
codex --version
```

---

## 3. Authentification OpenAI

Lancer Codex CLI :

```bash
codex
```

À l'invite, sélectionner **Sign in with ChatGPT** pour utiliser votre plan ChatGPT (Plus, Pro, Team, Edu ou Enterprise).

Pour utiliser une clé API à la place :

```bash
export OPENAI_API_KEY="sk-..."   # macOS / Linux
$env:OPENAI_API_KEY = "sk-..."   # Windows PowerShell
codex
```

---

## 4. Configurer mcp-dataverse

Codex CLI lit ses serveurs MCP depuis `~/.codex/config.toml` (format TOML).

Créer ou éditer ce fichier pour y ajouter `mcp-dataverse` :

```toml
[mcp_servers.mcp-dataverse]
command = "npx"
args = ["-y", "mcp-dataverse"]

[mcp_servers.mcp-dataverse.env]
DATAVERSE_ENV_URL = "https://yourorg.crm.dynamics.com"
```

Remplacer `https://yourorg.crm.dynamics.com` par l'URL réelle de votre organisation.

### Chemin du fichier de config

| OS | Chemin |
|----|--------|
| Windows | `%USERPROFILE%\.codex\config.toml` |
| macOS / Linux | `~/.codex/config.toml` |

### Utiliser un fichier de config mcp-dataverse

Alternative à `DATAVERSE_ENV_URL` pour centraliser les paramètres :

```toml
[mcp_servers.mcp-dataverse]
command = "npx"
args = ["-y", "mcp-dataverse"]

[mcp_servers.mcp-dataverse.env]
MCP_CONFIG_PATH = "/Users/votreNom/.mcp-dataverse/config.json"
```

---

## 5. Authentification Dataverse

Au premier appel d'un outil MCP, le serveur lance un flux Device Code :

1. L'URL et le code s'affichent **dans le terminal** Codex
2. Ouvrir l'URL dans un navigateur, entrer le code, se connecter avec le compte Microsoft 365 ayant accès à Dataverse
3. Le token est stocké localement — l'authentification n'est pas rejouée à chaque session

> Le code expire au bout de 5 minutes. En cas d'expiration, relancer l'outil depuis Codex pour en générer un nouveau.

---

## 6. Vérifier l'intégration

Dans une session Codex CLI, envoyer :

> **"Who am I in Dataverse?"**

Codex appellera `dataverse_whoami` et retournera le nom et l'ID de l'utilisateur. Une réponse correcte valide l'ensemble de la chaîne.

---

## Paramètres fins

Ajouter dans le bloc `env` pour ajuster les timeouts et retries :

```toml
[mcp_servers.mcp-dataverse.env]
DATAVERSE_ENV_URL = "https://yourorg.crm.dynamics.com"
REQUEST_TIMEOUT_MS = "60000"
MAX_RETRIES = "5"
```

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| `ENOENT npx` | Node.js absent du PATH | Installer Node.js et vérifier que `npx` est dans le PATH |
| Serveur MCP non chargé | Fichier config mal situé ou mauvais format | Vérifier `~/.codex/config.toml` (format TOML, pas JSON) |
| Erreur de syntaxe TOML | TOML invalide dans config | Valider le TOML avec un linter (extension VS Code **Even Better TOML**) |
| Code de périphérique expiré | Délai de 5 min dépassé | Reposer la question dans Codex pour régénérer un code |
| Token expiré (90+ jours) | Refresh token révoqué | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Ressources

- [Dépôt GitHub officiel Codex CLI](https://github.com/openai/codex)
- [Documentation Codex](https://developers.openai.com/codex)
- [Référence de configuration Codex](https://developers.openai.com/codex/config-reference)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
