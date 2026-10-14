<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import LlmToggle from './components/LlmToggle.vue'
import BrandMark from './components/BrandMark.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-title-before>
      <BrandMark />
    </template>
    <template #nav-bar-content-after>
      <LlmToggle />
    </template>
  </Layout>
</template>
