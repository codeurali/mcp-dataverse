#!/usr/bin/env node
/**
 * Authentication setup entry point for production installs.
 * Run once: npx mcp-dataverse-auth [environment-url]
 *
 * Uses MSAL device code flow — a browser tab will open for you to authenticate.
 * The token is cached in ~/.mcp-dataverse/msal-cache.json and reused silently.
 */
import { loadConfig } from "./config/config.loader.js";
import { DeviceCodeAuthProvider } from "./auth/device-code-auth-provider.js";
async function main() {
    process.stderr.write("MCP Dataverse — One-time Authentication Setup\n");
    process.stderr.write("──────────────────────────────────────────────\n");
    // Allow passing the env URL as a CLI arg: npx mcp-dataverse-auth https://org.crm.dynamics.com
    const cliEnvUrl = process.argv[2];
    if (cliEnvUrl) {
        process.env["DATAVERSE_ENV_URL"] = cliEnvUrl;
    }
    let config;
    try {
        config = loadConfig();
    }
    catch {
        process.stderr.write("Environment URL is required.\n" +
            "Usage: npx mcp-dataverse-auth https://yourorg.crm.dynamics.com\n" +
            "Or set DATAVERSE_ENV_URL before running.\n");
        process.exit(1);
    }
    process.stderr.write(`Environment : ${config.environmentUrl}\n`);
    process.stderr.write(`Token cache : ~/.mcp-dataverse/msal-cache.json\n\n`);
    process.stderr.write("A browser window will open. Sign in with your Microsoft account.\n\n");
    const provider = new DeviceCodeAuthProvider(config.environmentUrl);
    await provider.setupViaDeviceCode();
    process.stderr.write("\n✓ Authentication successful!\n" +
        "  Token cached in ~/.mcp-dataverse/msal-cache.json\n\n" +
        "  Restart the MCP server in VS Code to apply.\n");
}
main().catch((error) => {
    process.stderr.write(`\nSetup failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
//# sourceMappingURL=setup-auth.js.map