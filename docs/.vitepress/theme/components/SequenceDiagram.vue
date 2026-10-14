<script setup lang="ts">
import { computed } from 'vue'
import { sequences } from '../diagrams'

const props = defineProps<{ name: string }>()
const data = computed(() => sequences[props.name])

const COL = 200
const TOP = 78
const ROW = 50

const xs = computed(() => {
  const m: Record<string, number> = {}
  data.value.participants.forEach((p, i) => (m[p.id] = COL / 2 + i * COL))
  return m
})
const width = computed(() => data.value.participants.length * COL)

const rows = computed(() => {
  let n = 0
  return data.value.steps.map((s, i) => {
    const y = TOP + 30 + i * ROW
    if ('note' in s) {
      const [a, b] = s.over
      const need = s.note.length * 8.2 + 36
      const cx = b ? (xs.value[a] + xs.value[b]) / 2 : xs.value[a]
      const w = Math.max(need, b ? Math.abs(xs.value[b] - xs.value[a]) + 40 : 0)
      return { kind: 'note' as const, y, x: cx - w / 2, w, text: s.note }
    }
    n += 1
    const x1 = xs.value[s.from]
    const x2 = xs.value[s.to]
    const dir = x2 > x1 ? 1 : -1
    return { kind: 'msg' as const, y, x1, x2: x2 - dir * 4, mid: (x1 + x2) / 2, n, text: s.text, reply: !!s.reply }
  })
})
const height = computed(() => TOP + 30 + data.value.steps.length * ROW + 6)
</script>

<template>
  <figure class="seq">
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Sequence diagram">
      <defs>
        <marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 10 5 0 9z" fill="currentColor" />
        </marker>
      </defs>
      <g v-for="p in data.participants" :key="p.id">
        <line :x1="xs[p.id]" :y1="TOP - 8" :x2="xs[p.id]" :y2="height" class="life" />
        <rect :x="xs[p.id] - 85" y="6" width="170" height="58" rx="3" class="box" />
        <text :x="xs[p.id]" :y="p.sub ? 30 : 41" text-anchor="middle" class="plabel">{{ p.label }}</text>
        <text v-if="p.sub" :x="xs[p.id]" y="51" text-anchor="middle" class="psub">{{ p.sub }}</text>
      </g>
      <g v-for="(r, i) in rows" :key="i">
        <template v-if="r.kind === 'note'">
          <rect :x="r.x" :y="r.y - 17" :width="r.w" height="32" rx="2" class="note" />
          <text :x="r.x + r.w / 2" :y="r.y + 4" text-anchor="middle" class="ntext">{{ r.text }}</text>
        </template>
        <template v-else>
          <text :x="r.mid" :y="r.y - 7" text-anchor="middle" class="mtext"><tspan class="num">{{ r.n }}</tspan>  {{ r.text }}</text>
          <line :x1="r.x1" :y1="r.y" :x2="r.x2" :y2="r.y" class="arrow" :class="{ reply: r.reply }" marker-end="url(#seq-arrow)" />
        </template>
      </g>
    </svg>
  </figure>
</template>

<style>
.seq { margin: 1.75rem 0; padding: 1rem 0.5rem; border-top: 1px solid var(--vp-c-divider); border-bottom: 1px solid var(--vp-c-divider); color: var(--vp-c-text-1); }
.seq svg { width: 100%; height: auto; display: block; }
.seq .life { stroke: var(--vp-c-divider); stroke-width: 1; stroke-dasharray: 3 5; }
.seq .box { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-brand-1); stroke-width: 1; }
.seq .plabel { font-family: var(--font-display); font-size: 20px; fill: var(--vp-c-text-1); }
.seq .psub { font-family: var(--font-mono); font-size: 12.5px; fill: var(--vp-c-text-3); }
.seq .arrow { stroke: var(--vp-c-text-2); stroke-width: 1.2; color: var(--vp-c-text-2); }
.seq .arrow.reply { stroke-dasharray: 5 4; }
.seq .mtext { font-family: var(--font-body); font-size: 15px; fill: var(--vp-c-text-1); }
.seq .num { font-family: var(--font-mono); font-size: 12px; fill: var(--vp-c-brand-1); }
.seq .note { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); stroke-width: 0.8; }
.seq .ntext { font-family: var(--font-body); font-size: 14px; fill: var(--vp-c-text-2); }
</style>
