# Guide : mcp-dataverse sur Gemini CLI (Google)

Ce guide couvre l'installation de Gemini CLI depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel depuis le terminal.

---

## Qu'est-ce que Gemini CLI ?

Gemini CLI est un agent IA open source (Apache 2.0) de Google qui s'exécute directement dans le terminal. Il donne accès aux modèles Gemini (dont Gemini 3 avec une fenêtre de contexte de 1M tokens) et supporte nativement les serveurs MCP.

**Avantage notable** : un tier gratuit généreux — 60 requêtes/min et 1 000 requêtes/jour avec un simple compte Google.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| Node.js | 18+ (20+ recommandé) | [nodejs.org](https://nodejs.org) |
| Compte Google | Gratuit | Pour l'authentification OAuth ; un API Key Gemini est aussi possible |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

---

## 1. Installer Gemini CLI

### Via npm (recommandé — toutes plateformes)

```bash
npm install -g @google/gemini-cli
```

### Via npx — sans installation permanente

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

## 2. Vérifier l'installation

```bash
gemini --version
```

> **Windows** — Si la commande ne répond pas immédiatement, vérifier la version installée via npm à la place :
> ```powershell
> npm list -g @google/gemini-cli
> ```

---

## 3. Authentification Google

Lancer Gemini CLI la première fois pour choisir la méthode d'authentification :

```bash
gemini
```

### Option A — Compte Google (OAuth) — recommandé pour les particuliers

Sélectionner **Login with Google** à l'invite. Un navigateur s'ouvre pour l'authentification. Cette option offre le tier gratuit (60 req/min, 1 000 req/jour).

### Option B — Clé API Gemini

Générer une clé sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey), puis :

```bash
export GEMINI_API_KEY="AIza..."   # macOS / Linux
$env:GEMINI_API_KEY = "AIza..."   # Windows PowerShell
gemini
```

### Option C — Vertex AI (entreprise)

Vertex AI nécessite un compte Google Cloud avec l'API Gemini activée et des credentials configurés.

**Via Application Default Credentials (ADC) — recommandé**
```bash
# Installer gcloud CLI si nécessaire : https://cloud.google.com/sdk/docs/install
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
gemini
```

**Via une clé de compte de service**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/service-account.json"
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
gemini
```

> Pour un usage personnel, la méthode OAuth (Option A) est recommandée. Vertex AI est réservé aux entreprises avec des exigences de gouvernance spécifiques.

---

## 4. Configurer mcp-dataverse

Gemini CLI lit ses serveurs MCP depuis `~/.gemini/settings.json`.

Créer ou éditer ce fichier :

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

### Chemin du fichier de config

| OS | Chemin |
|----|--------|
| Windows | `%USERPROFILE%\.gemini\settings.json` |
| macOS / Linux | `~/.gemini/settings.json` |

### Utiliser un fichier de config mcp-dataverse

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

## 5. Authentification Dataverse

Au premier appel d'un outil MCP, le serveur lance un flux Device Code :

1. L'URL et le code s'affichent **dans le terminal** Gemini CLI
2. Ouvrir l'URL dans un navigateur, entrer le code, se connecter avec le compte Microsoft 365 ayant accès à Dataverse
3. Le token est stocké localement — l'authentification n'est pas rejouée à chaque session

> Le code expire après 5 minutes. En cas d'expiration, reposer une question MCP pour régénérer un code.

---

## 6. Vérifier l'intégration

Depuis une session Gemini CLI, envoyer :

> **"Who am I in Dataverse?"**

Gemini appellera `dataverse_whoami` via MCP et retournera le nom et l'ID de l'utilisateur.

Les outils MCP sont invoqués automatiquement par le modèle selon le contexte de votre question :

> "Quelles tables existent dans mon environnement Dataverse ?"
> "Montre-moi les enregistrements de la table contacts."

> **Note** : La syntaxe `@server://resource/path` dans Gemini CLI sert à référencer des *ressources MCP exposées*, pas à invoquer directement des outils. L'invocation d'outils est automatique.

---

## Paramètres fins

Ajouter dans le bloc `env` pour ajuster les timeouts et retries :

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

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| `ENOENT npx` ou `command not found` | Node.js absent du PATH | Installer Node.js 20+ |
| Serveur MCP non chargé | Fichier `settings.json` introuvable | Vérifier `~/.gemini/settings.json` |
| JSON invalide | Erreur de syntaxe dans settings.json | Valider avec un linter JSON |
| Code de périphérique expiré | Délai de 5 min dépassé | Reposer la question pour régénérer un code |
| Token Dataverse expiré | 90+ jours d'inactivité | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Ressources

- [Dépôt GitHub officiel Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Documentation MCP Server Integration](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
