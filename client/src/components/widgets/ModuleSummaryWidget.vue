<!--
 TODO: Make module summary widget clickable to navigate to module page
       Chose what data to show in the widget and how responsive it is (which details to show for what size)
-->

<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <h3 class="text-lg font-semibold text-body mb-2 shrink-0">Module Overview</h3>

    <!--
      Three-way loading pattern: loading -> empty -> data.
      `v-if / v-else-if / v-else` ensures only one branch renders at a time.
      loading spinner uses Tailwind's `animate-spin` utility 
    -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-sm text-dim">
      <span class="material-symbols-outlined animate-spin mb-2">sync</span>
      Loading modules...
    </div>

    <div v-else-if="modules.length > 0" class="flex-1 flex flex-col overflow-y-auto gap-2 pr-1">
      <!--
        `v-for` renders one element per item in the array. The `:key` attribute
        MUST be a unique & stable ID. Vue uses it to track which DOM node
        belongs to which item so it can update efficiently instead of re-rendering
        the whole list. Using the array index as the key is not a good idea bc
        it changes when items are reordered.
      -->
      <div
        v-for="mod in modules" :key="mod.code"
        class="flex-1 p-3 rounded-xl flex justify-between items-center shadow-sm"
        :style="rowStyle(mod)"
      >
        <div class="flex flex-col overflow-hidden pr-2">
          <span class="font-bold text-sm truncate" :title="mod.title">{{ mod.title }}</span>
          <span class="text-xs opacity-80">{{ mod.code }}</span>
        </div>
        <!-- <div class="text-right shrink-0">
          <span class="font-extrabold text-sm">{{ mod.credits }}</span>
          <span class="text-[10px] font-bold opacity-80 block -mt-1">CR</span>
        </div> -->
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center text-sm text-dim text-center px-4">
      <span class="material-symbols-outlined text-ghost text-3xl mb-2">inbox</span>
      No modules found.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useModuleStore } from '../../stores/modules'
import { useThemeStore } from '../../stores/theme'

const moduleStore = useModuleStore()
const theme       = useThemeStore()

// `computed` derives a value from reactive sources and caches it. it only
// recalculates when moduleStore.modules actually changes instead of every render.
const modules = computed(() => moduleStore.modules)
const loading = computed(() => moduleStore.loading)

onMounted(() => {
  if (modules.value.length === 0) moduleStore.fetchModules()
})

// Generate a WCAG-safe palette per module using our theme engine
// Reactive to dark mode changes because paletteFor reads isDark.value
function rowStyle(mod) {
  const { soft, text } = theme.paletteFor(mod.theme_color || '#3B82F6')
  return { backgroundColor: soft, color: text }
}
</script>

<script>
export const widgetMeta = { name: 'Module Overview', w: 4, h: 3 }
</script>
