/**
 * Live test — WhoAmI against real Dataverse environment.
 * Usage: npx tsx tests/live/test-whoami.ts
 *
 * Requires: npm run auth:setup (run once beforehand)
 */
import { loadConfig } from '../../src/config/config.loader.js';
import { createAuthProvider } from '../../src/auth/auth-provider.factory.js';
import { DataverseClient } from '../../src/dataverse/dataverse-client.js';

async function main(): Promise<void> {
  process.stderr.write('--- Live WhoAmI Test ---\n');

  const config = loadConfig();
  process.stderr.write(`Environment: ${config.environmentUrl}\n`);
  process.stderr.write(`Auth mode:   ${config.authMode}\n\n`);

  const auth = createAuthProvider(config);
  const client = new DataverseClient(auth, config.maxRetries, config.requestTimeoutMs);

  const start = Date.now();
  const result = await client.whoAmI();
  const elapsed = Date.now() - start;

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.stderr.write(`\n✓ WhoAmI succeeded in ${elapsed}ms\n`);
  process.stderr.write(`  UserId:         ${result.UserId}\n`);
  process.stderr.write(`  BusinessUnitId: ${result.BusinessUnitId}\n`);
  process.stderr.write(`  OrganizationId: ${result.OrganizationId}\n`);
}

main().catch((error) => {
  process.stderr.write(`\n✗ Test failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
