# Guide : mcp-dataverse sur Claude Desktop

Ce guide couvre l'installation de Claude Desktop depuis zéro jusqu'à un premier appel MCP Dataverse fonctionnel.

---

## Prérequis

| Élément | Version minimale | Remarque |
|---------|-----------------|----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) — npx doit être disponible dans le PATH |
| Compte Anthropic | Plan payant (Pro, Max, Team ou Enterprise) | Le plan gratuit ne suffit pas |
| URL Dataverse | `https://yourorg.crm.dynamics.com` | Votre organisation Power Platform |

---

## 1. Installer Claude Desktop

### Windows

1. Télécharger l'installateur depuis **[claude.ai/download](https://claude.ai/download)**
2. Lancer `ClaudeSetup.exe` et suivre l'assistant (installation silencieuse possible avec `/S`)
3. Démarrer Claude Desktop et se connecter avec son compte Anthropic

> Une version arm64 est aussi disponible sur la même page pour les machines Windows ARM.

### macOS

1. Télécharger le fichier `.dmg` depuis **[claude.ai/download](https://claude.ai/download)**
2. Glisser l'icône **Claude** dans le dossier Applications
3. Lancer Claude depuis le Launchpad ou Spotlight et se connecter

---

## 2. Localiser le fichier de configuration

Claude Desktop lit sa configuration MCP dans un fichier JSON dont l'emplacement dépend de l'OS :

| OS | Chemin |
|----|--------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

Si le fichier n'existe pas encore, le créer (le répertoire parent existe après la première installation).

---

## 3. Configurer mcp-dataverse

Ouvrir `claude_desktop_config.json` dans un éditeur de texte et ajouter (ou fusionner) la clé `mcpServers` :

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

Remplacer `https://yourorg.crm.dynamics.com` par l'URL réelle de votre organisation Dataverse.

> **Utilisateurs Power Platform CLI (`pac`)** — Si vous êtes déjà authentifié via `pac auth select`, vous pouvez déléguer l'authentification à pac au lieu du Device Code Flow en ajoutant `"AUTH_MODE": "pac"` dans `env` :
>
> ```json
> "env": {
>   "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com",
>   "AUTH_MODE": "pac"
> }
> ```

### Utiliser un fichier de config à la place d'une variable d'environnement

Si vous préférez stocker l'URL dans `~/.mcp-dataverse/config.json` (créé par `npx mcp-dataverse install`), utiliser `MCP_CONFIG_PATH` :

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

### Installation globale (optionnelle)

Si `mcp-dataverse` est installé globalement (`npm install -g mcp-dataverse`), remplacer `npx` par l'exécutable direct :

```json
{
  "command": "mcp-dataverse",
  "env": {
    "DATAVERSE_ENV_URL": "https://yourorg.crm.dynamics.com"
  }
}
```

---

## 4. Redémarrer Claude Desktop

> **Important** — Claude Desktop doit être **entièrement fermé puis relancé** après chaque modification du fichier de configuration. Un simple rechargement d'onglet ne suffit pas.

Sur Windows : clic-droit sur l'icône dans la barre système → **Quitter**, puis relancer.  
Sur macOS : `Cmd+Q`, puis relancer depuis le Launchpad.

---

## 5. Authentification Dataverse

Au premier appel d'un outil MCP, le serveur lance un flux d'authentification par code de périphérique (Device Code Flow) :

1. Dans Claude Desktop, cliquer sur l'**icône MCP** (marteau 🔨) dans le coin inférieur droit de la zone de saisie
2. Ouvrir les **journaux du serveur** pour voir l'URL et le code de connexion
3. Ouvrir l'URL dans un navigateur, entrer le code, puis se connecter avec le compte Microsoft 365 qui a accès à Dataverse
4. Une fois authentifié, le serveur stocke le token localement — pas besoin de répéter cette étape

> Le code de périphérique expire après 5 minutes. Si la fenêtre de connexion n'est pas ouverte à temps, relancer l'outil depuis Claude Desktop pour générer un nouveau code.

---

## 6. Vérifier l'installation

Dans la zone de saisie de Claude Desktop, envoyer ce message :

> **"Who am I in Dataverse?"**

Claude appellera `dataverse_whoami` et retournera le nom et l'ID de l'utilisateur authentifié. Une réponse valide confirme que l'intégration fonctionne.

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|----------|---------------|---------|
| Le serveur n'apparaît pas dans Claude | Config non sauvegardée ou Claude non redémarré | Vérifier le JSON, relancer complètement Claude |
| Le code de périphérique n'apparaît pas | Journaux MCP non visibles | Cliquer sur l'icône MCP → Server logs |
| `ENOENT npx` | Node.js absent du PATH | Installer Node.js 20+ et relancer Claude |
| Erreur d'URL invalide | Format incorrect | L'URL doit commencer par `https://` et se terminer par `.dynamics.com` |
| Token expiré après 90+ jours inactifs | Refresh token révoqué | Relancer : `npx mcp-dataverse-auth https://yourorg.crm.dynamics.com` |

---

## Ressources

- [Connexion d'un serveur MCP local à Claude Desktop](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
- [Référence complète multi-client](https://codeurali.github.io/mcp-dataverse/multi-client-setup)
- [Démarrage et authentification](https://codeurali.github.io/mcp-dataverse/getting-started)
- [Diagnostic CLI](https://codeurali.github.io/mcp-dataverse/getting-started#diagnostic-cli) : `npx mcp-dataverse doctor`
