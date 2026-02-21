#!/usr/bin/env node
/**
 * publish.mjs — Automated publish script for MCP Dataverse.
 *
 * Usage:
 *   node scripts/publish.mjs          # Full publish (npm + MCP Registry)
 *   node scripts/publish.mjs --npm    # npm only
 *   node scripts/publish.mjs --mcp    # MCP Registry only
 *   node scripts/publish.mjs --dry    # Dry-run (validate only, no publish)
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────
function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8" }).trim();
}

function fail(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

// ── Parse flags ──────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry");
const npmOnly = args.has("--npm");
const mcpOnly = args.has("--mcp");
const publishNpm = !mcpOnly;
const publishMcp = !npmOnly;

// ── 1. Pre-flight checks ────────────────────────────────────
console.log("🔍 Pre-flight checks…");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const serverJson = JSON.parse(
  readFileSync(resolve(ROOT, "server.json"), "utf-8"),
);

// Version alignment
if (pkg.version !== serverJson.version) {
  fail(
    `Version mismatch: package.json=${pkg.version}, server.json=${serverJson.version}`,
  );
}
const pkgEntry = serverJson.packages?.[0];
if (pkgEntry?.version && pkgEntry.version !== pkg.version) {
  fail(
    `Version mismatch: server.json packages[0].version=${pkgEntry.version}, package.json=${pkg.version}`,
  );
}
ok(`Version ${pkg.version} consistent across package.json and server.json`);

// mcpName ↔ server.json name
if (pkg.mcpName !== serverJson.name) {
  fail(
    `mcpName mismatch: package.json.mcpName=${pkg.mcpName}, server.json.name=${serverJson.name}`,
  );
}
ok(`mcpName matches: ${pkg.mcpName}`);

// Check placeholder not still present
if (pkg.mcpName.includes("your-username")) {
  fail(
    'Replace "your-username" with your actual GitHub handle in package.json and server.json',
  );
}

// Required files
for (const f of ["dist/server.js", "README.md", "LICENSE"]) {
  if (!existsSync(resolve(ROOT, f))) {
    fail(`Required file missing: ${f}. Run "npm run build" first.`);
  }
}
ok("Required files present");

// ── 2. Typecheck & tests ─────────────────────────────────────
console.log("\n🔨 Typecheck…");
run("npx tsc --noEmit");
ok("Typecheck passed");

console.log("\n🧪 Tests…");
run("npm test");
ok("All tests passed");

// ── 3. Build ─────────────────────────────────────────────────
console.log("\n📦 Build…");
run("npm run build");
ok("Build succeeded");

// ── 4. Verify shebang in dist/server.js ──────────────────────
const serverDist = readFileSync(resolve(ROOT, "dist/server.js"), "utf-8");
if (!serverDist.startsWith("#!/usr/bin/env node")) {
  fail("dist/server.js is missing the shebang line. Check src/server.ts");
}
ok("dist/server.js has shebang");

// ── 5. Dry-run stop ─────────────────────────────────────────
if (dryRun) {
  console.log("\n🏁 Dry-run complete — all checks passed, nothing published.");
  process.exit(0);
}

// ── 6. Publish to npm ────────────────────────────────────────
if (publishNpm) {
  console.log("\n🚀 Publishing to npm…");
  try {
    runCapture("npm whoami");
  } catch {
    fail('Not logged in to npm. Run "npm login" first.');
  }
  run("npm publish --access public");
  ok(`Published ${pkg.name}@${pkg.version} to npm`);
}

// ── 7. Publish to MCP Registry ───────────────────────────────
if (publishMcp) {
  console.log("\n🚀 Publishing to MCP Registry…");
  try {
    runCapture("mcp-publisher --help");
  } catch {
    fail(
      "mcp-publisher not found. Install it first:\n  See PUBLISHING.md step 4",
    );
  }
  run("mcp-publisher publish");
  ok(`Published ${serverJson.name}@${serverJson.version} to MCP Registry`);
}

// ── Done ─────────────────────────────────────────────────────
console.log(`\n🎉 Successfully published MCP Dataverse v${pkg.version}!`);
if (publishNpm)
  console.log(`   npm: https://www.npmjs.com/package/${pkg.name}`);
if (publishMcp)
  console.log(
    `   MCP: https://registry.modelcontextprotocol.io/v0.1/servers?search=${serverJson.name}`,
  );
