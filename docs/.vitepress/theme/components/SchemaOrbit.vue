<script setup lang="ts">
// Hero figure. Reading from the outside in: an engraved band naming the
// protocol and the platform, MCP clients on the outer ring, tool calls running
// inward to Dataverse tables, and a database labelled Dataverse at the centre.
// Clients and tables share one slowly rotating group; each tag counter-rotates
// so its label stays upright. The engraved band turns the other way.
const C = 200

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

const ticks = Array.from({ length: 60 }, (_, i) => {
  const deg = i * 6
  const major = i % 5 === 0
  const [x1, y1] = polar(170, deg)
  const [x2, y2] = polar(major ? 161 : 165, deg)
  return { x1, y1, x2, y2, w: major ? 1 : 0.6, o: major ? 0.9 : 0.5 }
})

const BAND = 'MODEL CONTEXT PROTOCOL  ·  MICROSOFT DATAVERSE  ·  '.repeat(2)

interface Tag { id: string; label: string; r: number; deg: number; w: number }
const clients: Tag[] = [
  { id: 'vscode', label: 'VS Code', r: 140, deg: 25, w: 56 },
  { id: 'claude', label: 'Claude', r: 140, deg: 115, w: 50 },
  { id: 'cursor', label: 'Cursor', r: 140, deg: 205, w: 50 },
  { id: 'studio', label: 'Copilot Studio', r: 140, deg: 295, w: 78 },
]
const tables: Tag[] = [
  { id: 'account', label: 'account', r: 84, deg: 70, w: 46 },
  { id: 'contact', label: 'contact', r: 84, deg: 160, w: 46 },
  { id: 'lead', label: 'lead', r: 84, deg: 250, w: 34 },
  { id: 'task', label: 'task', r: 84, deg: 340, w: 34 },
]
const all = [...clients, ...tables]
const pos = Object.fromEntries(all.map((n) => [n.id, polar(n.r, n.deg)])) as Record<string, [number, number]>

const calls: [string, string][] = [
  ['vscode', 'account'], ['claude', 'contact'], ['cursor', 'lead'], ['studio', 'task'],
]
const relations: [string, string][] = [
  ['account', 'contact'], ['contact', 'lead'], ['lead', 'task'], ['task', 'account'],
]
</script>

<template>
  <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" role="img"
       aria-label="MCP clients on the outside send tool calls to Microsoft Dataverse tables around a database" class="schema-orbit">
    <defs>
      <path id="orbit-band" :d="`M ${C} ${C} m -187 0 a 187 187 0 1 1 374 0 a 187 187 0 1 1 -374 0`" />
    </defs>

    <circle :cx="C" :cy="C" r="198" stroke-width="1.2" />
    <circle :cx="C" :cy="C" r="176" stroke-width="0.7" opacity="0.6" />
    <g class="orbit-band">
      <text class="orbit-band-text" fill="currentColor" stroke="none">
        <textPath href="#orbit-band" :textLength="1175" lengthAdjust="spacing">{{ BAND }}</textPath>
      </text>
    </g>

    <g class="orbit-ticks">
      <line v-for="(t, i) in ticks" :key="i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :stroke-width="t.w" :opacity="t.o" />
    </g>

    <circle :cx="C" :cy="C" r="140" stroke-width="0.6" opacity="0.3" stroke-dasharray="2 4" />
    <circle :cx="C" :cy="C" r="84" stroke-width="0.6" opacity="0.3" stroke-dasharray="2 4" />

    <g class="orbit-main">
      <line v-for="(l, i) in relations" :key="'r' + i" :x1="pos[l[0]][0]" :y1="pos[l[0]][1]" :x2="pos[l[1]][0]" :y2="pos[l[1]][1]" stroke-width="0.8" opacity="0.45" />
      <line v-for="(l, i) in calls" :key="'c' + i" :x1="pos[l[0]][0]" :y1="pos[l[0]][1]" :x2="pos[l[1]][0]" :y2="pos[l[1]][1]" stroke-width="1" class="orbit-call" />

      <g v-for="n in clients" :key="n.id" class="orbit-node">
        <rect :x="pos[n.id][0] - n.w / 2" :y="pos[n.id][1] - 9" :width="n.w" height="18" rx="9" fill="var(--vp-c-bg)" stroke-width="1" />
        <text :x="pos[n.id][0]" :y="pos[n.id][1] + 3" text-anchor="middle" class="orbit-label" fill="currentColor" stroke="none">{{ n.label }}</text>
      </g>

      <g v-for="n in tables" :key="n.id" class="orbit-node">
        <rect :x="pos[n.id][0] - n.w / 2" :y="pos[n.id][1] - 11" :width="n.w" height="22" rx="2" fill="var(--vp-c-bg)" stroke-width="1" />
        <line :x1="pos[n.id][0] - n.w / 2" :y1="pos[n.id][1] - 4" :x2="pos[n.id][0] + n.w / 2" :y2="pos[n.id][1] - 4" stroke-width="0.7" opacity="0.6" />
        <text :x="pos[n.id][0]" :y="pos[n.id][1] + 8" text-anchor="middle" class="orbit-label" fill="currentColor" stroke="none">{{ n.label }}</text>
      </g>
    </g>

    <!-- Dataverse at the centre -->
    <g>
      <circle :cx="C" :cy="C" r="44" fill="var(--vp-c-bg)" stroke-width="1" />
      <ellipse :cx="C" :cy="C - 17" rx="19" ry="6.5" stroke-width="1.4" />
      <path :d="`M ${C - 19} ${C - 17} v16 c0 3.6 8.5 6.5 19 6.5 s19 -2.9 19 -6.5 v-16`" stroke-width="1.4" />
      <path :d="`M ${C - 19} ${C - 9} c0 3.6 8.5 6.5 19 6.5 s19 -2.9 19 -6.5`" stroke-width="1.4" />
      <text :x="C" :y="C + 24" text-anchor="middle" class="orbit-core" fill="currentColor" stroke="none">Dataverse</text>
    </g>
  </svg>
</template>

<style>
.schema-orbit .orbit-label { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.03em; opacity: 0.85; }
.schema-orbit .orbit-band-text { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.2em; opacity: 0.75; }
.schema-orbit .orbit-core { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.02em; }
.schema-orbit .orbit-call { stroke-dasharray: 3 5; opacity: 0.8; }
@media (prefers-reduced-motion: no-preference) {
  .schema-orbit .orbit-main { transform-origin: 200px 200px; animation: orbit-turn 200s linear infinite; }
  .schema-orbit .orbit-node { transform-box: fill-box; transform-origin: center; animation: orbit-turn 200s linear infinite reverse; }
  .schema-orbit .orbit-band, .schema-orbit .orbit-ticks { transform-origin: 200px 200px; animation: orbit-turn 320s linear infinite reverse; }
  .schema-orbit .orbit-call { animation: orbit-flow 2.4s linear infinite; }
}
@keyframes orbit-turn { to { transform: rotate(360deg); } }
@keyframes orbit-flow { to { stroke-dashoffset: -16; } }
</style>
