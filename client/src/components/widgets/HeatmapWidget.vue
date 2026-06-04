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
        </div>
    </div>

    <div class="relative flex-1 min-h-0 overflow-visible" ref="containerRef">
      <div class="w-full h-full" :style="gridStyle">
      <div v-for="(cell, index) in cellDisplay" :key="index"
       class="rounded-[3px] transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-sm"
       :style="cellStyle(cell)"
       :title="`Value: ${cell.intensity}`"
      >
      <span class="text-[20px] border-10px font-medium select-none" style="color: var(--color-body)">
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

const COLS = computed(() => {
  if(localViewMode.value === 'week') return 7
  if(localViewMode.value === 'day') return 8
  return 7
})

const cellSize = computed(() => {
  const count = cellDisplay.value.length
  if(!count || !containerWidth.value || !containerHeight.value) return 0

  const cols  = COLS.value
  const rows  = Math.ceil(count/cols)
  const gap   = 30
  

  const cellW = (containerWidth.value - gap * (cols - 1)) / cols
  const cellH = (containerHeight.value - gap * (rows - 1)) / rows
  return {w: Math.floor(cellW), h: Math.floor(cellH)}
})

const gridStyle = computed(() => {
  if(!cellSize.value.w) return {}

  const cols      = COLS.value
  const gap       = 30
  const rowWidth  = cols * cellSize.value.w + (cols - 1) * gap

  return {
    display:        'flex',
    flexWrap:       'wrap',
    justifyContent: 'center',
    alignContent:   'center',
    gap:            `${gap}px`,
    width:          `${rowWidth}px`,
    height:         '100%',
    margin:         '0 auto',

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

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100 
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

//Get view by day/week/ 
  const addDayRange = (start, end) => {
    for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
    const key = d.toISOString().slice(0, 10)
    result.push({ label: getOrdinal(d.getDate()), intensity: map.get(key) || 0,
    isToday: d.toDateString() === now.toDateString()})
    }
  }
 
   if(localViewMode.value === 'week'){
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
      const label = h === 0 ? '12:00 am' : h < 12 ? `${h}:00 am` : h === 12 ?'12:00 pm' : `${h - 12}:00 pm`
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
  const { w, h } = cellSize.value
  const base = {
    width:            w + 'px',
    height:           h + 'px',
    flexShrink:       0,
    display:          'flex',
    alignItems:       'center',
    justifyContent:   'center',
    boxShadow:        cell.isToday ? '0 0 0 2px var(--color-accent)' : 'none',  
  }
  //Changes tile colour based on how many events are scheduled for that day. 
    
  if(cell.intensity === 0) {
    return { ...base, backgroundColor: 'var(--color-ok)' }
  }
  else if(cell.intensity <= 2){
    return { ...base, backgroundColor: 'color-mix(in srgb, var(--color-warn) 50%, transparent)' }
  }
  else if(cell.intensity <= 4){
    return { ...base, backgroundColor: 'color-mix(in srgb, var(--color-danger) 75%, transparent)' }
  }
}
</script>

<script>
export const widgetMeta = { name: 'Activity Heatmap', w: 12, h: 4 }
</script>
