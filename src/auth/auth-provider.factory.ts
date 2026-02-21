import type { AuthProvider } from './auth-provider.interface.js';
import { PacAuthProvider } from './pac-auth-provider.js';
import { MsalAuthProvider } from './msal-auth-provider.js';
import type { Config } from '../config/config.schema.js';

export function createAuthProvider(config: Config): AuthProvider {
  switch (config.authMode) {
    case 'pac':
      return new PacAuthProvider(config.environmentUrl);
    case 'msal':
      return new MsalAuthProvider(config);
    default: {
      const _exhaustive: never = config.authMode;
      throw new Error(`Unknown auth mode: ${_exhaustive}`);
    }
  }
}
