<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '../icons'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
const body = computed(() => icons[props.name] ?? '')
</script>

<template>
  <svg class="ui-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="body" />
</template>

<style>
.ui-icon { display: inline-block; vertical-align: -0.2em; flex: none; }
</style>
