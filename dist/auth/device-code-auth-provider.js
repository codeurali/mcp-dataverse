import { PublicClientApplication, } from "@azure/msal-node";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { platform } from "process";
import { createCipheriv, createDecipheriv, createHash, randomBytes, } from "crypto";
function copyToClipboard(text) {
    const cmd = platform === "win32" ? `echo|set /p="${text}"| clip`
        : platform === "darwin" ? `printf '%s' '${text}' | pbcopy`
            : `printf '%s' '${text}' | xclip -selection clipboard 2>/dev/null || printf '%s' '${text}' | xsel --clipboard 2>/dev/null`;
    exec(cmd, () => { });
}
const PLATFORM_CLIENT_ID = "1950a258-227b-4e31-a9cf-717495945fc2";
const CACHE_DIR = join(homedir(), ".mcp-dataverse");
const TOKEN_CACHE_FILE = join(CACHE_DIR, "msal-cache.json");
const DEVICE_CODE_TIMEOUT_MS = 5 * 60 * 1000;
function getDerivedKey() {
    const seed = [
        process.env["COMPUTERNAME"] ?? process.env["HOSTNAME"] ?? "",
        process.env["USERNAME"] ?? process.env["USER"] ?? "",
        "mcp-dataverse-cache-v1",
    ].join(".");
    return createHash("sha256").update(seed).digest();
}
function encryptForDisk(plaintext) {
    const key = getDerivedKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
    return JSON.stringify({ v: 1, iv: iv.toString("hex"), tag: cipher.getAuthTag().toString("hex"), d: encrypted.toString("hex") });
}
function decryptFromDisk(raw) {
    const parsed = JSON.parse(raw);
    if (parsed["v"] !== 1)
        throw new Error("Unknown cache format version");
    const iv = Buffer.from(parsed["iv"], "hex");
    const tag = Buffer.from(parsed["tag"], "hex");
    const encrypted = Buffer.from(parsed["d"], "hex");
    const decipher = createDecipheriv("aes-256-gcm", getDerivedKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted).toString("utf-8") + decipher.final("utf-8");
}
function createCachePlugin() {
    return {
        beforeCacheAccess: async (cacheContext) => {
            if (existsSync(TOKEN_CACHE_FILE)) {
                try {
                    const raw = readFileSync(TOKEN_CACHE_FILE, "utf-8");
                    let serialized;
                    try {
                        serialized = decryptFromDisk(raw);
                    }
                    catch {
                        serialized = raw;
                    }
                    cacheContext.tokenCache.deserialize(serialized);
                }
                catch { /* corrupt cache — re-auth automatically */ }
            }
        },
        afterCacheAccess: async (cacheContext) => {
            if (cacheContext.cacheHasChanged) {
                mkdirSync(CACHE_DIR, { recursive: true });
                writeFileSync(TOKEN_CACHE_FILE, encryptForDisk(cacheContext.tokenCache.serialize()), { encoding: "utf-8", mode: 0o600 });
            }
        },
    };
}
export class DeviceCodeAuthProvider {
    environmentUrl;
    pca;
    cachedToken = null;
    tokenExpiresAt = 0;
    pendingAuth = null;
    constructor(environmentUrl) {
        this.environmentUrl = environmentUrl.replace(/\/$/, "");
        this.pca = new PublicClientApplication({
            auth: { clientId: PLATFORM_CLIENT_ID, authority: "https://login.microsoftonline.com/common" },
            cache: { cachePlugin: createCachePlugin() },
        });
    }
    async getToken() {
        const now = Date.now();
        if (this.cachedToken !== null && this.tokenExpiresAt > now + 60_000)
            return this.cachedToken;
        if (this.pendingAuth !== null)
            return this.pendingAuth;
        this.pendingAuth = this.refreshToken().finally(() => { this.pendingAuth = null; });
        return this.pendingAuth;
    }
    invalidateToken() { this.cachedToken = null; this.tokenExpiresAt = 0; }
    async isAuthenticated() {
        try {
            await this.getToken();
            return true;
        }
        catch {
            return false;
        }
    }
    async setupViaDeviceCode() { await this.runDeviceCodeFlow(); }
    async refreshToken() {
        const accounts = await this.pca.getAllAccounts();
        if (accounts.length === 0) {
            process.stderr.write("\n[mcp-dataverse] First-time authentication required.\n" + `Environment: ${this.environmentUrl}\n` + "Open the URL below in your browser to sign in.\n\n");
            try {
                await this.runDeviceCodeFlow();
                return await this.acquireSilently();
            }
            catch (err) {
                const detail = err instanceof Error ? err.message : String(err);
                throw new Error(`Authentication setup failed: ${detail}\n\nYou can also authenticate manually:\n  npx mcp-dataverse-auth ${this.environmentUrl}\nThen restart the MCP server in VS Code.`);
            }
        }
        try {
            return await this.acquireSilently();
        }
        catch {
            process.stderr.write("\n[mcp-dataverse] Session expired — re-authenticating.\nOpen the URL below in your browser to sign in again.\n\n");
            try {
                await this.runDeviceCodeFlow();
                return await this.acquireSilently();
            }
            catch (err) {
                this.cachedToken = null;
                const detail = err instanceof Error ? err.message : String(err);
                throw new Error(`Re-authentication failed: ${detail}\n\nTo authenticate manually:\n  npx mcp-dataverse-auth ${this.environmentUrl}\nThen restart the MCP server in VS Code.`);
            }
        }
    }
    async acquireSilently() {
        const accounts = await this.pca.getAllAccounts();
        if (accounts.length === 0)
            throw new Error("No account found in cache after authentication.");
        const result = await this.pca.acquireTokenSilent({ scopes: [`${this.environmentUrl}/.default`], account: accounts[0] });
        if (!result?.accessToken)
            throw new Error("Token acquisition returned an empty access token.");
        this.cacheResult(result);
        return result.accessToken;
    }
    async runDeviceCodeFlow() {
        const result = await Promise.race([
            this.pca.acquireTokenByDeviceCode({
                scopes: [`${this.environmentUrl}/.default`],
                deviceCodeCallback: (response) => {
                    copyToClipboard(response.userCode);
                    process.stderr.write(`\n[mcp-dataverse] Sign in required\n` +
                        `\n  1. Open ${response.verificationUri} in your browser\n` +
                        `     (use the browser profile linked to your Power Platform account)\n` +
                        `  2. Paste the code: ${response.userCode}  (already copied to your clipboard)\n` +
                        `  3. Sign in with your work account\n\n`);
                },
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Authentication timed out after 5 minutes. Please try again.")), DEVICE_CODE_TIMEOUT_MS)),
        ]);
        if (result) {
            this.cacheResult(result);
            process.stderr.write("\n[mcp-dataverse] Authenticated ✓  Token cached — no sign-in needed next time.\n\n");
        }
    }
    cacheResult(result) {
        this.cachedToken = result.accessToken;
        this.tokenExpiresAt = result.expiresOn?.getTime() ?? Date.now() + 55 * 60 * 1000;
    }
}
//# sourceMappingURL=device-code-auth-provider.js.map