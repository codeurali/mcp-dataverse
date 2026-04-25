<script setup lang="ts">
import { ref, computed } from 'vue'

interface Scenario {
  id: string
  icon: string
  label: string
  toolName: string
  input: string
  output: string
}

const scenarios: Scenario[] = [
  {
    id: 'query',
    icon: '🔍',
    label: 'Query Data',
    toolName: 'dataverse_query',
    input: `{
  <span class="key">"tool"</span>: <span class="string">"dataverse_query"</span>,
  <span class="key">"parameters"</span>: {
    <span class="key">"entityLogicalName"</span>: <span class="string">"account"</span>,
    <span class="key">"select"</span>: [
      <span class="string">"name"</span>,
      <span class="string">"revenue"</span>,
      <span class="string">"createdon"</span>
    ],
    <span class="key">"filter"</span>: <span class="string">"revenue gt 1000000"</span>,
    <span class="key">"orderby"</span>: <span class="string">"revenue desc"</span>,
    <span class="key">"top"</span>: <span class="number">5</span>
  }
}`,
    output: `{
  <span class="key">"summary"</span>: <span class="string">"5 accounts found (revenue > $1M)"</span>,
  <span class="key">"data"</span>: [
    {
      <span class="key">"name"</span>: <span class="string">"Contoso Ltd"</span>,
      <span class="key">"revenue"</span>: <span class="number">8500000</span>,
      <span class="key">"createdon"</span>: <span class="string">"2024-01-15"</span>
    },
    {
      <span class="key">"name"</span>: <span class="string">"Fabrikam Inc"</span>,
      <span class="key">"revenue"</span>: <span class="number">5200000</span>,
      <span class="key">"createdon"</span>: <span class="string">"2023-11-02"</span>
    },
    <span class="comment">// ... 3 more records</span>
  ],
  <span class="key">"suggestions"</span>: [
    <span class="string">"Use dataverse_get to fetch full details"</span>,
    <span class="string">"Try dataverse_execute_fetchxml for complex joins"</span>
  ]
}`,
  },
  {
    id: 'schema',
    icon: '📐',
    label: 'Inspect Schema',
    toolName: 'dataverse_get_table_metadata',
    input: `{
  <span class="key">"tool"</span>: <span class="string">"dataverse_get_table_metadata"</span>,
  <span class="key">"parameters"</span>: {
    <span class="key">"entityLogicalName"</span>: <span class="string">"account"</span>,
    <span class="key">"includeAttributes"</span>: <span class="bool">true</span>,
    <span class="key">"includeRelationships"</span>: <span class="bool">true</span>
  }
}`,
    output: `{
  <span class="key">"summary"</span>: <span class="string">"account — 184 attributes, 23 relationships"</span>,
  <span class="key">"data"</span>: {
    <span class="key">"logicalName"</span>: <span class="string">"account"</span>,
    <span class="key">"displayName"</span>: <span class="string">"Account"</span>,
    <span class="key">"primaryIdAttribute"</span>: <span class="string">"accountid"</span>,
    <span class="key">"primaryNameAttribute"</span>: <span class="string">"name"</span>,
    <span class="key">"attributes"</span>: [
      { <span class="key">"logicalName"</span>: <span class="string">"name"</span>, <span class="key">"type"</span>: <span class="string">"String"</span>, <span class="key">"required"</span>: <span class="bool">true</span> },
      { <span class="key">"logicalName"</span>: <span class="string">"revenue"</span>, <span class="key">"type"</span>: <span class="string">"Money"</span> },
      <span class="comment">// ... 182 more attributes</span>
    ]
  },
  <span class="key">"suggestions"</span>: [
    <span class="string">"Use dataverse_query to fetch account records"</span>
  ]
}`,
  },
  {
    id: 'create',
    icon: '✏️',
    label: 'Create Record',
    toolName: 'dataverse_create',
    input: `{
  <span class="key">"tool"</span>: <span class="string">"dataverse_create"</span>,
  <span class="key">"parameters"</span>: {
    <span class="key">"entityLogicalName"</span>: <span class="string">"contact"</span>,
    <span class="key">"data"</span>: {
      <span class="key">"firstname"</span>: <span class="string">"Alice"</span>,
      <span class="key">"lastname"</span>: <span class="string">"Dupont"</span>,
      <span class="key">"emailaddress1"</span>: <span class="string">"alice@contoso.com"</span>,
      <span class="key">"jobtitle"</span>: <span class="string">"Lead Engineer"</span>,
      <span class="key">"parentcustomerid_account@odata.bind"</span>:
        <span class="string">"/accounts(7c...)"</span>
    }
  }
}`,
    output: `{
  <span class="key">"summary"</span>: <span class="string">"Contact created successfully"</span>,
  <span class="key">"data"</span>: {
    <span class="key">"contactid"</span>: <span class="string">"a1b2c3d4-0000-0000-0000-000000000001"</span>,
    <span class="key">"fullname"</span>: <span class="string">"Alice Dupont"</span>,
    <span class="key">"emailaddress1"</span>: <span class="string">"alice@contoso.com"</span>,
    <span class="key">"createdon"</span>: <span class="string">"2024-07-10T14:23:00Z"</span>
  },
  <span class="key">"suggestions"</span>: [
    <span class="string">"Use dataverse_associate to link to other records"</span>,
    <span class="string">"Use dataverse_update to modify fields later"</span>
  ]
}`,
  },
  {
    id: 'search',
    icon: '🔎',
    label: 'Full-text Search',
    toolName: 'dataverse_search',
    input: `{
  <span class="key">"tool"</span>: <span class="string">"dataverse_search"</span>,
  <span class="key">"parameters"</span>: {
    <span class="key">"query"</span>: <span class="string">"invoice overdue Q4"</span>,
    <span class="key">"entities"</span>: [
      <span class="string">"opportunity"</span>,
      <span class="string">"invoice"</span>,
      <span class="string">"quote"</span>
    ],
    <span class="key">"top"</span>: <span class="number">8</span>
  }
}`,
    output: `{
  <span class="key">"summary"</span>: <span class="string">"6 results across 2 entities"</span>,
  <span class="key">"data"</span>: [
    {
      <span class="key">"@search.score"</span>: <span class="number">0.94</span>,
      <span class="key">"entityType"</span>: <span class="string">"invoice"</span>,
      <span class="key">"name"</span>: <span class="string">"INV-2024-1847 — Q4 Renewal"</span>,
      <span class="key">"statecode"</span>: <span class="string">"Active"</span>
    },
    {
      <span class="key">"@search.score"</span>: <span class="number">0.87</span>,
      <span class="key">"entityType"</span>: <span class="string">"opportunity"</span>,
      <span class="key">"name"</span>: <span class="string">"Contoso Q4 Upsell"</span>
    },
    <span class="comment">// ... 4 more results</span>
  ],
  <span class="key">"suggestions"</span>: [
    <span class="string">"Use dataverse_get to load full record details"</span>
  ]
}`,
  },
  {
    id: 'batch',
    icon: '⚡',
    label: 'Batch Execute',
    toolName: 'dataverse_batch_execute',
    input: `{
  <span class="key">"tool"</span>: <span class="string">"dataverse_batch_execute"</span>,
  <span class="key">"parameters"</span>: {
    <span class="key">"requests"</span>: [
      {
        <span class="key">"method"</span>: <span class="string">"PATCH"</span>,
        <span class="key">"url"</span>: <span class="string">"accounts(aaa...)"</span>,
        <span class="key">"body"</span>: { <span class="key">"statecode"</span>: <span class="number">0</span> }
      },
      {
        <span class="key">"method"</span>: <span class="string">"PATCH"</span>,
        <span class="key">"url"</span>: <span class="string">"accounts(bbb...)"</span>,
        <span class="key">"body"</span>: { <span class="key">"statecode"</span>: <span class="number">0</span> }
      }
      <span class="comment">// ... up to 1 000 operations</span>
    ]
  }
}`,
    output: `{
  <span class="key">"summary"</span>: <span class="string">"Batch completed: 2/2 succeeded"</span>,
  <span class="key">"data"</span>: {
    <span class="key">"total"</span>: <span class="number">2</span>,
    <span class="key">"succeeded"</span>: <span class="number">2</span>,
    <span class="key">"failed"</span>: <span class="number">0</span>,
    <span class="key">"responses"</span>: [
      { <span class="key">"status"</span>: <span class="number">204</span>, <span class="key">"id"</span>: <span class="string">"aaa..."</span> },
      { <span class="key">"status"</span>: <span class="number">204</span>, <span class="key">"id"</span>: <span class="string">"bbb..."</span> }
    ]
  },
  <span class="key">"suggestions"</span>: [
    <span class="string">"Batch supports up to 1 000 mixed operations"</span>
  ]
}`,
  },
]

const selectedId = ref('query')
const isLoading = ref(false)
const showResponse = ref(true)

const selected = computed(() => scenarios.find((s) => s.id === selectedId.value)!)

function selectScenario(s: Scenario) {
  if (s.id === selectedId.value) return
  isLoading.value = true
  showResponse.value = false
  selectedId.value = s.id

  setTimeout(() => {
    isLoading.value = false
    showResponse.value = true
  }, 600)
}
</script>

<template>
  <section class="demo-section">
    <div class="demo-header">
      <h2>See it in action</h2>
      <p>Pick a scenario — your AI agent calls the right tool and gets a structured response.</p>
    </div>

    <div class="scenario-tabs">
      <button
        v-for="s in scenarios"
        :key="s.id"
        :class="['scenario-btn', { active: selectedId === s.id }]"
        @click="selectScenario(s)"
      >
        <span>{{ s.icon }}</span>
        <span>{{ s.label }}</span>
      </button>
    </div>

    <div class="demo-panels">
      <!-- Tool Call panel -->
      <div class="demo-panel">
        <div class="demo-panel-header">
          <div class="demo-dots">
            <span class="demo-dot red"></span>
            <span class="demo-dot yellow"></span>
            <span class="demo-dot green"></span>
          </div>
          <span>Tool Call</span>
          <span class="tool-chip">{{ selected.toolName }}</span>
        </div>
        <pre class="demo-code" v-html="selected.input"></pre>
      </div>

      <!-- Response panel -->
      <div class="demo-panel">
        <div class="demo-panel-header">
          <div class="demo-dots">
            <span class="demo-dot red"></span>
            <span class="demo-dot yellow"></span>
            <span class="demo-dot green"></span>
          </div>
          <span>Response</span>
          <span v-if="isLoading" class="badge-loading">running…</span>
          <span v-else class="badge-ok">✓ 200 OK</span>
        </div>
        <pre
          v-if="!isLoading && showResponse"
          class="demo-code demo-fade-in"
          v-html="selected.output"
        ></pre>
        <div v-else class="demo-loading-placeholder">
          <div class="loading-bar"></div>
          <div class="loading-bar short"></div>
          <div class="loading-bar medium"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tool-chip {
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.25);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-loading-placeholder {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  justify-content: center;
}

.loading-bar {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--vp-c-bg-mute) 25%, rgba(139,92,246,0.15) 50%, var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
  width: 100%;
}

.loading-bar.short  { width: 45%; }
.loading-bar.medium { width: 70%; }

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
</style>
