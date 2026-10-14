<template>
  <figure class="seq arch-fig">
    <svg viewBox="0 0 800 330" role="img" aria-label="Several MCP clients connect over HTTP to one mcp-dataverse server, which calls the Dataverse Web API">
      <defs>
        <marker id="af-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1 10 5 0 9z" fill="currentColor" />
        </marker>
      </defs>
      <g class="afbox">
        <rect x="40" y="10" width="200" height="56" rx="3" />
        <rect x="300" y="10" width="200" height="56" rx="3" />
        <rect x="560" y="10" width="200" height="56" rx="3" />
        <rect x="270" y="150" width="260" height="70" rx="3" class="main" />
        <rect x="270" y="270" width="260" height="50" rx="3" />
      </g>
      <g text-anchor="middle">
        <text x="140" y="34" class="t">VS Code</text><text x="140" y="53" class="s">Copilot</text>
        <text x="400" y="34" class="t">Claude Desktop</text><text x="400" y="53" class="s">stdio or HTTP</text>
        <text x="660" y="34" class="t">Custom app</text><text x="660" y="53" class="s">web UI, agent</text>
        <text x="400" y="180" class="t">mcp-dataverse</text><text x="400" y="202" class="s">HTTP server, port 3001</text>
        <text x="400" y="292" class="t">Dataverse</text><text x="400" y="310" class="s">Web API</text>
      </g>
      <g class="afline" marker-end="url(#af-arrow)">
        <path d="M140 66 V108 H370 V148" marker-end="url(#af-arrow)" />
        <path d="M400 66 V148" marker-end="url(#af-arrow)" />
        <path d="M660 66 V108 H430 V148" marker-end="url(#af-arrow)" />
        <path d="M400 220 V268" marker-end="url(#af-arrow)" />
      </g>
      <text x="410" y="132" class="s">POST /mcp</text>
      <text x="410" y="248" class="s">HTTPS, OAuth token</text>
    </svg>
  </figure>
</template>

<style>
.arch-fig .afbox rect { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: 1; }
.arch-fig .afbox rect.main { stroke: var(--vp-c-brand-1); }
.arch-fig .t { font-family: var(--font-display); font-size: 21px; fill: var(--vp-c-text-1); }
.arch-fig .s { font-family: var(--font-mono); font-size: 13.5px; fill: var(--vp-c-text-3); }
.arch-fig .afline path { fill: none; stroke: var(--vp-c-text-2); stroke-width: 1.2; color: var(--vp-c-text-2); }
</style>
