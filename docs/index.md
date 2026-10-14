---
layout: page
sidebar: false
title: MCP Dataverse — MCP server for Microsoft Dataverse
description: An MCP server that gives AI agents the real Dataverse schema and 100 tools to act on it. Three auth modes. Works with VS Code Copilot, Claude, Cursor, Windsurf and more.
---

<div class="hp-root">

<header class="hp-hero">
  <div class="hp-hero-copy">
    <span class="hp-mono hp-hero-eyebrow">Model Context Protocol / Microsoft Dataverse</span>
    <h1 class="hp-hero-title">Your agent should read the <em>schema</em> before it writes a query.</h1>
    <p class="hp-hero-sub">
      Most agents guess at Dataverse: invented columns, malformed OData, blind updates. MCP Dataverse gives them the real data model and 100 tools to work with it, under the identity and permissions you already manage.
    </p>
    <div class="hp-hero-actions">
      <a href="/mcp-dataverse/getting-started" class="hp-btn-primary">Get started</a>
      <a href="/mcp-dataverse/capabilities" class="hp-btn-ghost">Tool reference</a>
      <a href="https://github.com/codeurali/mcp-dataverse" class="hp-btn-ghost" target="_blank" rel="noopener">GitHub</a>
    </div>
    <div class="hp-hero-install"><CopyCommand command="npx mcp-dataverse install" /></div>
  </div>
  <div class="hp-hero-art"><SchemaOrbit /></div>
</header>

<HeroProof />
<ProofStrip />

<section class="hp-section">
  <div class="hp-section-head">
    <span class="hp-section-eyebrow">Principles</span>
    <h2 class="hp-section-title">Built for agents that have to be right.</h2>
    <p class="hp-section-sub">A Dataverse environment is a system of record. The server is designed around that fact.</p>
  </div>
  <div class="hp-list">
    <div class="hp-item"><span class="idx">01</span><h3>Schema first</h3><p>Agents can read entity definitions, relationships, option sets and keys before they act, so column names are checked rather than guessed.</p></div>
    <div class="hp-item"><span class="idx">02</span><h3>Entra ID identity, Dataverse permissions</h3><p>Sign in with Microsoft Entra ID as a user, an app registration or a managed identity. Dataverse security roles decide what is allowed; the server adds no privilege. <a href="/mcp-dataverse/security">Security and guardrails</a></p></div>
    <div class="hp-item"><span class="idx">03</span><h3>Operations that scale</h3><p>Up to 1,000 operations in one batch request, with changesets for atomic groups and per-operation results.</p></div>
    <div class="hp-item"><span class="idx">04</span><h3>One server, any client</h3><p>VS Code Copilot, Claude Desktop, Cursor, Windsurf, Gemini CLI, Copilot Studio and Codex CLI. Anything that speaks MCP.</p></div>
    <div class="hp-item"><span class="idx">05</span><h3>Installed in minutes</h3><p>One command starts an interactive wizard. Node.js 20 or later is the only prerequisite.</p></div>
  </div>
</section>

<section class="hp-section">
  <div class="hp-section-head">
    <span class="hp-section-eyebrow">In practice</span>
    <h2 class="hp-section-title">One call, one structured answer.</h2>
    <p class="hp-section-sub">Every tool returns a typed result with a summary and next-step suggestions, so the agent can chain operations without guessing.</p>
  </div>
  <InteractiveDemo />
</section>

<section class="hp-section">
  <div class="hp-section-head">
    <span class="hp-section-eyebrow">Capabilities</span>
    <h2 class="hp-section-title">What changes in a working day.</h2>
    <p class="hp-section-sub">Six workflows that used to mean portal tabs and one-off scripts.</p>
  </div>
  <CapabilityScenarios />
</section>

<CompatibilityLogos />

<div class="hp-cta">
  <div>
    <h2>Connect an agent to Dataverse in two minutes.</h2>
    <p>Pick an authentication mode, run the installer, and ask your first question about your own data.</p>
  </div>
  <div class="hp-cta-actions">
    <a href="/mcp-dataverse/getting-started" class="hp-btn-primary">Get started</a>
    <a href="/mcp-dataverse/capabilities" class="hp-btn-ghost">Browse all capabilities</a>
  </div>
</div>

</div>
