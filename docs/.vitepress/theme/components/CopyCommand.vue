<template>
  <div class="copy-cmd" :class="{ copied }">
    <span class="copy-cmd-prompt">$</span>
    <span class="copy-cmd-text">{{ command }}</span>
    <button class="copy-cmd-btn" :aria-label="copied ? 'Copied!' : 'Copy command'" @click="copy">
      <svg v-if="!copied" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ command: string }>()
const copied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.command).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<style scoped>
.copy-cmd {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}
.copy-cmd.copied {
  border-color: var(--vp-c-brand-1);
}
.copy-cmd-prompt {
  color: var(--vp-c-brand-1);
  font-weight: 700;
  user-select: none;
}
.copy-cmd-text {
  user-select: all;
}
.copy-cmd-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  line-height: 1;
}
.copy-cmd-btn:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.copy-cmd.copied .copy-cmd-btn {
  color: var(--vp-c-green-1, #3dd68c);
}
</style>
