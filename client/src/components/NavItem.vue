<template>
  <div
    @click="handleClick"
    class="flex items-center px-6 py-3 cursor-pointer transition-colors relative group"
    :class="isActive ? 'text-primary bg-primary-soft' : 'text-dim hover:bg-pop hover:text-body'"
    :title="!isExpanded ? label : ''"
  >
    <div v-if="isActive" class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
    <span
      class="material-symbols-outlined text-[24px] shrink-0 transition-transform group-hover:scale-110"
      :style="isActive ? 'font-variation-settings: \'FILL\' 1;' : ''"
    >
      {{ icon }}
    </span>
    <span
      class="ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
      :class="isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNavigationStore } from '../stores/navigation'

const props = defineProps({
  icon: String,
  label: String,
  view: String,
  isExpanded: Boolean
})

const nav = useNavigationStore()
const isActive = computed(() => nav.currentView === props.view)

const handleClick = () => {
  if (!isActive.value) {
    nav.navigate(props.view)
  }
}
</script>
