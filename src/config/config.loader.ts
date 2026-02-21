import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ConfigSchema, type Config } from './config.schema.js';

const CONFIG_FILE_NAME = 'config.json';

export function loadConfig(): Config {
  // Priority: env vars > config.json > defaults
  const configPath = join(process.cwd(), CONFIG_FILE_NAME);

  let rawConfig: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    const fileContent = readFileSync(configPath, 'utf-8');
    try {
      rawConfig = JSON.parse(fileContent) as Record<string, unknown>;
    } catch {
      throw new Error(`Invalid JSON in ${CONFIG_FILE_NAME}. Check for syntax errors (trailing commas, missing quotes).`);
    }
  }

  // Override with env vars if present
  if (process.env['DATAVERSE_ENV_URL']) {
    rawConfig['environmentUrl'] = process.env['DATAVERSE_ENV_URL'];
  }
  if (process.env['AUTH_MODE']) {
    rawConfig['authMode'] = process.env['AUTH_MODE'];
  }
  if (process.env['PAC_PROFILE_NAME']) {
    rawConfig['pacProfileName'] = process.env['PAC_PROFILE_NAME'];
  }
  if (process.env['TENANT_ID']) {
    rawConfig['tenantId'] = process.env['TENANT_ID'];
  }
  if (process.env['CLIENT_ID']) {
    rawConfig['clientId'] = process.env['CLIENT_ID'];
  }
  if (process.env['REDIRECT_URI']) {
    rawConfig['redirectUri'] = process.env['REDIRECT_URI'];
  }
  if (process.env['CLIENT_SECRET']) {
    rawConfig['clientSecret'] = process.env['CLIENT_SECRET'];
  }
  if (process.env['REQUEST_TIMEOUT_MS']) {
    rawConfig['requestTimeoutMs'] = Number(process.env['REQUEST_TIMEOUT_MS']);
  }
  if (process.env['MAX_RETRIES']) {
    rawConfig['maxRetries'] = Number(process.env['MAX_RETRIES']);
  }

  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    throw new Error(
      `Invalid configuration:\n${result.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
    );
  }

  return result.data;
}
