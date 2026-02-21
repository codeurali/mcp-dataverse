/**
 * Authentication setup entry point.
 * Run once: npm run auth:setup
 *
 * Uses MSAL device code flow — a browser tab will open for you to authenticate.
 * The token is cached locally in .msal-cache.json and used silently on subsequent runs.
 */
import { loadConfig } from "./config/config.loader.js";
import { PacAuthProvider } from "./auth/pac-auth-provider.js";

async function main(): Promise<void> {
  process.stderr.write("MCP Dataverse — Authentication Setup\n");
  process.stderr.write("─────────────────────────────────────\n");

  const config = loadConfig();

  if (config.authMode !== "pac") {
    process.stderr.write(
      `Auth mode is "${config.authMode}" — setup only needed for "pac" mode.\n`,
    );
    process.exit(0);
  }

  process.stderr.write(`Environment: ${config.environmentUrl}\n\n`);
  process.stderr.write("Starting device code authentication...\n");

  const provider = new PacAuthProvider(config.environmentUrl);
  await provider.setupViaDeviceCode();

  process.stderr.write(
    "\n✓ Authentication successful — token cached in .msal-cache.json\n",
  );
  process.stderr.write("You can now start the server: npm start\n");
}

main().catch((error) => {
  process.stderr.write(
    `Setup failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
