<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <h3 class="text-sm font-extrabold text-body mb-4 flex items-center gap-2 shrink-0">
      <span class="material-symbols-outlined text-primary text-[20px]">folder_open</span>
      {{ title }}
    </h3>
    <div class="space-y-2 flex-1 overflow-y-auto pr-1">
      <!--
        `target="_blank"` opens a new browser tab instead of navigating away from the app.

        The `group` class on the `<a>` lets child spans change their colour on
        hover via `group-hover:text-primary` w/o needing JS.
      -->
      <a
        :href="res.url || '#'" target="_blank"
        v-for="(res, idx) in resources" :key="idx"
        class="flex items-center gap-3 p-2 hover:bg-pop rounded-lg transition-colors group text-sm"
      >
        <span class="material-symbols-outlined text-ghost group-hover:text-primary text-[20px]">{{ res.icon || 'link' }}</span>
        <span class="font-medium text-dim group-hover:text-body truncate" :title="res.title">{{ res.title }}</span>
      </a>
      <div v-if="resources.length === 0" class="text-center py-4 text-xs font-medium text-ghost">
        No resources uploaded.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// `defineProps` declares what data the parent passes in.
// The parent (e.g. ModuleView) is responsible for fetching the data
// this widget is purely presentational: no store or API calls.
const props = defineProps({
  title: { type: String, default: 'Resources' },
  data:  { type: Array,  default: () => null  }
})

// Normalise null to an empty array so template can always safely call
// `.length` and iterate without null checks.
const resources = computed(() => props.data || [])
</script>

<script>
export const widgetMeta = { name: 'Module Resources', w: 6, h: 4 }
</script>
