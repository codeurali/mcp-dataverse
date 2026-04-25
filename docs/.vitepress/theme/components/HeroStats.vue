<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Stat {
  icon: string
  value: number
  suffix?: string
  label: string
}

const stats: Stat[] = [
  { icon: '🛠️', value: 79, label: 'Production-Ready Tools' },
  { icon: '📦', value: 4,  label: 'MCP Resources' },
  { icon: '🔐', value: 3,  label: 'Auth Modes' },
  { icon: '📋', value: 10, label: 'Guided Workflows' },
]

const displayed = ref(stats.map(() => 0))
const visible = ref(false)

function animateCount(index: number, target: number, duration = 1200) {
  const start = performance.now()
  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    displayed.value[index] = Math.round(eased * target)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(() => {
  const el = document.querySelector('.hero-stats')
  if (!el) {
    visible.value = true
    stats.forEach((s, i) => animateCount(i, s.value))
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !visible.value) {
        visible.value = true
        stats.forEach((s, i) => animateCount(i, s.value))
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(el)
})
</script>

<template>
  <div class="hero-stats">
    <div v-for="(stat, i) in stats" :key="stat.label" class="stat-card">
      <span class="stat-icon">{{ stat.icon }}</span>
      <div class="stat-number">{{ displayed[i] }}{{ stat.suffix ?? '' }}</div>
      <div class="stat-label">{{ stat.label }}</div>
    </div>
  </div>
</template>
