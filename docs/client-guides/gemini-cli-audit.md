---
nav_exclude: true
---

# Rapport de vérification — `gemini-cli.md`

**Date** : vérification effectuée contre les sources officielles v0.31.x  
**Sources consultées** :
- [`github.com/google-gemini/gemini-cli` — README](https://github.com/google-gemini/gemini-cli)
- [`docs/reference/configuration.md`](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md)
- [`docs/get-started/authentication.md`](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md)
- [`docs/tools/mcp-server.md`](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)

---

## Statut global : ⚠️ Corrections recommandées (3 points)

La majorité du document est factuellement correcte. Deux problèmes d'exactitude et un point de style/clarté ont été identifiés.

---

## Points vérifiés et confirmés ✅

| Section | Contenu vérifié | Source |
|---------|----------------|--------|
| npm install | `npm install -g @google/gemini-cli` | README |
| npx | `npx @google/gemini-cli` | README |
| Homebrew | `brew install gemini-cli` | README |
| MacPorts | `sudo port install gemini-cli` | README |
| Node.js prérequis | 18+ (20+ recommandé) | README |
| Chemin config macOS/Linux | `~/.gemini/settings.json` | `configuration.md` |
| Chemin config Windows | `%USERPROFILE%\.gemini\settings.json` | `configuration.md` (~ = home) |
| Clé JSON | `mcpServers` | `configuration.md` section `mcpServers` |
| Propriétés MCP | `command`, `args`, `env`, `cwd`, `timeout`, `trust` | `configuration.md` |
| Auth Option A | Login with Google → sélectionner "Login with Google" | `authentication.md` |
| Auth Option B | `GEMINI_API_KEY` + sélectionner "Use Gemini API key" | `authentication.md` |
| Variables Vertex AI | `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` | `authentication.md` |
| Vérification install | `gemini --version` | Syntaxe CLI standard |
| Modèle Gemini 3 | Confirmé dans les alias de `configuration.md` (`gemini-3-pro-preview`) | `configuration.md` |

---

## Corrections nécessaires

### 1. ⚠️ Auth Option C — Vertex AI : étapes incomplètes

**Texte actuel** :
```bash
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=true
gemini
```

**Problème** : La documentation officielle (`authentication.md`) indique que la configuration de `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` est nécessaire mais **pas suffisante**. Il faut *aussi* une credential pour s'authentifier auprès de Vertex AI. Trois méthodes sont officiellement supportées :

- **A)** ADC via `gcloud auth application-default login`
- **B)** Service account : variable `GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/key.json`
- **C)** Google Cloud API key : variable `GOOGLE_API_KEY`

Par ailleurs, la variable `GOOGLE_GENAI_USE_VERTEXAI=true` **n'est pas documentée** dans les docs officielles du CLI (`authentication.md`, `configuration.md`). Elle provient du SDK Google Generative AI sous-jacent et peut fonctionner, mais la méthode officielle est de lancer `gemini` puis de sélectionner **Vertex AI** dans le menu interactif.

**Texte corrigé recommandé** :

```bash
# 1. Configurer le projet et la région
export GOOGLE_CLOUD_PROJECT="mon-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"

# 2. Choisir UNE méthode d'authentification :

# Méthode A — Application Default Credentials (gcloud installé)
gcloud auth application-default login

# Méthode B — Service Account (CI/CD, pipelines)
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/key.json"

# Méthode C — Google Cloud API Key
export GOOGLE_API_KEY="VOTRE_CLE_API_GOOGLE_CLOUD"

# 3. Lancer Gemini CLI et sélectionner "Vertex AI"
gemini
```

**Source** : `authentication.md` — section "Use Vertex AI"

---

### 2. ⚠️ Syntaxe `@mcp-dataverse` — formulation trompeuse

**Texte actuel** :
```
@mcp-dataverse list tables in my Dataverse environment
```

**Problème** : La syntaxe `@` dans Gemini CLI sert à **référencer des ressources** (fichiers locaux ou ressources MCP via URI : `@server://resource/path`), pas à invoquer des outils. Selon `mcp-server.md` et `configuration.md`, les outils MCP sont invoqués **automatiquement** par le modèle en fonction de votre demande en langage naturel. Il n'y a pas de commande `@servername toolname args` documentée.

**Ce qui fonctionne réellement** :

| Méthode | Exemple |
|---------|---------|
| Langage naturel (officiel) | `"Liste toutes les tables de mon environnement Dataverse"` |
| Référence de ressource MCP | `@mcp-dataverse://tables` (si le serveur expose des ressources) |
| Vérification du serveur | `/mcp` (commande built-in pour lister les serveurs MCP actifs) |

**Texte corrigé recommandé** pour la section §6 :

```
"Who am I in Dataverse?"
```
Gemini appellera `dataverse_whoami` automatiquement. Pour appeler d'autres outils, formulez votre demande naturellement :

```
List all tables in my Dataverse environment
```
```
Show me the accounts where revenue > 10000
```

Pour vérifier que le serveur MCP est bien chargé, utilisez la commande CLI `/mcp`.

---

### 3. ℹ️ Mention de fenêtre de contexte 1M tokens — formulation à préciser

**Texte actuel** : *"Gemini 3 avec une fenêtre de contexte de 1M tokens"*

**Observation** : La fenêtre de contexte de 1M tokens est documentée pour **Gemini 2.5 Pro**. Pour Gemini 3 Pro Preview (modèle actif en v0.31.x), la valeur exacte n'est pas encore publiée dans la documentation officielle. La formulation est probablement correcte mais non vérifiable officiellement à ce jour.

**Suggestion** : Remplacer par *"Gemini 2.5 Pro / Gemini 3 avec une fenêtre de contexte allant jusqu'à 1M tokens"* ou omettre la valeur exacte pour éviter toute obsolescence.

---

## Suggestions supplémentaires (non bloquantes)

### A. Ajouter la commande CLI `gemini mcp` (découverte depuis `mcp-server.md`)

Gemini CLI dispose de commandes dédiées à la gestion des serveurs MCP, absentes du guide :

```bash
gemini mcp list           # Lister les serveurs MCP configurés
gemini mcp enable <nom>   # Activer un serveur
gemini mcp disable <nom>  # Désactiver un serveur
```

### B. Mentionner la propriété `trust: true` pour éviter les confirmations

La propriété `trust` (documentée dans `configuration.md`) permet d'auto-approuver tous les appels d'outils pour un serveur donné — utile en usage développement :

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "trust": true,
      "env": {
        "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
      }
    }
  }
}
```

### C. Propriétés `includeTools` / `excludeTools` (filtrage des outils exposés)

Ces propriétés optionnelles permettent de limiter les outils visibles par le modèle, utile si le serveur expose trop d'outils :

```json
"includeTools": ["dataverse_whoami", "dataverse_query", "dataverse_list_tables"]
```

---

## Récapitulatif des actions

| Priorité | Section | Action |
|----------|---------|--------|
| 🔴 Haute | Auth Option C (Vertex AI) | Ajouter les étapes ADC / service account / API key manquantes |
| 🟡 Moyenne | Syntaxe `@mcp-dataverse` | Remplacer par langage naturel + note sur `/mcp` |
| 🟢 Basse | Contexte 1M tokens | Préciser "Gemini 2.5 Pro / Gemini 3" ou supprimer la valeur exacte |
| 💡 Suggestion | §4 JSON config | Ajouter propriété `trust` dans l'exemple |
| 💡 Suggestion | §6 Vérification | Mentionner `gemini mcp list` en alternative |
