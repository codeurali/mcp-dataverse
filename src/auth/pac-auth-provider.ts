import {
  PublicClientApplication,
  type AuthenticationResult,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import type { AuthProvider } from "./auth-provider.interface.js";

// Microsoft Power Platform CLI App ID — public client, no app registration needed
const PLATFORM_CLIENT_ID = "1950a258-227b-4e31-a9cf-717495945fc2";

/**
 * Stable user-level cache directory. Independent of process cwd so the server
 * always finds the token regardless of where VS Code or npx launches it from.
 */
const CACHE_DIR = join(homedir(), ".mcp-dataverse");
const TOKEN_CACHE_FILE = join(CACHE_DIR, "msal-cache.json");

/**
 * Derives a machine+user-scoped encryption key.
 * Not a substitute for OS-level credential storage (DPAPI/keytar), but prevents
 * the cache file from being directly readable as plaintext by other processes.
 */
function getDerivedKey(): Buffer {
  const seed = [
    process.env["COMPUTERNAME"] ?? process.env["HOSTNAME"] ?? "",
    process.env["USERNAME"] ?? process.env["USER"] ?? "",
    "mcp-dataverse-cache-v1",
  ].join(".");
  return createHash("sha256").update(seed).digest();
}

function encryptForDisk(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    v: 1,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    d: encrypted.toString("hex"),
  });
}

function decryptFromDisk(raw: string): string {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed["v"] !== 1) throw new Error("Unknown cache format version");
  const iv = Buffer.from(parsed["iv"] as string, "hex");
  const tag = Buffer.from(parsed["tag"] as string, "hex");
  const encrypted = Buffer.from(parsed["d"] as string, "hex");
  const decipher = createDecipheriv("aes-256-gcm", getDerivedKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString("utf-8") + decipher.final("utf-8");
}

function createCachePlugin(): ICachePlugin {
  return {
    beforeCacheAccess: async (cacheContext: TokenCacheContext) => {
      if (existsSync(TOKEN_CACHE_FILE)) {
        try {
          const raw = readFileSync(TOKEN_CACHE_FILE, "utf-8");
          // Support both encrypted (v1) and legacy plaintext caches
          let serialized: string;
          try {
            serialized = decryptFromDisk(raw);
          } catch {
            // Legacy plaintext — accept for migration, will be re-written encrypted
            serialized = raw;
          }
          cacheContext.tokenCache.deserialize(serialized);
        } catch {
          // Corrupt cache — ignore, user will need to re-authenticate
        }
      }
    },
    afterCacheAccess: async (cacheContext: TokenCacheContext) => {
      if (cacheContext.cacheHasChanged) {
        mkdirSync(CACHE_DIR, { recursive: true });
        writeFileSync(
          TOKEN_CACHE_FILE,
          encryptForDisk(cacheContext.tokenCache.serialize()),
          { encoding: "utf-8", mode: 0o600 },
        );
      }
    },
  };
}

export class PacAuthProvider implements AuthProvider {
  readonly environmentUrl: string;
  private readonly pca: PublicClientApplication;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(environmentUrl: string) {
    this.environmentUrl = environmentUrl.replace(/\/$/, "");

    this.pca = new PublicClientApplication({
      auth: {
        clientId: PLATFORM_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
      },
      cache: { cachePlugin: createCachePlugin() },
    });
  }

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken !== null && this.tokenExpiresAt > now + 60_000) {
      return this.cachedToken;
    }
    return this.refreshToken();
  }

  invalidateToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Interactive device code flow — call once via `npm run auth:setup`.
   * Writes to stderr so it doesn't disturb the stdio MCP transport.
   */
  async setupViaDeviceCode(): Promise<void> {
    const result = await this.pca.acquireTokenByDeviceCode({
      scopes: [`${this.environmentUrl}/.default`],
      deviceCodeCallback: (response) => {
        process.stderr.write(`\n${response.message}\n`);
      },
    });
    if (result) {
      this.cacheResult(result);
    }
  }

  private async refreshToken(): Promise<string> {
    const accounts = await this.pca.getAllAccounts();

    if (accounts.length === 0) {
      throw new Error(
        "No authenticated account found.\n" +
          "Run once to set up authentication:\n" +
          "  npx mcp-dataverse-auth\n" +
          "Then restart the MCP server in VS Code.",
      );
    }

    try {
      const result = await this.pca.acquireTokenSilent({
        scopes: [`${this.environmentUrl}/.default`],
        account: accounts[0]!,
      });

      if (!result?.accessToken) {
        throw new Error("Silent token acquisition returned empty token");
      }

      this.cacheResult(result);
      return result.accessToken;
    } catch {
      this.cachedToken = null;
      throw new Error(
        "Token refresh failed. Re-authenticate:\n" +
          "  npx mcp-dataverse-auth\n" +
          "Then restart the MCP server in VS Code.",
      );
    }
  }

  private cacheResult(result: AuthenticationResult): void {
    this.cachedToken = result.accessToken;
    this.tokenExpiresAt =
      result.expiresOn?.getTime() ?? Date.now() + 55 * 60 * 1000;
  }
}
