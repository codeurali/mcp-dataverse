<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{ kind: 'done' | 'planned' | 'progress' | 'warn' | 'blocked' }>()
</script>

<template>
  <span class="status" :class="kind"><Icon :name="kind" :size="15" /><slot /></span>
</template>

<style>
.status { display: inline-flex; align-items: center; gap: 0.4em; white-space: nowrap; }
.status.done { color: var(--demo-token-string); }
.status.planned { color: var(--vp-c-text-3); }
.status.progress { color: var(--vp-c-brand-1); }
.status.warn { color: var(--demo-token-number); }
.status.blocked { color: var(--demo-token-bool); }
</style>
