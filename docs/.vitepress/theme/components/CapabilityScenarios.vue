<template>
  <div class="cap-scenarios">
    <div class="cap-grid">
      <div v-for="cap in capabilities" :key="cap.id" class="cap-card">
        <div class="cap-header">
          <div class="cap-icon-wrap" v-html="cap.icon"></div>
          <span class="cap-badge">{{ cap.badge }}</span>
        </div>
        <h3 class="cap-title">{{ cap.title }}</h3>
        <p class="cap-desc">{{ cap.desc }}</p>
        <div class="cap-prompt">
          <span class="cap-prompt-label">Ask your AI</span>
          <span class="cap-prompt-text">"{{ cap.prompt }}"</span>
        </div>
        <div class="cap-tools">
          <code v-for="tool in cap.tools" :key="tool" class="cap-chip">{{ tool }}</code>
        </div>
      </div>
    </div>

    <div class="cap-footer">
      <span>27 categories · 79 tools ·</span>
      <a href="/mcp-dataverse/capabilities">Browse the full reference →</a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Capability {
  id: string
  icon: string
  badge: string
  title: string
  desc: string
  prompt: string
  tools: string[]
}

const capabilities: Capability[] = [
  {
    id: 'explore',
    badge: 'Schema',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>`,
    title: 'Explore your entire data model',
    desc: 'Map tables, relationships, option sets and entity keys across any Dataverse org — without opening the portal or reading a single doc.',
    prompt: 'Which tables are related to Contact, and what are their primary keys?',
    tools: ['list_tables', 'get_table_metadata', 'get_relationships', 'get_option_set'],
  },
  {
    id: 'query',
    badge: 'Data',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      <path d="M11 8v6M8 11h6"/>
    </svg>`,
    title: 'Query data in plain language',
    desc: 'OData filter, FetchXML aggregate, full-text search, paginated retrieval — your AI writes the right query, runs it, and explains the results.',
    prompt: 'Find all active Accounts in France modified this week, sorted by revenue',
    tools: ['query', 'execute_fetchxml', 'search', 'retrieve_multiple_with_paging'],
  },
  {
    id: 'bulk',
    badge: 'Operations',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
    title: 'Migrate and update at scale',
    desc: 'Up to 1,000 create, update or delete operations in one atomic batch. Build data migration scripts at the speed of a conversation.',
    prompt: 'Archive all Leads from the 2022 campaign and reassign their open Tasks',
    tools: ['batch_execute', 'create', 'update', 'upsert', 'assign'],
  },
  {
    id: 'security',
    badge: 'Security',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2 4 6v6c0 4.2 3.4 8.4 8 10 4.6-1.6 8-5.8 8-10V6z"/>
    </svg>`,
    title: 'Audit security in one conversation',
    desc: 'List roles, inspect privilege sets, detect over-permissioned users, grant or revoke record access — your full RBAC model at a glance.',
    prompt: 'Who has System Administrator role? Flag any non-admins with delete privileges on Contact',
    tools: ['list_roles', 'get_role_privileges', 'assign_role_to_user', 'check_record_access'],
  },
  {
    id: 'debug',
    badge: 'Observability',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
      <path d="m8.5 8.5 7 7"/>
    </svg>`,
    title: 'Debug plugins and flows — no portal',
    desc: 'Pull trace logs and workflow execution history, then let AI diagnose the error, explain the call stack, and suggest the fix.',
    prompt: 'Why did the Contact update plugin fail this morning? Show me the trace and suggest a fix',
    tools: ['get_plugin_trace_logs', 'get_workflow_trace_logs', 'list_plugin_steps', 'list_workflows'],
  },
  {
    id: 'extend',
    badge: 'Customization',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>`,
    title: 'Extend schema, deploy, iterate',
    desc: 'Create tables, add columns, configure lookups and relationships, set environment variables, publish customizations — all via chat.',
    prompt: 'Add a Priority Score decimal column to Account, then publish the customization',
    tools: ['create_table', 'create_attribute', 'create_relationship', 'set_environment_variable', 'publish_customizations'],
  },
]
</script>

<style scoped>
.cap-scenarios {
  max-width: 1100px;
  margin: 0 auto;
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 960px) {
  .cap-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .cap-grid { grid-template-columns: 1fr; }
}

.cap-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.5rem 1.4rem;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.cap-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: var(--brand-glow);
}

.cap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cap-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.cap-badge {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-brand-1);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-brand-soft);
  background: var(--vp-c-brand-soft);
}

.cap-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.3;
}

.cap-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
  flex: 1;
}

.cap-prompt {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  background: var(--vp-c-bg-mute);
  border-left: 2px solid var(--vp-c-brand-1);
}

.cap-prompt-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--vp-c-brand-1);
}

.cap-prompt-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.cap-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: auto;
}

.cap-chip {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.68rem;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.cap-footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.cap-footer a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.cap-footer a:hover {
  text-decoration: underline;
}
</style>
