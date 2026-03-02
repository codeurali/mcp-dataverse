---
layout: default
title: Windsurf
parent: Multi-Client Setup
nav_order: 6
---

# Guide : mcp-dataverse sur Windsurf

Ce guide couvre l'installation de Windsurf depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel dans l'éditeur.

---

## Qu'est-ce que Windsurf ?

Windsurf est le premier IDE "agentic" selon ses créateurs (Cognition / Codeium), fork de VS Code. Son IA principale, **Cascade**, maintient une conscience contextuelle complète du codebase en temps réel. Il supporte nativement le protocole MCP pour connecter des outils externes comme Dataverse à l'IA.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| OS | Windows 10+ / macOS 13 (Ventura)+ / Linux (Ubuntu 20.04+) | |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx doit être disponible |
| Compte Windsurf | Gratuit (tier Free disponible) | [windsurf.com](https://windsurf.com) |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

---

## 1. Installer Windsurf

### Windows

1. Télécharger depuis **[windsurf.com/download](https://windsurf.com/download)**
   - Version x64 : pour les PC Intel/AMD classiques
   - Version arm64 : pour les PC Windows ARM (Surface Pro X, Snapdragon…)
2. Lancer le fichier `.exe` et suivre l'assistant d'installation

### macOS

1. Télécharger le fichier `.dmg` depuis **[windsurf.com/download](https://windsurf.com/download)**
2. Glisser l'icône **Windsurf** dans le dossier Applications

### Linux

1. Télécharger le paquet correspondant à votre distribution depuis **[windsurf.com/download](https://windsurf.com/download)**
2. Pour `.deb` (Debian/Ubuntu) : `sudo dpkg -i windsurf-*.deb`
3. Pour `.rpm` (Fedora/RHEL) : `sudo rpm -i windsurf-*.rpm`

---

## 2. Créer un compte et se connecter

Au premier lancement, Windsurf invite à créer un compte ou se connecter via Google / GitHub. Le plan Free offre 25 crédits Cascade par mois.

---

## 3. Configurer mcp-dataverse

Windsurf supporte deux portées de configuration MCP :

| Portée | Chemin | Quand l'utiliser |
|--------|--------|-----------------|
| **Global** (tous les workspaces) | `~/.codeium/windsurf/mcp_config.json` | Configuration partagée entre tous les projets |
| **Workspace** (projet courant) | `.windsurf/mcp.json` à la racine du projet | Configuration isolée par projet, recommandée pour les équipes |

### Portée globale

| OS | Chemin |
|----|--------|
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| macOS / Linux | `~/.codeium/windsurf/mcp_config.json` |

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

Remplacer l'URL par celle de votre organisation Dataverse.

### Portée workspace

Créer le fichier `.windsurf/mcp.json` à la racine de votre projet (committer ce fichier permet de partager la configuration avec l'équipe) :

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

> La portée workspace est prioritaire sur la portée globale si les deux existent.

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

### Plusieurs environnements Dataverse

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

### Paramètres fins

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

## 4. Accéder aux paramètres MCP dans Windsurf

**Via l'interface graphique Cascade :**

1. Dans le panneau **Cascade**, cliquer sur l'icône **MCPs** (menu en haut à droite du panneau)
2. OU : **Windsurf Settings** → **Cascade** → **MCP Servers**

**En éditant le fichier directement :**

Ouvrir `~/.codeium/windsurf/mcp_config.json` (`%USERPROFILE%\.codeium\windsurf\mcp_config.json` sur Windows) dans n'importe quel éditeur de texte.

> La commande palette `Ctrl+Shift+P` / `Cmd+Shift+P` → **Windsurf: Open MCP Config** peut également fonctionner selon la version installée, mais n'est pas documentée officiellement.

Après modification du fichier, **recharger la fenêtre** (`Developer: Reload Window`) pour que les serveurs soient pris en compte.

---

## 5. Authentification Dataverse

Au premier appel d'un outil MCP depuis Cascade, le serveur lance un flux Device Code :

1. Dans Windsurf, ouvrir le panneau **Output** → sélectionner **MCP** dans la liste déroulante
2. L'URL et le code de connexion s'affichent
3. Ouvrir l'URL dans un navigateur, entrer le code, se connecter avec le compte Microsoft 365 ayant accès à Dataverse
4. Le token est stocké localement — l'authentification n'est pas rejouée à chaque session

> Le code expire après 5 minutes. Reposer une question via Cascade pour en générer un nouveau.

---

## 6. Vérifier l'intégration

Ouvrir le panneau **Cascade** (icône vague en bas à droite ou `Ctrl+L`) et envoyer :

> **"Who am I in Dataverse?"**

Cascade appellera `dataverse_whoami` et affichera le nom et l'ID de l'utilisateur. Une réponse correcte valide la connexion complète.

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| Serveur MCP non chargé | Fichier `mcp_config.json` absent ou mal formé | Vérifier `~/.codeium/windsurf/mcp_config.json` |
| `ENOENT npx` | Node.js absent du PATH | Installer Node.js 20+ et recharger Windsurf |
| Code de périphérique invisible | Panneau Output non ouvert | Output → liste déroulante → MCP |
| JSON invalide | Erreur de syntaxe | Valider le JSON avec un linter |
| Token expiré (90+ jours) | Refresh token révoqué | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Ressources

- [Site officiel Windsurf](https://windsurf.com)
- [Documentation MCP Windsurf](https://docs.windsurf.com/windsurf/cascade/mcp)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
