<script setup lang="ts">
import Icon from './Icon.vue'

interface Cat { icon: string; name: string; count: number }

const tools: Cat[] = [
  { icon: 'auth', name: 'Auth', count: 1 },
  { icon: 'metadata', name: 'Metadata', count: 9 },
  { icon: 'query', name: 'Query', count: 3 },
  { icon: 'crud', name: 'CRUD', count: 6 },
  { icon: 'relations', name: 'Relations', count: 4 },
  { icon: 'actions', name: 'Actions', count: 6 },
  { icon: 'batch', name: 'Batch', count: 1 },
  { icon: 'tracking', name: 'Change Tracking', count: 1 },
  { icon: 'solutions', name: 'Solutions', count: 2 },
  { icon: 'impersonation', name: 'Impersonation', count: 1 },
  { icon: 'customization', name: 'Customization', count: 4 },
  { icon: 'environment', name: 'Environment', count: 4 },
  { icon: 'trace', name: 'Trace', count: 2 },
  { icon: 'search', name: 'Search', count: 1 },
  { icon: 'audit', name: 'Audit', count: 1 },
  { icon: 'quality', name: 'Quality', count: 1 },
  { icon: 'annotations', name: 'Annotations', count: 2 },
  { icon: 'users', name: 'Users', count: 2 },
  { icon: 'rbac', name: 'RBAC', count: 7 },
  { icon: 'views', name: 'Views', count: 1 },
  { icon: 'files', name: 'Files', count: 2 },
  { icon: 'org', name: 'Org', count: 2 },
  { icon: 'workflows', name: 'Workflows', count: 4 },
  { icon: 'assistance', name: 'Assistance', count: 2 },
  { icon: 'attributes', name: 'Attributes', count: 4 },
  { icon: 'schema', name: 'Schema', count: 2 },
  { icon: 'access', name: 'Record Access', count: 4 },
  { icon: 'files', name: 'Web Resources', count: 2 },
]
const protocol: Cat[] = [
  { icon: 'schema', name: 'MCP App tools', count: 19 },
  { icon: 'resources', name: 'MCP Resources', count: 4 },
  { icon: 'prompts', name: 'MCP Prompts', count: 5 },
]
</script>

<template>
  <div class="arch">
    <div class="arch-head">MCP Dataverse server <span>100 tools · 4 resources · 5 prompts</span></div>
    <ul class="arch-grid">
      <li v-for="c in tools" :key="c.name"><Icon :name="c.icon" /><span class="n">{{ c.name }}</span><span class="c">{{ c.count }}</span></li>
    </ul>
    <ul class="arch-grid arch-protocol">
      <li v-for="c in protocol" :key="c.name"><Icon :name="c.icon" /><span class="n">{{ c.name }}</span><span class="c">{{ c.count }}</span></li>
    </ul>
  </div>
</template>

<style>
.arch { margin: 1.5rem 0; border-top: 1px solid var(--vp-c-divider); }
.arch-head { padding: 0.9rem 0; font-family: var(--font-display); font-size: 1.15rem; border-bottom: 1px solid var(--vp-c-divider); }
.arch-head span { margin-left: 0.75rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; color: var(--vp-c-text-3); }
.vp-doc .arch-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 2.75rem; }
.vp-doc .arch-grid li { display: flex; align-items: center; gap: 0.65rem; margin: 0; padding: 0.7rem 0.25rem; border-bottom: 1px solid var(--vp-c-divider); line-height: 1.3; }
.vp-doc .arch-grid li .ui-icon { color: var(--vp-c-brand-1); }
.vp-doc .arch-grid li .n { font-size: 0.9rem; color: var(--vp-c-text-1); min-width: 0; }
.vp-doc .arch-grid li .c { margin-left: auto; flex: none; white-space: nowrap; min-width: 1.7rem; text-align: center; padding: 0.1rem 0.4rem; border: 1px solid var(--vp-c-divider); border-radius: 2px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--vp-c-brand-1); }
.arch-protocol { margin-top: 0.75rem !important; border-top: 1px solid var(--vp-c-divider); }
@media (max-width: 900px) { .vp-doc .arch-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .vp-doc .arch-grid { grid-template-columns: 1fr; } }
</style>
