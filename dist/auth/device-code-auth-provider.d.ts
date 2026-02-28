import type { AuthProvider } from "./auth-provider.interface.js";
export declare class DeviceCodeAuthProvider implements AuthProvider {
    readonly environmentUrl: string;
    private readonly pca;
    private cachedToken;
    private tokenExpiresAt;
    private pendingAuth;
    constructor(environmentUrl: string);
    getToken(): Promise<string>;
    invalidateToken(): void;
    isAuthenticated(): Promise<boolean>;
    setupViaDeviceCode(): Promise<void>;
    private refreshToken;
    private acquireSilently;
    private runDeviceCodeFlow;
    private cacheResult;
}
//# sourceMappingURL=device-code-auth-provider.d.ts.map