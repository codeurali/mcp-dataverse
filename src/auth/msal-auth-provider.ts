import { ConfidentialClientApplication } from '@azure/msal-node';
import type { AuthProvider } from './auth-provider.interface.js';
import type { Config } from '../config/config.schema.js';

export class MsalAuthProvider implements AuthProvider {
  readonly environmentUrl: string;
  private readonly msalApp: ConfidentialClientApplication;
  private readonly scope: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config: Config) {
    this.environmentUrl = config.environmentUrl;

    if (!config.tenantId) {
      throw new Error('MsalAuthProvider requires config.tenantId for client_credentials flow');
    }
    if (!config.clientId) {
      throw new Error('MsalAuthProvider requires config.clientId for client_credentials flow');
    }
    if (!config.clientSecret) {
      throw new Error('MsalAuthProvider requires config.clientSecret for client_credentials flow');
    }

    this.msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    });

    // Scope for Dataverse client_credentials: <environmentUrl>/.default
    const baseUrl = config.environmentUrl.replace(/\/$/, '');
    this.scope = `${baseUrl}/.default`;
  }

  async getToken(): Promise<string> {
    // Return cached token if still valid (60-second buffer before expiry)
    if (this.cachedToken !== null && this.tokenExpiresAt !== null && new Date() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const result = await this.msalApp.acquireTokenByClientCredential({
      scopes: [this.scope],
    });

    if (result === null || !result.accessToken) {
      throw new Error('MSAL: acquireTokenByClientCredential returned no access token');
    }

    this.cachedToken = result.accessToken;
    // Subtract 60 seconds from expiry to avoid using a token that is about to expire
    this.tokenExpiresAt = result.expiresOn
      ? new Date(result.expiresOn.getTime() - 60_000)
      : new Date(Date.now() + 3_540_000); // fallback: 59 minutes

    return this.cachedToken;
  }

  invalidateToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = null;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }
}
