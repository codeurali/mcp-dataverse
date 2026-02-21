// Vérifie que aucun fichier .ts dans src/ ne dépasse 400 lignes
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir) {
  const files = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (f.endsWith(".ts")) files.push(full);
  }
  return files;
}

const MAX_LINES = 400;
const violations = [];
for (const file of walk("src")) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > MAX_LINES) violations.push({ file, lines });
}

if (violations.length > 0) {
  console.error("\n❌ Files exceeding 400-line limit:");
  violations.forEach((v) => console.error(`  ${v.file}: ${v.lines} lines`));
  process.exit(1);
}
console.log("✓ All files within 400-line limit");
