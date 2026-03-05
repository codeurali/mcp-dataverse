#!/usr/bin/env node
/**
 * build.mjs — esbuild production build.
 *
 * Bundles all entrypoints into minified ESM files.
 * No source maps, no .d.ts declarations — internal structure not exposed.
 */
import * as esbuild from "esbuild";
import { rmSync } from "node:fs";
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
  splitting: true,    // code-split dynamic import() correctly (ESM only)
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external", // leave node_modules as peer imports (not inlined)
  absWorkingDir: ROOT,
});

console.log("✅ Build complete — dist/ ready");
