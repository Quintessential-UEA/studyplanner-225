<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h3 class="text-lg font-semibold text-body">{{ title }}</h3>
      <!-- `slot` is a placeholder where the parent can inject extra markup.
           Named slots (name="actions") let a parent add buttons to the header
           without this component needing to know about them. -->
      <slot name="actions"></slot>
    </div>

    <div class="relative flex-1 min-h-0 overflow-hidden text-[16px]">
      <div class="flex flex-wrap gap-1.5 w-full h-full content-start">
        <!--
          Each cell is sized in `em` units (1em × 1em) so the whole grid
          scales proportionally if the font size of the container changes.
          `:title` sets the native browser tooltip on hover.
        -->
        <div
          v-for="(intensity, index) in intensityData"
          :key="index"
          class="w-[1em] h-[1em] rounded-[3px] transition-all duration-200 cursor-pointer hover:scale-125 hover:shadow-sm flex-shrink-0"
          :style="cellStyle(intensity)"
          :title="`Value: ${intensity}`"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:       { type: String, default: 'Activity Heatmap' },
  data:        { type: Array,  default: () => []           },
  colorScheme: { type: String, default: 'green'            }
})

// If no real data is provided, generate random placeholder cells so the
// widget looks populated on the dashboard while data is still being built out (REMOVE LATER).
const intensityData = computed(() => {
  if (props.data && props.data.length > 0) return props.data
  return Array.from({ length: 2500 }, () => {
    const r = Math.random()
    if (r > 0.8) return Math.floor(Math.random() * 3) + 2
    if (r > 0.5) return 1
    return 0
  })
})

// Maps colorScheme to the CSS variable that drives the heatmap colour.
// Intensity 0 uses --color-pop (theme-aware empty-cell colour).
// Intensities 1-4 are that base colour at increasing opacity levels.
const BASE_VAR = {
  green:  '--color-ok',
  blue:   '--color-primary',
  accent: '--color-accent',
  orange: '--color-warn',
}

function cellStyle(intensity) {
  if (intensity === 0) {
    return { backgroundColor: 'var(--color-pop)' }
  }
  const varName = BASE_VAR[props.colorScheme] || '--color-primary'
  // can't pass a CSS custom property directly into rgba() (e.g. rgba(var(--color-ok), 0.5))
  // bc CSS variables resolve to full colour strings, not numeric channels.
  // Instead we use the colour at full saturation and vary `opacity` (simpler).
  const opacities = [0, 0.25, 0.50, 0.75, 1.0]
  const opacity   = opacities[Math.min(intensity, 4)]
  return {
    position:        'relative',
    backgroundColor: `var(${varName})`,
    opacity,
  }
}
</script>

<script>
export const widgetMeta = { name: 'Activity Heatmap (PLACEHOLDER)', w: 12, h: 4 }
</script>
