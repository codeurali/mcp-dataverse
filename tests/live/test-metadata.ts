/**
 * Live test — Get metadata for the 'account' table.
 * Usage: npx tsx tests/live/test-metadata.ts
 *
 * Requires: npm run auth:setup (run once beforehand)
 */
import { loadConfig } from '../../src/config/config.loader.js';
import { createAuthProvider } from '../../src/auth/auth-provider.factory.js';
import { DataverseClient } from '../../src/dataverse/dataverse-client.js';

async function main(): Promise<void> {
  process.stderr.write('--- Live Metadata Test (account) ---\n');

  const config = loadConfig();
  process.stderr.write(`Environment: ${config.environmentUrl}\n`);
  process.stderr.write(`Auth mode:   ${config.authMode}\n\n`);

  const auth = createAuthProvider(config);
  const client = new DataverseClient(auth, config.maxRetries, config.requestTimeoutMs);

  const start = Date.now();
  const metadata = await client.getTableMetadata('account');
  const elapsed = Date.now() - start;

  if (metadata.LogicalName !== 'account') {
    process.stderr.write(`✗ Expected LogicalName "account", got "${metadata.LogicalName}"\n`);
    process.exit(1);
  }

  const attributeCount = metadata.Attributes?.length ?? 0;

  process.stderr.write(`✓ getTableMetadata succeeded in ${elapsed}ms\n`);
  process.stderr.write(`  LogicalName:       ${metadata.LogicalName}\n`);
  process.stderr.write(`  SchemaName:        ${metadata.SchemaName}\n`);
  process.stderr.write(`  EntitySetName:     ${metadata.EntitySetName}\n`);
  process.stderr.write(`  DisplayName:       ${metadata.DisplayName?.UserLocalizedLabel?.Label ?? '(none)'}\n`);
  process.stderr.write(`  PrimaryIdAttr:     ${metadata.PrimaryIdAttribute}\n`);
  process.stderr.write(`  PrimaryNameAttr:   ${metadata.PrimaryNameAttribute}\n`);
  process.stderr.write(`  IsCustomEntity:    ${metadata.IsCustomEntity}\n`);
  process.stderr.write(`  Attributes count:  ${attributeCount}\n`);

  // Output a summary (omit full Attributes array to keep stdout clean)
  const summary = { ...metadata, Attributes: `[${attributeCount} attributes]` };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main().catch((error) => {
  process.stderr.write(`\n✗ Test failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
