/**
 * Live test — List all Dataverse tables (EntityDefinitions).
 * Usage: npx tsx tests/live/test-list-tables.ts
 *
 * Requires: npm run auth:setup (run once beforehand)
 */
import { loadConfig } from '../../src/config/config.loader.js';
import { createAuthProvider } from '../../src/auth/auth-provider.factory.js';
import { DataverseClient } from '../../src/dataverse/dataverse-client.js';

async function main(): Promise<void> {
  process.stderr.write('--- Live List Tables Test ---\n');

  const config = loadConfig();
  process.stderr.write(`Environment: ${config.environmentUrl}\n`);
  process.stderr.write(`Auth mode:   ${config.authMode}\n\n`);

  const auth = createAuthProvider(config);
  const client = new DataverseClient(auth, config.maxRetries, config.requestTimeoutMs);

  const start = Date.now();
  const tables = await client.listTables();
  const elapsed = Date.now() - start;

  if (tables.length < 1) {
    process.stderr.write('✗ Expected at least 1 table, got 0\n');
    process.exit(1);
  }

  process.stderr.write(`✓ listTables succeeded in ${elapsed}ms\n`);
  process.stderr.write(`  Total tables: ${tables.length}\n\n`);
  process.stderr.write('  First 5 tables:\n');

  tables.slice(0, 5).forEach((t, i) => {
    const displayName = t.DisplayName?.UserLocalizedLabel?.Label ?? '(no display name)';
    process.stderr.write(`  ${i + 1}. ${t.LogicalName} — ${displayName}\n`);
  });

  process.stdout.write(JSON.stringify(tables.slice(0, 5), null, 2) + '\n');
}

main().catch((error) => {
  process.stderr.write(`\n✗ Test failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
