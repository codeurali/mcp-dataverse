#!/usr/bin/env node
/**
 * Interactive installer for mcp-dataverse.
 * Invoked via:  npx mcp-dataverse install
 *
 * Steps:
 *   1. Prompt for Dataverse environment URL
 *   2. Save config to ~/.mcp-dataverse/config.json
 *   3. Register the server in VS Code via `code --add-mcp` CLI
 *   4. Authenticate via Microsoft device code flow
 */
import { createInterface } from "readline/promises";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { DeviceCodeAuthProvider } from "./auth/device-code-auth-provider.js";
// ── Constants ─────────────────────────────────────────────────────────────────
const CACHE_DIR = join(homedir(), ".mcp-dataverse");
const CONFIG_FILE = join(CACHE_DIR, "config.json");
// ── Output helpers ─────────────────────────────────────────────────────────────
const out = (msg) => process.stdout.write(msg + "\n");
const hr = () => process.stdout.write("─".repeat(58) + "\n");
// ── VS Code CLI registration via --add-mcp ─────────────────────────────────────
function registerViaCodeCli(configFilePath) {
    const serverDef = JSON.stringify({
        name: "mcp-dataverse",
        type: "stdio",
        command: "npx",
        args: ["-y", "mcp-dataverse"],
        env: { MCP_CONFIG_PATH: configFilePath },
    });
    const clis = [
        { label: "VS Code Insiders", bin: "code-insiders" },
        { label: "VS Code Stable", bin: "code" },
    ];
    const results = [];
    for (const { label, bin } of clis) {
        try {
            // On Windows, VS Code CLI is a .cmd batch file — execFileSync can't run
            // .cmd directly, so we go through cmd.exe /c.
            const args = process.platform === "win32"
                ? ["/c", bin, "--add-mcp", serverDef]
                : ["--add-mcp", serverDef];
            const exe = process.platform === "win32" ? "cmd.exe" : bin;
            execFileSync(exe, args, { stdio: "pipe", timeout: 15_000 });
            results.push({ label, ok: true });
        }
        catch {
            results.push({ label, ok: false });
        }
    }
    return results;
}
// ── Patch custom VS Code profiles ──────────────────────────────────────────────
// `--add-mcp` only writes to the default profile. If the user runs VS Code with
// a custom profile, that profile has its own mcp.json that we need to patch too.
function getVSCodeUserDirs() {
    const home = homedir();
    switch (process.platform) {
        case "win32": {
            const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
            return [
                { label: "VS Code Insiders", dir: join(appData, "Code - Insiders", "User") },
                { label: "VS Code Stable", dir: join(appData, "Code", "User") },
            ];
        }
        case "darwin":
            return [
                { label: "VS Code Insiders", dir: join(home, "Library", "Application Support", "Code - Insiders", "User") },
                { label: "VS Code Stable", dir: join(home, "Library", "Application Support", "Code", "User") },
            ];
        default:
            return [
                { label: "VS Code Insiders", dir: join(home, ".config", "Code - Insiders", "User") },
                { label: "VS Code Stable", dir: join(home, ".config", "Code", "User") },
            ];
    }
}
function patchProfileConfigs(configFilePath) {
    const serverEntry = {
        type: "stdio",
        command: "npx",
        args: ["-y", "mcp-dataverse"],
        env: { MCP_CONFIG_PATH: configFilePath },
    };
    const patched = [];
    for (const { dir } of getVSCodeUserDirs()) {
        const profilesDir = join(dir, "profiles");
        if (!existsSync(profilesDir))
            continue;
        let entries;
        try {
            entries = readdirSync(profilesDir);
        }
        catch {
            continue;
        }
        for (const profile of entries) {
            const mcpPath = join(profilesDir, profile, "mcp.json");
            if (!existsSync(mcpPath))
                continue;
            try {
                const raw = readFileSync(mcpPath, "utf-8");
                const json = JSON.parse(raw);
                if (!json.servers)
                    json.servers = {};
                json.servers["mcp-dataverse"] = serverEntry;
                writeFileSync(mcpPath, JSON.stringify(json, null, "\t") + "\n", "utf-8");
                patched.push(mcpPath);
            }
            catch {
                // skip malformed files
            }
        }
    }
    return patched;
}
// ── URL validation ─────────────────────────────────────────────────────────────
function isValidDataverseUrl(raw) {
    if (!raw.startsWith("https://"))
        return "URL must start with https://";
    try {
        const hostname = new URL(raw).hostname.toLowerCase();
        if (!hostname.endsWith(".dynamics.com"))
            return "Must be a *.dynamics.com URL (your Power Platform environment)";
    }
    catch {
        return "Invalid URL format";
    }
    return null;
}
// ── Manual mcp.json snippet ────────────────────────────────────────────────────
function printManualSnippet(configFilePath) {
    out("  Add this to your VS Code mcp.json (Ctrl+Shift+P → MCP: Open User Configuration):");
    out("");
    out('  "mcp-dataverse": {');
    out('    "type": "stdio",');
    out('    "command": "npx",');
    out('    "args": ["-y", "mcp-dataverse"],');
    out(`    "env": { "MCP_CONFIG_PATH": "${configFilePath.replace(/\\/g, "\\\\")}" }`);
    out("  }");
}
// ── Main export ────────────────────────────────────────────────────────────────
export async function runInstall() {
    out("");
    out("╔════════════════════════════════════════════════════════╗");
    out("║          MCP Dataverse — Interactive Setup             ║");
    out("╚════════════════════════════════════════════════════════╝");
    out("");
    out("This wizard will:");
    out("  1. Ask for your Dataverse environment URL");
    out("  2. Save configuration to  ~/.mcp-dataverse/config.json");
    out("  3. Register the server in VS Code via CLI");
    out("  4. Authenticate with your Microsoft account");
    out("");
    hr();
    // ── Step 1: Prompt for environment URL ──────────────────────────────────────
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    let environmentUrl = "";
    while (!environmentUrl) {
        const raw = (await rl.question("Dataverse environment URL\n  e.g. https://contoso.crm.dynamics.com\n› ")).trim().replace(/\/$/, "");
        const error = isValidDataverseUrl(raw);
        if (error) {
            out(`  ✗ ${error}\n`);
            continue;
        }
        environmentUrl = raw;
    }
    rl.close();
    out("");
    // ── Step 2: Write config ─────────────────────────────────────────────────────
    out("Saving configuration…");
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify({ environmentUrl }, null, 2) + "\n", "utf-8");
    out(`  ✓ ${CONFIG_FILE}`);
    out("");
    // ── Step 3: Register in VS Code via --add-mcp CLI ────────────────────────────
    out("Registering in VS Code…");
    const results = registerViaCodeCli(CONFIG_FILE);
    const registered = results.filter((r) => r.ok);
    if (registered.length > 0) {
        for (const { label } of registered)
            out(`  ✓ ${label}: registered via --add-mcp`);
        const skipped = results.filter((r) => !r.ok);
        for (const { label } of skipped)
            out(`  – ${label}: not found on PATH (skipped)`);
    }
    else {
        out("  ⚠ Neither 'code' nor 'code-insiders' found on PATH.");
        out("  Register manually:");
        out("");
        printManualSnippet(CONFIG_FILE);
    }
    // Also patch any custom VS Code profiles (--add-mcp only covers the default)
    const profilePatches = patchProfileConfigs(CONFIG_FILE);
    if (profilePatches.length > 0) {
        out(`  + Patched ${profilePatches.length} custom profile(s)`);
    }
    out("");
    hr();
    // ── Step 4: Authenticate ─────────────────────────────────────────────────────
    out("Authenticating with Microsoft…");
    out("(A prompt will appear below — open the URL and enter the code)");
    out("");
    try {
        const auth = new DeviceCodeAuthProvider(environmentUrl);
        await auth.setupViaDeviceCode();
        hr();
        out("");
        out("  ✓  Setup complete!");
        out("");
        if (registered.length > 0) {
            out("  The MCP server is now registered in VS Code.");
            out("  Open VS Code → Copilot chat → the 50 Dataverse tools are ready to use.");
        }
        else {
            out("  Configuration and authentication are ready.");
            out("  Register the server manually (see snippet above), then restart VS Code.");
        }
        out("");
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        hr();
        out(`  ✗ Authentication failed: ${msg}`);
        out("");
        out("  Configuration was saved. Authenticate later by restarting the MCP server —");
        out("  it will prompt for device code on startup.");
        out("");
        process.exit(1);
    }
}
//# sourceMappingURL=install.js.map