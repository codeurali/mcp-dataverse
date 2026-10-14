<script setup lang="ts">
const clients = ['VS Code Copilot', 'Claude Desktop', 'Cursor', 'Windsurf', 'Gemini CLI', 'Copilot Studio', 'Codex CLI']
</script>

<template>
  <div class="compat-section">
    <p class="compat-title">Tested with</p>
    <div class="compat-logos">
      <span v-for="name in clients" :key="name" class="compat-badge">{{ name }}</span>
    </div>
  </div>
</template>
