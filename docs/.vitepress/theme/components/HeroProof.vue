<script setup lang="ts">
import { data } from '../stats.data'

// 8299 -> "8.2k+": rounded down so the "+" stays true
const downloads = `${(Math.floor(data.downloads / 100) / 10).toFixed(1)}k+`
const since = new Date(data.since).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
</script>

<template>
  <div class="hp-proof">
    <div>
      <div class="num">100<small>tools</small></div>
      <div class="lbl">Across 28 categories: records, metadata, FetchXML, batch, audit, security. Includes five interactive MCP Apps.</div>
    </div>
    <div>
      <div class="num">{{ downloads }}<small>downloads</small></div>
      <div class="lbl">On npm since {{ since }}, with {{ data.releases }} releases. The full history is in the changelog.</div>
    </div>
    <div>
      <div class="num">1000<small>ops</small></div>
      <div class="lbl">Operations in a single batch request, with changesets and per-operation results.</div>
    </div>
  </div>
</template>
