#!/usr/bin/env node
/**
 * Diagnostic CLI command for mcp-dataverse.
 * Usage: npx mcp-dataverse doctor
 */
export async function runDoctor() {
    const out = (msg) => process.stdout.write(msg + "\n");
    const ok = (msg) => out(`  ✅ ${msg}`);
    const fail = (msg) => out(`  ❌ ${msg}`);
    out("");
    out("🏥 mcp-dataverse doctor");
    out("─".repeat(50));
    out("");
    let allPassed = true;
    // 1. Node.js version check
    out("📋 Environment");
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
    if (major >= 20) {
        ok(`Node.js ${nodeVersion}`);
    }
    else {
        fail(`Node.js ${nodeVersion} — requires v20+`);
        allPassed = false;
    }
    out("");
    // 2. Configuration check
    out("⚙️  Configuration");
    try {
        const { loadConfig } = await import("./config/config.loader.js");
        const config = loadConfig();
        ok(`Environment URL: ${config.environmentUrl}`);
        ok(`Timeout: ${config.requestTimeoutMs}ms, Retries: ${config.maxRetries}`);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fail(`Configuration error: ${msg}`);
        allPassed = false;
        // Can't proceed without config
        out("");
        out(allPassed ? "✅ All checks passed!" : "❌ Some checks failed.");
        process.exit(allPassed ? 0 : 1);
    }
    out("");
    // 3. Authentication check
    out("🔑 Authentication");
    try {
        const { loadConfig } = await import("./config/config.loader.js");
        const config = loadConfig();
        const { createAuthProvider } = await import("./auth/auth-provider.factory.js");
        const authProvider = createAuthProvider(config);
        const token = await authProvider.getToken();
        if (token) {
            ok("Token acquired successfully");
            const parts = token.split(".");
            if (parts.length === 3) {
                ok("Valid JWT token format");
            }
        }
        else {
            fail("No token returned");
            allPassed = false;
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fail(`Auth failed: ${msg}`);
        allPassed = false;
    }
    out("");
    // 4. API Connectivity (WhoAmI)
    out("🌐 Dataverse API");
    try {
        const { loadConfig } = await import("./config/config.loader.js");
        const config = loadConfig();
        const { createAuthProvider } = await import("./auth/auth-provider.factory.js");
        const { DataverseAdvancedClient } = await import("./dataverse/dataverse-client-advanced.js");
        const authProvider = createAuthProvider(config);
        const client = new DataverseAdvancedClient(authProvider, config.maxRetries, config.requestTimeoutMs);
        const result = await client.whoAmI();
        ok(`Organization: ${result.OrganizationName || "N/A"}`);
        ok(`User ID: ${result.UserId || "N/A"}`);
        ok(`Business Unit: ${result.BusinessUnitId || "N/A"}`);
        ok(`Environment: ${result.EnvironmentUrl || config.environmentUrl}`);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fail(`API call failed: ${msg}`);
        allPassed = false;
    }
    out("");
    // Summary
    out("─".repeat(50));
    if (allPassed) {
        out("✅ All checks passed! Your mcp-dataverse setup is healthy.");
    }
    else {
        out("❌ Some checks failed. Review the errors above.");
    }
    out("");
    process.exit(allPassed ? 0 : 1);
}
//# sourceMappingURL=doctor.js.map