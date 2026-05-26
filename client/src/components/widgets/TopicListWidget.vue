<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <h3 class="text-sm font-extrabold text-body mb-4 flex items-center gap-2 shrink-0">
      <span class="material-symbols-outlined text-info text-[20px]">format_list_bulleted</span>
      {{ title }}
    </h3>
    <div class="flex-1 overflow-y-auto space-y-2 pr-1">
      <div
        v-for="(topic, idx) in topics" :key="idx"
        class="p-2.5 rounded-lg text-sm font-medium border"
        :class="topic.completed
          ? 'bg-ok-soft text-ok-text border-ok-border'
          : 'bg-pop text-body border-edge'"
      >
        <!--
          `:class` with a ternary applies different Tailwind classes based on
          a condition. completed topics get the green "ok" colour palette
          and incomplete ones get the neutral "pop/edge" palette.
          This keeps logic out of the CSS and in the component
        -->
        <div class="flex items-center justify-between">
          <span class="truncate" :title="topic.title">{{ topic.title }}</span>
          <!-- `v-if` on an inline element hides it entirely so no empty space left behind -->
          <span v-if="topic.completed" class="material-symbols-outlined text-[16px] text-ok">check_circle</span>
        </div>
      </div>
      <div v-if="topics.length === 0" class="text-center py-4 text-xs font-medium text-ghost">
        No topics available.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Topic List' },
  data:  { type: Array,  default: () => null   }
})

const topics = computed(() => props.data || [])
</script>

<script>
export const widgetMeta = { name: 'Module Topics', w: 6, h: 4 }
</script>
