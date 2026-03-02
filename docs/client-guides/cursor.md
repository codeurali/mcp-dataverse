---
layout: default
title: Cursor
parent: Multi-Client Setup
nav_order: 4
---

# Guide : mcp-dataverse sur Cursor

Ce guide couvre l'installation de Cursor depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel dans l'éditeur.

---

## Qu'est-ce que Cursor ?

Cursor est un éditeur de code AI-first, fork de VS Code, développé par Anysphere. Il intègre des agents autonomes, de l'autocomplétion intelligente et supporte nativement le protocole MCP pour connecter des outils externes directement à l'IA.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| OS | Windows 10+ / macOS 10.15 (Catalina)+ / Linux (Ubuntu 20.04+) | |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx doit être disponible |
| Compte Cursor | Gratuit (Hobby) pour démarrer | Plan Pro recommandé pour un usage intensif |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

---

## 1. Installer Cursor

### Windows

1. Télécharger depuis **[cursor.com/download](https://cursor.com/download)**
2. Lancer le fichier `.exe` téléchargé et suivre l'assistant d'installation
3. Cursor s'installe par défaut dans `%LOCALAPPDATA%\Programs\Cursor`

### macOS

1. Télécharger le fichier `.dmg` depuis **[cursor.com/download](https://cursor.com/download)**
2. Glisser l'icône **Cursor** dans le dossier Applications
3. Lancer Cursor depuis le Launchpad ou avec `open -a Cursor`

### Linux

1. Télécharger le fichier `.AppImage` ou `.deb` depuis **[cursor.com/download](https://cursor.com/download)**
2. Pour AppImage : `chmod +x Cursor-*.AppImage && ./Cursor-*.AppImage`
3. Pour `.deb` (Debian/Ubuntu) : `sudo apt install ./cursor-*.deb`

---

## 2. Créer un compte et se connecter

Au premier lancement, Cursor propose de :
- Créer un compte Cursor (email + mot de passe ou OAuth GitHub/Google)
- Importer les paramètres VS Code existants (extensions, keybindings, thèmes)

---

## 3. Configurer mcp-dataverse

> **Format important** — Cursor utilise la clé `mcpServers` (et non `servers` comme VS Code).

### Portée workspace (recommandée)

Créer le fichier `.cursor/mcp.json` à la racine du workspace :

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

### Portée globale (tous les workspaces)

Créer `~/.cursor/mcp.json` dans le répertoire home pour rendre les outils disponibles dans tous les projets :

> **Windows** — Le répertoire `~\.cursor` n'est pas créé automatiquement. S'il n'existe pas encore :
> ```powershell
> New-Item -ItemType Directory -Force "$env:USERPROFILE\.cursor"
> ```

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

### Utiliser un fichier de config mcp-dataverse

```json
{
  "mcpServers": {
    "mcp-dataverse": {
      "command": "npx",
      "args": ["-y", "mcp-dataverse"],
      "env": {
        "MCP_CONFIG_PATH": "C:\\Users\\VotreNom\\.mcp-dataverse\\config.json"
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

---

## 4. Redémarrer Cursor

Après avoir créé ou modifié `.cursor/mcp.json`, **recharger la fenêtre** pour que Cursor prenne en compte les serveurs MCP :

- `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (macOS) → **Developer: Reload Window**

---

## 5. Authentification Dataverse

Au premier appel d'un outil MCP, le serveur lance un flux Device Code :

1. Ouvrir le panneau **Output** (`Ctrl+Shift+U`) → sélectionner **MCP Logs** dans la liste déroulante
2. L'URL et le code de connexion s'affichent dans ce panneau
3. Ouvrir l'URL dans un navigateur, entrer le code, se connecter avec le compte Microsoft 365 ayant accès à Dataverse
4. Le token est stocké localement — l'authentification n'est pas rejouée à chaque session

---

## 6. Vérifier l'intégration

Ouvrir le chat Cursor (Agent mode) et envoyer :

> **"Who am I in Dataverse?"**

Cursor appellera `dataverse_whoami` et affichera le nom et l'ID de l'utilisateur. Une réponse correcte valide l'ensemble de la chaîne.

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| Serveur MCP non visible dans Cursor | `.cursor/mcp.json` absent ou mal placé | Vérifier que le fichier est à la racine du workspace ouvert |
| Clé `servers` au lieu de `mcpServers` | Confusion avec le format VS Code | Cursor requiert `mcpServers`, pas `servers` |
| `ENOENT npx` | Node.js absent du PATH | Installer Node.js 20+ et redémarrer Cursor |
| Code de périphérique non visible | Panneau Output non ouvert | Output → MCP dans la liste déroulante |
| Token expiré (90+ jours) | Refresh token révoqué | `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Ressources

- [Site officiel Cursor](https://cursor.com)
- [Documentation MCP dans Cursor](https://cursor.com/docs/context/mcp)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
