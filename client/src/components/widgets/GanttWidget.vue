<!--
  Static visual placeholder for now . the bars are hardcoded with left/right percentage
  offsets to simulate a timeline. When real data is wired up+ functionality built out these positions
  should be computed from start/end dates relative to the semester span.
-->
<template>
  <div class="h-full flex flex-col pointer-events-auto overflow-hidden">
    <div class="flex justify-between items-start mb-3 shrink-0 gap-3">
      <h3 class="text-lg font-semibold text-body leading-tight">
        {{ isModuleMode ? 'Module Gantt Chart' : 'Study Gantt Overview' }}
      </h3>

      <span v-if="semesterStart && semesterEnd" class="text-[10px] text-dim text-right shrink-0">
        {{ formatDate(semesterStart) }} - {{ formatDate(semesterEnd) }}
      </span>
    </div>

    <div v-if="loading" class="text-sm text-dim text-center py-6">
      Loading Gantt chart...
    </div>

    <div v-else-if="moduleGroups.length === 0" class="text-sm text-dim text-center py-6">
      No tasks or milestones available
    </div>

    <div v-else class="flex-1 overflow-auto pr-2">
      <div class="min-w-[720px] space-y-5">
        <div class="relative h-6 border-b border-pop mb-2">
          <div
            v-for="week in visibleWeekMarkers"
            :key="week.label"
            class="absolute text-[9px] text-ghost -translate-x-1/2"
            :style="{ left: week.left + '%' }"
          >
            {{ week.label }}
          </div>
        </div>

        <div v-for="group in moduleGroups" :key="group.module" class="space-y-3">
          <h4
            v-if="!isModuleMode"
            class="text-sm font-semibold text-body border-b border-pop pb-1"
          >
            {{ group.module }}
          </h4>

          <div
            v-for="item in group.items"
            :key="item.id"
            class="rounded-lg bg-pop/30 p-3 space-y-2"
          >
            <div class="flex justify-between gap-4 text-[11px] font-bold text-ghost uppercase">
              <span class="truncate">{{ item.title }}</span>
              <span class="shrink-0">{{ formatDate(item.start) }} - {{ formatDate(item.end) }}</span>
            </div>

            <div class="h-6 w-full bg-pop rounded-full overflow-hidden relative shadow-inner">
              <div
                class="absolute top-0 bottom-0 bg-primary/35 rounded-full"
                :style="{ left: item.left + '%', width: item.width + '%' }"
              ></div>

              <div
                class="absolute top-0 bottom-0 bg-primary rounded-full"
                :style="{ left: item.left + '%', width: item.progressWidth + '%' }"
              ></div>

              <div
                v-if="item.kind === 'milestone'"
                class="absolute top-0 bottom-0 w-1 bg-yellow-500"
                :style="{ left: item.deadlineLeft + '%' }"
              ></div>

              <div
                v-if="item.deadline"
                class="absolute top-0 bottom-0 w-1 bg-red-500"
                :style="{ left: item.deadlineLeft + '%' }"
              ></div>
            </div>

            <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-dim">
              <span>{{ item.module }}</span>
              <span>{{ item.kindLabel }}</span>
              <span>{{ item.type }}</span>
              <span>{{ item.progress }}% complete</span>
            </div>

            <p v-if="item.dependencies.length" class="text-[10px] text-ghost">
              Depends on: {{ item.dependencies.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'dashboard'
  },
  moduleCode: {
    type: String,
    default: null
  }
})

const loading = ref(true)
const rawItems = ref([])
const ganttItems = ref([])

const semesterStart = ref(null)
const semesterEnd = ref(null)

const isModuleMode = computed(() => props.mode === 'module')

const activeModuleCode = computed(() => {
  return isModuleMode.value ? props.moduleCode : null
})

function authHeaders() {
  const token = localStorage.getItem('token')

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

onMounted(loadGanttData)

watch(
  () => [props.mode, props.moduleCode],
  () => {
    buildGanttItems()
  }
)

async function loadGanttData() {
  try {
    const [profileRes, tasksRes, milestonesRes] = await Promise.all([
      fetch('/api/semester-profile/current', {
        headers: authHeaders()
      }).catch(() => null),

      fetch('/api/tasks', {
        headers: authHeaders()
      }),

      fetch('/api/milestones', {
        headers: authHeaders()
      }).catch(() => null)
    ])

    if (!tasksRes.ok) {
      throw new Error('Failed to load tasks')
    }

    const profile = profileRes && profileRes.ok ? await profileRes.json() : null
    const tasks = await tasksRes.json()
    const milestones = milestonesRes && milestonesRes.ok ? await milestonesRes.json() : []

    rawItems.value = [
      ...tasks.map(task => ({ ...task, kind: 'task' })),
      ...milestones.map(milestone => ({ ...milestone, kind: 'milestone' }))
    ].filter(item => getEndDate(item))

    setSemesterDates(profile, rawItems.value)
    buildGanttItems()
  } catch (err) {
    console.error('Failed to load Gantt chart:', err)
    ganttItems.value = []
  } finally {
    loading.value = false
  }
}

function buildGanttItems() {
  if (!semesterStart.value || !semesterEnd.value) return

  ganttItems.value = rawItems.value
    .filter(item => {
      if (!activeModuleCode.value) return true

      return normaliseModuleCode(getModuleCode(item)) === normaliseModuleCode(activeModuleCode.value)
    })
    .map(mapToGanttItem)
    .sort((a, b) => a.start - b.start)
}

const moduleGroups = computed(() => {
  const groups = {}

  ganttItems.value.forEach(item => {
    if (!groups[item.module]) groups[item.module] = []
    groups[item.module].push(item)
  })

  return Object.entries(groups).map(([module, items]) => ({
    module,
    items
  }))
})

function mapToGanttItem(item) {
  const start = new Date(getStartDate(item))
  const end = new Date(getEndDate(item))
  const deadline = item.deadline ? new Date(item.deadline) : end
  const totalSemesterLength = semesterEnd.value - semesterStart.value
  const progress = calculateProgress(item)

  return {
    id: `${item.kind}-${item.id}`,
    kind: item.kind,
    kindLabel: item.kind === 'milestone' ? 'Milestone' : 'Task',
    title: item.title || item.name || item.description || 'Untitled task',
    module: getModuleCode(item),
    type: item.type || item.task_type || item.kind,
    start,
    end,
    deadline: item.deadline || item.due_date || item.dueDate || null,
    progress,
    dependencies: formatDependencies(item.dependencies || item.dependency_ids || []),
    left: clamp(calculatePosition(start, totalSemesterLength), 0, 100),
    width: clamp(((end - start) / totalSemesterLength) * 100, 2, 100),
    progressWidth: clamp((((end - start) / totalSemesterLength) * 100 * progress) / 100, 0, 100),
    deadlineLeft: clamp(calculatePosition(deadline, totalSemesterLength), 0, 100)
  }
}

function setSemesterDates(profile, items) {
  if (profile?.start_date && profile?.end_date) {
    semesterStart.value = new Date(profile.start_date)
    semesterEnd.value = new Date(profile.end_date)
    return
  }

  const dates = items
    .flatMap(item => [getStartDate(item), getEndDate(item)])
    .filter(Boolean)
    .map(date => new Date(date))
    .filter(date => !Number.isNaN(date.getTime()))

  if (!dates.length) {
    const today = new Date()
    semesterStart.value = today
    semesterEnd.value = today
    return
  }

  semesterStart.value = new Date(Math.min(...dates))
  semesterEnd.value = new Date(Math.max(...dates))
  semesterStart.value.setDate(semesterStart.value.getDate() - 7)
  semesterEnd.value.setDate(semesterEnd.value.getDate() + 7)
}

function getModuleCode(item) {
  return item.module_code || item.moduleCode || item.module || 'No module'
}

function normaliseModuleCode(value) {
  return String(value || '').trim().toUpperCase()
}

function getStartDate(item) {
  if (item.start_date || item.start || item.planned_start) {
    return item.start_date || item.start || item.planned_start
  }

  const startDate = new Date(getEndDate(item))
  startDate.setDate(startDate.getDate() - 7)
  return startDate
}

function getEndDate(item) {
  return item.end_date || item.end || item.deadline || item.due_date || item.dueDate || item.date || item.planned_end
}

function calculatePosition(date, totalSemesterLength) {
  if (!totalSemesterLength) return 0
  return ((date - semesterStart.value) / totalSemesterLength) * 100
}

function calculateProgress(item) {
  if (item.completed === true || item.is_completed === true || item.isComplete === true || item.done === true) {
    return 100
  }

  if (typeof item.progress === 'number') return clamp(item.progress, 0, 100)
  if (item.progress_percent) return clamp(Number(item.progress_percent), 0, 100)

  return 0
}

function formatDependencies(dependencies) {
  if (!Array.isArray(dependencies)) return []

  return dependencies.map(dependency => {
    if (typeof dependency === 'object') {
      return dependency.title || dependency.name || dependency.id
    }

    return dependency
  })
}

const weekMarkers = computed(() => {
  if (!semesterStart.value || !semesterEnd.value) return []

  const markers = []
  const totalSemesterLength = semesterEnd.value - semesterStart.value
  const current = new Date(semesterStart.value)
  let weekNumber = 1

  while (current <= semesterEnd.value) {
    markers.push({
      label: `W${weekNumber}`,
      left: clamp(((current - semesterStart.value) / totalSemesterLength) * 100, 0, 100)
    })

    current.setDate(current.getDate() + 7)
    weekNumber++
  }

  return markers
})

const visibleWeekMarkers = computed(() => {
  if (weekMarkers.value.length <= 8) return weekMarkers.value
  return weekMarkers.value.filter((week, index) => index % 2 === 0)
})

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function formatDate(date) {
  if (!date) return ''

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}
</script>

<script>
export const widgetMeta = {
  name: 'Study Gantt Chart',
  w: 12,
  h: 6
}
</script>