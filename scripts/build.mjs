#!/usr/bin/env node
/**
 * build.mjs — esbuild production build.
 *
 * Bundles all entrypoints into minified ESM files.
 * No source maps, no .d.ts declarations — internal structure not exposed.
 */
import * as esbuild from "esbuild";
import { rmSync, readFileSync, readdirSync } from "node:fs";
import { builtinModules } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

try {
  rmSync(resolve(ROOT, "dist"), { recursive: true });
} catch {
  // dist/ didn't exist yet
}

await esbuild.build({
  // Top-level entrypoints (shebang added via banner)
  // install.ts and http-server.ts are dynamically imported by server.ts —
  // listing them here gives them a stable name in dist/ and ensures correct
  // chunk resolution at runtime.
  entryPoints: [
    "src/server.ts",
    "src/setup-auth.ts",
    "src/doctor.ts",
    "src/install.ts",
    "src/http-server.ts",
  ],
  outdir: "dist",
  bundle: true,       // inline all static imports from our own code
  minify: true,       // strip whitespace, mangle identifiers
  splitting: false,   // no code-split chunks — keeps dist/ stable for git/publish
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external", // leave node_modules as peer imports (not inlined)
  absWorkingDir: ROOT,
});

// Guard (issue #5): every bare package imported by dist/ must be a declared
// runtime dependency, otherwise `npx mcp-dataverse` crashes with
// ERR_MODULE_NOT_FOUND on a clean install.
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const declared = new Set(Object.keys(pkg.dependencies ?? {}));
const missing = new Set();
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith(".js")) {
      const code = readFileSync(full, "utf8");
      for (const m of code.matchAll(/(?:\bfrom|\bimport\()\s*["']((?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*(?:\/[^"']*)?)["']/g)) {
        const spec = m[1];
        if (spec.startsWith("node:")) continue;
        const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (!builtinModules.includes(name) && !declared.has(name)) missing.add(name);
      }
    }
  }
};
walk(resolve(ROOT, "dist"));
if (missing.size) {
  console.error(`❌ dist/ imports undeclared dependencies: ${[...missing].join(", ")}`);
  process.exit(1);
}

console.log("✅ Build complete — dist/ ready");
