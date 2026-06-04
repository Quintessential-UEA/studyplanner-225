<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h3 class="text-lg font-semibold text-body">{{ title }}</h3>
      <!-- `slot` is a placeholder where the parent can inject extra markup.
           Named slots (name="actions") let a parent add buttons to the header
           without this component needing to know about them. -->
      <slot name="actions"></slot>
      <div class="flex gap-2 text-sm">
        <button @click="setViewMode('day')" :class="{ 'font-bold': localViewMode === 'day' }">Day</button>
        <button @click="setViewMode('week')" :class="{ 'font-bold': localViewMode === 'week' }">Week</button>
        <button @click="setViewMode('month')" :class="{ 'font-bold': localViewMode === 'month' }">Month</button>
      </div>
    </div>

    <div class="relative flex-1 min-h-0 overflow-visible" ref="containerRef">
      <div class="w-full h-full" :style="gridStyle">
      <div v-for="(cell, index) in cellDisplay" :key="index"
       class="rounded-[3px] transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-sm"
       :style="cellStyle(cell)"
       :title="`Value: ${cell.intensity}`"
      >
      <span class="text-[10px] border-10px font-medium select-none" style="color: var(--color-body)">
        {{ cell.label }}
      </span>
      </div>
    </div>
  </div>  
</div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useEventStore } from '../../stores/events.js'
import { useTaskStore } from '../../stores/tasks.js'


const eventStore      = useEventStore()
const taskStore       = useTaskStore()
const emit            = defineEmits(['update:viewMode'])
const containerRef    = ref(null)
const containerWidth  = ref(0)
const containerHeight = ref(0)

let ro 

onMounted(() =>{
  ro = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width
    containerHeight.value = entry.contentRect.height
  })
  ro.observe(containerRef.value)
})

onUnmounted(() => ro?.disconnect())

const cellSize = computed(() => {
  const count = cellDisplay.value.length
  if(!count || !containerWidth.value) return 0

  const ratio = containerWidth.value / containerHeight.value
  const cols  = Math.ceil(Math.sqrt(count * ratio))
  const rows  = Math.ceil(count/cols)
  const gap   = 30

  const cellW = (containerWidth.value - gap * (cols - 1)) / cols
  const cellH = (containerHeight.value - gap * (rows - 1)) / rows
  return Math.floor(Math.min(cellW, cellH))
})

const gridStyle = computed(() => {
  if(!cellSize.value) return {}
  return {
    display:        'flex',
    flexWrap:       'wrap',
    justifyContent: 'center',
    alignContent:   'center',
    gap:            '30px',
    width:          '100%',
    height:         '100%',
  }
})

const props = defineProps({
  title:       { type: String, default: 'Activity Heatmap' },
  data:        { type: Array,  default: () => []           },
  colorScheme: { type: String, default: 'green'            },
  viewMode:    { type: String, default: 'week'}
})

const localViewMode = ref(props.viewMode)

watch(() => props.viewMode, val => {localViewMode.value = val})

function setViewMode(mode){
  localViewMode.value = mode
  emit('update:viewMode', mode)
}



// If no real data is provided, generate random placeholder cells so the
// widget looks populated on the dashboard while data is still being built out (REMOVE LATER).


const resolvedData = computed(() => {
  const storeEvents = eventStore.events

  const storeTasks = taskStore.tasks
    .filter(t => t.due_date)
    .map(t => ({...t, start: t.due_date}))



/*
  //Testing here by just adding events to make sure heatmap changes colour
  const today     = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() -1)
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() +1)

  const testData = [
  
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: today.toISOString()},
  {start_time: tomorrow.toISOString()},
  {start_time: tomorrow.toISOString()},
  {start_time: tomorrow.toISOString()},
  {start_time: tomorrow.toISOString()},
  {start_time: yesterday.toISOString()},
  {start_time: yesterday.toISOString()},
  ]

*/

  
  return [...storeEvents, ...storeTasks, /*...testData*/]
})

const cellDisplay = computed(() => {
  const map = new Map()

  for (const event of resolvedData.value){
    const raw = event.start_time ?? event.start
    if(!raw) continue
    const key = new Date(raw).toISOString().slice(0, 10)
    map.set(key, (map.get(key) || 0) + 1)
  }

  const result = []
  const now    = new Date()

//Get view by day/week/month 
  const addDayRange = (start, end) => {
    for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
    const key = d.toISOString().slice(0, 10)
    result.push({ label: d.getDate(), intensity: map.get(key) || 0,
    isToday: d.toDateString() === now.toDateString()})
    }
  }

  
  if (localViewMode.value === 'month'){
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() +1, 0)
  addDayRange(start, end)
  }


  else if(localViewMode.value === 'week'){
    const start = new Date(now)
    start.setDate(now.getDate() - 3)
    const end = new Date(now)
    end.setDate(now.getDate() + 3)
    addDayRange(start, end)
  }

  else if (localViewMode.value === 'day'){
    return Array.from({ length: 24 }, (_, h) =>{
      const count = props.data.filter(e => {
        const d = new Date(e.start_time ?? e.start)
        return d.toDateString() === now.toDateString() && d.getHours() === h
      }).length
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ?'12pm' : `${h - 12}pm`
      return { label, intensity: count }
    })
  }
  return result
})

const maxIntensity = computed(() => {
  const data = cellDisplay.value
  return data.length ? Math.max(... data.map(c => c.intensity)) : 1
})




// Intensity 0 uses --color-pop (theme-aware empty-cell colour).
// Intensity range based on number of events, using different colours from the CSS colorScheme.
function cellStyle(cell) {
  const size = cellSize.value
  const base = {
    width:            size + 'px',
    height:           size + 'px',
    flexShrink:       0,
    display:          'flex',
    alignItems:       'center',
    justifyContent:   'center',
    boxShadow:        cell.isToday ? '0 0 0 2px var(--color-accent)' : 'none',  
  }
  //Changes tile colour based on how many events are scheduled for that day. 
    
  if(cell.intensity === 0) {
    return { ...base, backgroundColor: 'var(--color-pop)' }
  }
  else if(cell.intensity <= 2){
    return { ...base, backgroundColor: 'color-mix(in srgb, var(--color-ok) 50%, transparent)' }
  }
  else if(cell.intensity <= 4){
    return { ...base, backgroundColor: 'color-mix(in srgb, var(--color-warn) 65%, transparent)' }
  }
  return { ...base, backgroundColor: 'color-mix(in srgb, var(--color-danger) 85%, transparent)' }

}
</script>

<script>
export const widgetMeta = { name: 'Activity Heatmap (PLACEHOLDER)', w: 12, h: 4 }
</script>
