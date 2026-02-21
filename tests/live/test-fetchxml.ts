/**
 * Live test — Execute a FetchXML query on the 'account' table.
 * Usage: npx tsx tests/live/test-fetchxml.ts
 *
 * Requires: npm run auth:setup (run once beforehand)
 */
import { loadConfig } from "../../src/config/config.loader.js";
import { createAuthProvider } from "../../src/auth/auth-provider.factory.js";
import { DataverseClient } from "../../src/dataverse/dataverse-client.js";

const FETCH_XML = `<fetch top="3"><entity name="account"><attribute name="accountid"/><attribute name="name"/></entity></fetch>`;

async function main(): Promise<void> {
  process.stderr.write("--- Live FetchXML Test (account) ---\n");

  const config = loadConfig();
  process.stderr.write(`Environment: ${config.environmentUrl}\n`);
  process.stderr.write(`Auth mode:   ${config.authMode}\n\n`);

  const auth = createAuthProvider(config);
  const client = new DataverseClient(
    auth,
    config.maxRetries,
    config.requestTimeoutMs,
  );

  process.stderr.write(`FetchXML: ${FETCH_XML}\n\n`);

  const start = Date.now();
  const response = await client.executeFetchXml<{
    accountid: string;
    name?: string;
  }>("accounts", FETCH_XML);
  const elapsed = Date.now() - start;

  if (!Array.isArray(response.value)) {
    process.stderr.write("✗ Expected response.value to be an array\n");
    process.exit(1);
  }

  process.stderr.write(`✓ executeFetchXml succeeded in ${elapsed}ms\n`);
  process.stderr.write(`  Records returned: ${response.value.length}\n`);

  if (response.value.length === 0) {
    process.stderr.write(
      "  (no account records in this environment — that is OK)\n",
    );
  } else {
    process.stderr.write("  Results:\n");
    response.value.forEach((record, i) => {
      process.stderr.write(
        `  ${i + 1}. accountid=${record.accountid}  name=${record.name ?? "(none)"}\n`,
      );
    });
  }

  process.stdout.write(JSON.stringify(response.value, null, 2) + "\n");
}

main().catch((error) => {
  process.stderr.write(
    `\n✗ Test failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
