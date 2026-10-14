<script setup lang="ts">
import { data } from '../stats.data'

</script>

<template>
  <ul class="proof-strip">
    <li><a href="https://github.com/codeurali/mcp-dataverse" target="_blank" rel="noopener"><b>{{ data.stars }}</b> GitHub stars</a></li>
    <li><a href="https://github.com/codeurali/mcp-dataverse/blob/master/CHANGELOG.md" target="_blank" rel="noopener">v<b>{{ data.version }}</b> · MIT</a></li>
    <li><a href="https://registry.modelcontextprotocol.io/?q=dataverse" target="_blank" rel="noopener">On the official MCP Registry</a></li>
  </ul>
</template>

<style>
.proof-strip {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  margin: 0;
  padding: 1.1rem 0 0;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}
.proof-strip a { color: inherit !important; text-decoration: none !important; transition: color 0.2s; }
.proof-strip a:hover { color: var(--vp-c-brand-1) !important; }
.proof-strip b { font-weight: 500; color: var(--vp-c-text-1); }
</style>
