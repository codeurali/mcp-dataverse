#!/usr/bin/env node
import{existsSync as r,readFileSync as n}from"fs";import{join as t}from"path";import{homedir as l}from"os";import{fileURLToPath as i}from"url";var w=t(l(),".mcp-dataverse"),c=t(w,"config.json");function p(){return"\u2500".repeat(58)}async function x(){let u=t(i(import.meta.url),"..","..","package.json"),a=JSON.parse(n(u,"utf-8")).version;process.stdout.write(`
`),process.stdout.write(`\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
`),process.stdout.write(`\u2551          MCP Dataverse \u2014 Update                         \u2551
`),process.stdout.write(`\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
`),process.stdout.write(`
`),process.stdout.write(`  Current version : v${a}
`),process.stdout.write(`  Installed via   : npx (auto-fetches latest on each run)
`),process.stdout.write(`
`),r(c)?(process.stdout.write(`  Configuration   : \u2705 Found
`),process.stdout.write(`  Config path     : ${c}
`)):(process.stdout.write(`  Configuration   : \u274C Not found
`),process.stdout.write(`  \u2192 Run 'npx mcp-dataverse install' to set up.
`),process.stdout.write(`
`),process.exit(0)),process.stdout.write(`
${p()}

`);let o=t(i(import.meta.url),"..","..","CHANGELOG.md");if(r(o)){let s=n(o,"utf-8").match(/## \[([\d.]+)\].*?\n\n([\s\S]*?)(?=\n## \[|$)/);if(s){process.stdout.write(`What's new in v${s[1]}:

`);let d=s[2].split(`
`).filter(e=>e.startsWith("- **"));for(let e of d)process.stdout.write(`  ${e}
`)}}process.stdout.write(`
${p()}

`),process.stdout.write(`  \u2139 npx always uses the latest published version.
`),process.stdout.write(`    No explicit upgrade needed \u2014 just restart your MCP client.
`),process.stdout.write(`
`),process.stdout.write(`  For full details: https://codeurali.github.io/mcp-dataverse
`),process.stdout.write(`
`)}export{x as runUpdate};
