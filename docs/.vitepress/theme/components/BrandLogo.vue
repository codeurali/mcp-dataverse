<template>
  <span class="brand-logo" :style="{ width: size + 'px', height: size + 'px' }">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#8b9aff" />
          <stop offset="0.55" stop-color="#5168ff" />
          <stop offset="1" stop-color="#38d3f0" />
        </linearGradient>
      </defs>
      <!-- Hex shield -->
      <path
        d="M32 3.5 56.5 17v30L32 60.5 7.5 47V17L32 3.5Z"
        fill="none"
        :stroke="`url(#${gradId})`"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <!-- Inner data nodes (network) -->
      <circle cx="22" cy="24" r="3.2" :fill="`url(#${gradId})`" />
      <circle cx="42" cy="24" r="3.2" :fill="`url(#${gradId})`" />
      <circle cx="32" cy="42" r="3.2" :fill="`url(#${gradId})`" />
      <circle cx="32" cy="14" r="3.2" :fill="`url(#${gradId})`" />
      <!-- Connection lines -->
      <path
        d="M32 14 L22 24 M32 14 L42 24 M22 24 L32 42 M42 24 L32 42 M22 24 L42 24"
        :stroke="`url(#${gradId})`"
        stroke-width="1.6"
        stroke-linecap="round"
        opacity="0.85"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ size?: number }>()
const size = computed(() => props.size ?? 48)
const gradId = `brand-grad-${Math.random().toString(36).slice(2, 9)}`
</script>
