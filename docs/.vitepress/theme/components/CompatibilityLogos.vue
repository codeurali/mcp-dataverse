<script setup lang="ts">
interface Client {
  icon: string
  name: string
}

const clients: Client[] = [
  { icon: '🤖', name: 'VS Code Copilot' },
  { icon: '🎭', name: 'Claude Desktop' },
  { icon: '🖱️', name: 'Cursor' },
  { icon: '🌊', name: 'Windsurf' },
  { icon: '💎', name: 'Gemini CLI' },
  { icon: '🧩', name: 'Copilot Studio' },
  { icon: '💻', name: 'Codex CLI' },
]
</script>

<template>
  <div class="compat-section">
    <p class="compat-title">Works with your favourite AI client</p>
    <div class="compat-logos">
      <span v-for="client in clients" :key="client.name" class="compat-badge">
        <span class="badge-icon">{{ client.icon }}</span>
        <span>{{ client.name }}</span>
      </span>
    </div>
  </div>
</template>
