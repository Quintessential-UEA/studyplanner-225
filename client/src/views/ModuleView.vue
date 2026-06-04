<template>
  <div class="p-6 max-w-7xl mx-auto h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6 shrink-0">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <template v-if="mod">
        <h1 class="text-4xl font-extrabold text-body tracking-tight">{{ mod.title }}</h1>
        <!-- Module badge uses accent tokens (set by setAccent below) -->
        <span
          class="font-bold px-3 py-1 rounded-lg text-sm ml-2 bg-accent-soft text-accent-text"
        >
          {{ mod.code }}
        </span>
      </template>
      <template v-else>
        <h1 class="text-4xl font-extrabold text-body tracking-tight">Loading…</h1>
      </template>
    </div>

    <template v-if="mod">
      <!-- Top Hotbar -->
      <div class="bg-card rounded-2xl shadow-sm border border-edge p-6 mb-6 flex-shrink-0">
        <ModuleHotbarWidget :data="hotbarData" />
      </div>

      <!-- Main Bento Grid -->
      <div class="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[minmax(220px,auto)]">

          <!-- Left Column -->
          <div class="lg:col-span-3 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[300px]">
              <TopicListWidget :data="topicListData" title="Weekly Topics" />
            </div>
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[200px]">
              <ResourcesWidget :data="resourceListData" />
            </div>
          </div>

          <!-- Center Column -->
          <div class="lg:col-span-5 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <TaskManager :hideQuickAdd="false" :moduleCode="mod.code" />
            </div>
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col h-56 shrink-0">
              <HeatmapWidget v-model:viewMode="viewMode" :data="moduleEvents" title="Module Activity" colorScheme="accent" />
            </div>
          </div>

          <!-- Right Column -->
          <div class="lg:col-span-4 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[300px]">
              <GradesWidget :data="gradesData" mode="module" :interactive="false" />
            </div>
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col h-56 shrink-0">
              <GanttWidget />
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>


<!-- IMPORTS -->


<script setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useModuleStore } from '../stores/modules'
import { useTaskStore } from '../stores/tasks'
import { useEventStore } from '../stores/events'
import { useThemeStore } from '../stores/theme'
import TaskManager from '../components/TaskManager.vue'
import HeatmapWidget from '../components/widgets/HeatmapWidget.vue'
import GanttWidget from '../components/widgets/GanttWidget.vue'
import ModuleHotbarWidget from '../components/widgets/ModuleHotbarWidget.vue'
import TopicListWidget from '../components/widgets/TopicListWidget.vue'
import ResourcesWidget from '../components/widgets/ResourcesWidget.vue'
import GradesWidget from '../components/widgets/GradesWidget.vue'

const nav         = useNavigationStore()
const moduleStore = useModuleStore()
const taskStore   = useTaskStore()
const eventStore  = useEventStore()
const theme       = useThemeStore()

const viewMode    = ref('week')


const mod = computed(() => moduleStore.activeModuleDetail)

// Keep accent CSS vars in sync with the active module's theme colour
watch(mod, (m) => {
  theme.setAccent(m?.theme_color || null)
}, { immediate: true })

onUnmounted(() => theme.clearAccent())

onMounted(async () => {
  if (!moduleStore.modules.length) await moduleStore.fetchModules()
  if (!moduleStore.activeModuleDetail && moduleStore.modules.length) {
    await moduleStore.setActiveModule(moduleStore.modules[0].code)
  }
  if (!taskStore.tasks.length) await taskStore.fetchTasks()
  if (!eventStore.events.length) await eventStore.fetchEvents()
})

// ─── Computed props for child widgets ─────────────────────────────────────────

const hotbarData = computed(() => {
  if (!mod.value) return {}
  const moduleTasks = taskStore.tasksByModule(mod.value.code)
  const total       = moduleTasks.length
  const completed   = moduleTasks.filter(t => t.status === 'completed').length
  const currentWeek = mod.value.weekly_topics?.[0]
  const nextEvent   = (mod.value.events || [])
    .filter(e => e.start_time > new Date().toISOString())
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

  return {
    organiser: {
      name:     mod.value.organiser_name || 'TBD',
      initials: mod.value.organiser_name
        ? mod.value.organiser_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?'
    },
    tasks: { total, completed, outstanding: total - completed },
    upcomingEvent: nextEvent
      ? { title: nextEvent.title, type: nextEvent.type, date: new Date(nextEvent.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), icon: nextEvent.type === 'lab' ? 'science' : 'event' }
      : { title: 'None scheduled', type: '', date: '', icon: 'event_busy' },
    academicWeek: currentWeek?.week || 1,
    weeklyFocus:  currentWeek?.topic || 'No topic set',
  }
})

const topicListData = computed(() => {
  if (!mod.value?.weekly_topics) return []
  return mod.value.weekly_topics.map(wt => ({ title: `W${wt.week}: ${wt.topic}`, completed: false }))
})

const resourceListData = computed(() => {
  if (!mod.value?.resources) return []
  return mod.value.resources.map(r => ({ title: r.title, icon: r.type === 'textbook' ? 'book' : 'link', url: r.url }))
})

const gradesData = computed(() => {
  if (!mod.value) return {}
  return {
    code:  mod.value.code,
    exams: (mod.value.assessments || []).map(a => ({ title: a.title, weight: a.weighting, score: null })),
  }
})

const moduleEvents = computed(() =>{
  if(!mod.value) return[]

  const modCode = mod.value.code
  
  return eventStore.events.filter(e => {
    if (e.module_code === modCode) return true

    if (e.source === 'user_event') return true

    if (e.source === 'task' && e.module_code === modCode) return true

    return false
  })
})  
</script>
