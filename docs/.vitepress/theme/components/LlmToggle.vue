<script setup lang="ts">
import { withBase } from 'vitepress'

const llmsUrl = withBase('/llms.txt')
</script>

<template>
  <a
    class="llm-btn"
    :href="llmsUrl"
    target="_blank"
    rel="noopener"
    title="llms.txt — full MCP Dataverse documentation for AI agents"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
    <span>llms.txt</span>
  </a>
</template>

<style scoped>
.llm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: border-color 0.18s, color 0.18s, background 0.18s, box-shadow 0.18s;
}

.llm-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

@media (max-width: 768px) {
  .llm-btn span { display: none; }
  .llm-btn { margin-left: 6px; padding: 4px 8px; }
}
</style>
