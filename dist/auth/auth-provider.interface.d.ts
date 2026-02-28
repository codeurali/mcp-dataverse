export interface AuthProvider {
    /**
     * Returns a valid Bearer token for the Dataverse environment.
     * Implementations must handle token refresh silently.
     */
    getToken(): Promise<string>;
    /**
     * Invalidates any cached token, forcing a fresh acquisition on the next getToken() call.
     * Must be called before retrying a request that received a 401 response.
     */
    invalidateToken(): void;
    /**
     * Returns true if the current auth session is valid.
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * The Dataverse environment URL this provider authenticates against.
     */
    readonly environmentUrl: string;
}
//# sourceMappingURL=auth-provider.interface.d.ts.map