<template>
  <div class="tools-showcase">
    <div class="tools-search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search 79 tools…  (e.g. query, role, file)"
        aria-label="Search tools"
      />
    </div>

    <div class="tools-cat-filters">
      <button
        class="tools-cat-btn"
        :class="{ active: activeCat === 'all' }"
        @click="activeCat = 'all'"
      >
        All <span class="count">{{ tools.length }}</span>
      </button>
      <button
        v-for="cat in categories"
        :key="cat.name"
        class="tools-cat-btn"
        :class="{ active: activeCat === cat.name }"
        @click="activeCat = cat.name"
      >
        <span>{{ cat.icon }}</span>
        {{ cat.name }}
        <span class="count">{{ cat.count }}</span>
      </button>
    </div>

    <div v-if="filtered.length" class="tools-grid">
      <div v-for="t in filtered" :key="t.name" class="tool-card" :class="{ featured: t.featured }">
        <span class="cat">{{ t.cat }}</span>
        <span class="name">
          <span class="prefix">dataverse_</span>{{ t.name }}
        </span>
      </div>
    </div>
    <div v-else class="tools-empty">
      No tool matches "<strong>{{ search }}</strong>". Try another keyword.
    </div>

    <p class="tools-meta">
      Showing <strong>{{ filtered.length }}</strong> of <strong>{{ tools.length }}</strong> tools across
      <strong>{{ categories.length }}</strong> categories.
      <a href="/mcp-dataverse/capabilities">See full reference →</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Tool { name: string; cat: string; featured?: boolean }

// All 79 tools, grouped by category (matches docs/capabilities.md)
const tools: Tool[] = [
  // Auth (1)
  { cat: 'Auth', name: 'whoami', featured: true },
  // Metadata (9)
  { cat: 'Metadata', name: 'list_tables', featured: true },
  { cat: 'Metadata', name: 'get_table_metadata', featured: true },
  { cat: 'Metadata', name: 'get_relationships' },
  { cat: 'Metadata', name: 'list_global_option_sets' },
  { cat: 'Metadata', name: 'get_option_set' },
  { cat: 'Metadata', name: 'get_entity_key' },
  { cat: 'Metadata', name: 'get_attribute_option_set' },
  { cat: 'Metadata', name: 'update_entity' },
  { cat: 'Metadata', name: 'resolve_entity_name' },
  // Query (3)
  { cat: 'Query', name: 'query', featured: true },
  { cat: 'Query', name: 'execute_fetchxml', featured: true },
  { cat: 'Query', name: 'retrieve_multiple_with_paging' },
  // CRUD (6)
  { cat: 'CRUD', name: 'get', featured: true },
  { cat: 'CRUD', name: 'create', featured: true },
  { cat: 'CRUD', name: 'update', featured: true },
  { cat: 'CRUD', name: 'delete', featured: true },
  { cat: 'CRUD', name: 'upsert' },
  { cat: 'CRUD', name: 'assign' },
  // Relations (4)
  { cat: 'Relations', name: 'associate' },
  { cat: 'Relations', name: 'associate_bulk' },
  { cat: 'Relations', name: 'disassociate' },
  { cat: 'Relations', name: 'query_associations' },
  // Actions (6)
  { cat: 'Actions', name: 'execute_action' },
  { cat: 'Actions', name: 'execute_function' },
  { cat: 'Actions', name: 'execute_bound_action' },
  { cat: 'Actions', name: 'execute_bound_function' },
  { cat: 'Actions', name: 'list_dependencies' },
  { cat: 'Actions', name: 'retrieve_dependencies_for_delete' },
  // Batch (1)
  { cat: 'Batch', name: 'batch_execute' },
  // Change Tracking (1)
  { cat: 'Change Tracking', name: 'change_detection' },
  // Solutions (2)
  { cat: 'Solutions', name: 'publish_customizations' },
  { cat: 'Solutions', name: 'create_sitemap' },
  // Impersonation (1)
  { cat: 'Impersonation', name: 'impersonate' },
  // Customization (4)
  { cat: 'Customization', name: 'list_custom_actions' },
  { cat: 'Customization', name: 'list_plugin_steps' },
  { cat: 'Customization', name: 'set_workflow_state' },
  { cat: 'Customization', name: 'list_connection_references' },
  // Environment (4)
  { cat: 'Environment', name: 'get_environment_variable' },
  { cat: 'Environment', name: 'set_environment_variable' },
  { cat: 'Environment', name: 'create_environment_variable' },
  { cat: 'Environment', name: 'environment_capabilities' },
  // Trace (2)
  { cat: 'Trace', name: 'get_plugin_trace_logs' },
  { cat: 'Trace', name: 'get_workflow_trace_logs' },
  // Search (1)
  { cat: 'Search', name: 'search', featured: true },
  // Audit (1)
  { cat: 'Audit', name: 'get_audit_log' },
  // Quality (1)
  { cat: 'Quality', name: 'detect_duplicates' },
  // Annotations (2)
  { cat: 'Annotations', name: 'get_annotations' },
  { cat: 'Annotations', name: 'create_annotation' },
  // Users (2)
  { cat: 'Users', name: 'list_users' },
  { cat: 'Users', name: 'get_user_roles' },
  // RBAC (7)
  { cat: 'RBAC', name: 'list_roles' },
  { cat: 'RBAC', name: 'assign_role_to_user' },
  { cat: 'RBAC', name: 'remove_role_from_user' },
  { cat: 'RBAC', name: 'assign_role_to_team' },
  { cat: 'RBAC', name: 'get_role_privileges' },
  { cat: 'RBAC', name: 'add_role_privileges' },
  { cat: 'RBAC', name: 'replace_role_privileges' },
  // Views (1)
  { cat: 'Views', name: 'list_views' },
  // Files (2)
  { cat: 'Files', name: 'upload_file_column' },
  { cat: 'Files', name: 'download_file_column' },
  // Org (2)
  { cat: 'Org', name: 'list_business_units' },
  { cat: 'Org', name: 'list_teams' },
  // Workflows (4)
  { cat: 'Workflows', name: 'list_workflows' },
  { cat: 'Workflows', name: 'get_workflow' },
  { cat: 'Workflows', name: 'list_guides' },
  { cat: 'Workflows', name: 'get_guide' },
  // Assistance (2)
  { cat: 'Assistance', name: 'suggest_tools', featured: true },
  { cat: 'Assistance', name: 'list_tool_tags' },
  // Attributes (4)
  { cat: 'Attributes', name: 'create_attribute' },
  { cat: 'Attributes', name: 'update_attribute' },
  { cat: 'Attributes', name: 'delete_attribute' },
  { cat: 'Attributes', name: 'create_lookup_attribute' },
  // Schema (2)
  { cat: 'Schema', name: 'create_table' },
  { cat: 'Schema', name: 'create_relationship' },
  // Record Access (4)
  { cat: 'Record Access', name: 'check_record_access' },
  { cat: 'Record Access', name: 'grant_access' },
  { cat: 'Record Access', name: 'revoke_access' },
  { cat: 'Record Access', name: 'merge_records' },
]

const ICONS: Record<string, string> = {
  Auth: '🔑',
  Metadata: '📋',
  Query: '🔍',
  CRUD: '✏️',
  Relations: '🔗',
  Actions: '⚡',
  Batch: '📦',
  'Change Tracking': '🔄',
  Solutions: '🧩',
  Impersonation: '👤',
  Customization: '🔧',
  Environment: '⚙️',
  Trace: '🔎',
  Search: '🌐',
  Audit: '📜',
  Quality: '✅',
  Annotations: '📝',
  Users: '👥',
  RBAC: '🛡️',
  Views: '👁️',
  Files: '📁',
  Org: '🏢',
  Workflows: '⚙️',
  Assistance: '🤖',
  Attributes: '🏗️',
  Schema: '📐',
  'Record Access': '🔐',
}

const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const t of tools) counts.set(t.cat, (counts.get(t.cat) ?? 0) + 1)
  return Array.from(counts.entries()).map(([name, count]) => ({
    name,
    count,
    icon: ICONS[name] ?? '•',
  }))
})

const search = ref('')
const activeCat = ref<string>('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tools.filter((t) => {
    const matchCat = activeCat.value === 'all' || t.cat === activeCat.value
    if (!matchCat) return false
    if (!q) return true
    return t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q)
  })
})
</script>
