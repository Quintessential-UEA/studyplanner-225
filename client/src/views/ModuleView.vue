<template>
  <div class="p-6 max-w-7xl mx-auto h-full flex flex-col">
    <div class="flex items-center gap-4 mb-6 shrink-0">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>

      <template v-if="mod">
        <h1 class="text-4xl font-extrabold text-body tracking-tight">
          {{ mod.title }}
        </h1>

        <span class="font-bold px-3 py-1 rounded-lg text-sm ml-2 bg-accent-soft text-accent-text">
          {{ mod.code }}
        </span>
      </template>

      <template v-else>
        <h1 class="text-4xl font-extrabold text-body tracking-tight">
          Loading…
        </h1>
      </template>
    </div>

    <template v-if="mod">
      <div class="bg-card rounded-2xl shadow-sm border border-edge p-6 mb-6 flex-shrink-0">
        <ModuleHotbarWidget :data="hotbarData" />
      </div>

      <div class="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[minmax(220px,auto)]">
          <div class="lg:col-span-3 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[300px]">
              <TopicListWidget :data="topicListData" title="Weekly Topics" />
            </div>

            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[200px]">
              <ResourcesWidget :data="resourceListData" />
            </div>
          </div>

          <div class="lg:col-span-5 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge overflow-hidden flex flex-col flex-1 min-h-[320px]">
              <TaskManager :hideQuickAdd="false" :moduleCode="mod.code" />
            </div>

            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col min-h-[250px]">
              <h2 class="text-base font-bold text-body mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-accent-text text-[20px]">assignment</span>
                Assessment Planner
              </h2>

              <div v-if="assessmentPlannerRows.length" class="space-y-3">
                <div
                  v-for="row in assessmentPlannerRows"
                  :key="row.id"
                  class="bg-pop rounded-xl border border-edge p-4"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-body truncate">
                        {{ row.title }}
                      </p>

                      <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span class="text-[10px] font-bold bg-accent-soft text-accent-text px-1.5 py-0.5 rounded uppercase">
                          {{ row.weighting }}%
                        </span>

                        <span class="text-[10px] font-bold bg-primary-soft text-primary-text px-1.5 py-0.5 rounded">
                          {{ row.taskCount }} tasks
                        </span>

                        <span class="text-[10px] font-bold bg-warn-soft text-warn-text px-1.5 py-0.5 rounded">
                          {{ row.milestoneCount }} milestones
                        </span>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <p class="text-[11px] uppercase tracking-wider text-ghost font-bold">
                        Due
                      </p>
                      <p class="text-sm font-semibold text-body">
                        {{ row.deadlineLabel }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-3">
                    <div class="h-2 rounded-full bg-card overflow-hidden">
                      <div
                        class="h-full rounded-full bg-accent transition-all duration-300"
                        :style="{ width: `${row.progressPercent}%` }"
                      ></div>
                    </div>

                    <div class="mt-2 flex justify-between items-center text-[11px] text-ghost font-medium">
                      <span>{{ row.completedTaskCount }}/{{ row.taskCount || 0 }} tasks completed</span>
                      <span>{{ row.progressPercent }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="flex-1 flex items-center justify-center text-sm text-dim font-medium">
                No assessment planning data yet.
              </div>
            </div>

            <MilestoneManager :moduleCode="mod.code" />
            <DependencyManager :moduleCode="mod.code" />
          </div>

          <div class="lg:col-span-4 flex flex-col gap-6">
            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5">
              <h2 class="text-base font-bold text-body mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-accent-text text-[20px]">overview</span>
                Module Planning Summary
              </h2>

              <div class="grid grid-cols-2 gap-3">
                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Tasks
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleTaskStats.total }}
                  </p>
                </div>

                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Completed
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleTaskStats.completed }}
                  </p>
                </div>

                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Milestones
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleMilestones.length }}
                  </p>
                </div>

                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Dependencies
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleDependencyCount }}
                  </p>
                </div>

                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Activities
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleActivityCount }}
                  </p>
                </div>

                <div class="bg-pop rounded-xl p-4 border border-edge">
                  <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                    Upcoming
                  </p>
                  <p class="text-2xl font-extrabold text-body">
                    {{ moduleTaskStats.upcoming }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col flex-1 min-h-[300px]">
              <GradesWidget :data="gradesData" mode="module" :interactive="false" />
            </div>

            <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col h-56 shrink-0">
              <HeatmapWidget title="Module Activity" colorScheme="accent" />
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

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useModuleStore } from '../stores/modules'
import { useTaskStore } from '../stores/tasks'
import { useEventStore } from '../stores/events'
import { useThemeStore } from '../stores/theme'
import TaskManager from '../components/TaskManager.vue'
import MilestoneManager from '../components/MilestoneManager.vue'
import DependencyManager from '../components/DependencyManager.vue'
import HeatmapWidget from '../components/widgets/HeatmapWidget.vue'
import GanttWidget from '../components/widgets/GanttWidget.vue'
import ModuleHotbarWidget from '../components/widgets/ModuleHotbarWidget.vue'
import TopicListWidget from '../components/widgets/TopicListWidget.vue'
import ResourcesWidget from '../components/widgets/ResourcesWidget.vue'
import GradesWidget from '../components/widgets/GradesWidget.vue'

const nav = useNavigationStore()
const moduleStore = useModuleStore()
const taskStore = useTaskStore()
const eventStore = useEventStore()
const theme = useThemeStore()

const mod = computed(() => moduleStore.activeModuleDetail)

watch(
  mod,
  (m) => {
    theme.setAccent(m?.theme_color || null)
  },
  { immediate: true }
)

onUnmounted(() => theme.clearAccent())

onMounted(async () => {
  if (!moduleStore.modules.length) {
    await moduleStore.fetchModules()
  }

  if (!moduleStore.activeModuleDetail && moduleStore.modules.length) {
    await moduleStore.setActiveModule(moduleStore.modules[0].code)
  }

  await Promise.allSettled([
    taskStore.fetchTasks(),
    taskStore.fetchMilestones(),
    taskStore.fetchDependencies(),
    taskStore.fetchActivities(),
    eventStore.fetchEvents(),
  ])
})

function formatDate(value) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString()
}

const moduleTasks = computed(() => {
  if (!mod.value) return []
  return taskStore.tasksByModule(mod.value.code)
})

const moduleAssessmentIds = computed(() => {
  return new Set((mod.value?.assessments || []).map((assessment) => assessment.id))
})

const moduleMilestones = computed(() => {
  return taskStore.milestones.filter((milestone) =>
    moduleAssessmentIds.value.has(milestone.assessment_id)
  )
})

const moduleTaskIds = computed(() => {
  return new Set(moduleTasks.value.map((task) => task.id))
})

const moduleDependencyCount = computed(() => {
  return taskStore.dependencies.filter(
    (dependency) =>
      moduleTaskIds.value.has(dependency.task_id) ||
      moduleTaskIds.value.has(dependency.depends_on_task_id)
  ).length
})

const moduleActivityCount = computed(() => {
  return taskStore.activities.filter((activity) =>
    moduleTaskIds.value.has(activity.task_id)
  ).length
})

const moduleTaskStats = computed(() => {
  const now = new Date()

  const completed = moduleTasks.value.filter((task) => task.status === 'completed').length
  const upcoming = moduleTasks.value.filter((task) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) >= now
  }).length

  return {
    total: moduleTasks.value.length,
    completed,
    upcoming,
  }
})

const hotbarData = computed(() => {
  if (!mod.value) return {}

  const total = moduleTasks.value.length
  const completed = moduleTasks.value.filter((task) => task.status === 'completed').length
  const currentWeek = mod.value.weekly_topics?.[0]

  const nextEvent = (mod.value.events || [])
    .filter((event) => event.start_time > new Date().toISOString())
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

  return {
    organiser: {
      name: mod.value.organiser_name || 'TBD',
      initials: mod.value.organiser_name
        ? mod.value.organiser_name
            .split(' ')
            .map((name) => name[0])
            .join('')
            .toUpperCase()
        : '?',
    },
    tasks: {
      total,
      completed,
      outstanding: total - completed,
    },
    upcomingEvent: nextEvent
      ? {
          title: nextEvent.title,
          type: nextEvent.type,
          date: new Date(nextEvent.start_time).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
          icon: nextEvent.type === 'lab' ? 'science' : 'event',
        }
      : {
          title: 'None scheduled',
          type: '',
          date: '',
          icon: 'event_busy',
        },
    academicWeek: currentWeek?.week || 1,
    weeklyFocus: currentWeek?.topic || 'No topic set',
  }
})

const topicListData = computed(() => {
  if (!mod.value?.weekly_topics) return []

  return mod.value.weekly_topics.map((topic) => ({
    title: `W${topic.week}: ${topic.topic}`,
    completed: false,
  }))
})

const resourceListData = computed(() => {
  if (!mod.value?.resources) return []

  return mod.value.resources.map((resource) => ({
    title: resource.title,
    icon: resource.type === 'textbook' ? 'book' : 'link',
    url: resource.url,
  }))
})

const gradesData = computed(() => {
  if (!mod.value) return {}

  return {
    code: mod.value.code,
    exams: (mod.value.assessments || []).map((assessment) => ({
      title: assessment.title,
      weight: assessment.weighting,
      score: null,
    })),
  }
})

const assessmentPlannerRows = computed(() => {
  if (!mod.value?.assessments) return []

  return mod.value.assessments.map((assessment) => {
    const assessmentTasks = taskStore.tasksByAssessment(assessment.id)
    const assessmentMilestones = taskStore.milestonesByAssessment(assessment.id)

    const completedTaskCount = assessmentTasks.filter(
      (task) => task.status === 'completed'
    ).length

    const progressPercent =
      assessmentTasks.length > 0
        ? Math.round((completedTaskCount / assessmentTasks.length) * 100)
        : 0

    return {
      id: assessment.id,
      title: assessment.title,
      weighting: assessment.weighting ?? 0,
      deadlineLabel: formatDate(assessment.deadline),
      taskCount: assessmentTasks.length,
      milestoneCount: assessmentMilestones.length,
      completedTaskCount,
      progressPercent,
    }
  })
})
</script>