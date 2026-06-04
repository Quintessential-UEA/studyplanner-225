<!-- REQUIREMENTS -->
<!-- 
- DEFAULT: Shows the next 5 upcoming events (lectures, tutorials, workshops, etc.) and tasks (assignments, exams, etc.).
- Must be able to filter by module, or type [show next five tasks, show next five events, show next five deadlines, show next 5 exams]
-->
<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <div class="flex items-center justify-between mb-2 shrink-0">
      <h3 class="text-lg font-semibold text-body">Upcoming</h3>

      <select
        v-model="filter"
        class="text-sm rounded-lg border border-edge bg-card text-body px-2 py-1"
      >
        <option value="all">All</option>
        <option value="event">Events</option>
        <option value="task">Tasks</option>
        <option value="deadline">Deadlines</option>
        <option value="exam">Exams</option>
      </select>
    </div>

    <div class="flex-1 overflow-y-auto border border-edge rounded-xl bg-pop p-3">
      <div v-if="upcoming.length === 0" class="h-full flex items-center justify-center">
        <p class="text-dim text-sm">No upcoming items</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in upcoming"
          :key="item.id"
          class="bg-card border border-edge rounded-lg p-3"
        >
          <div class="flex justify-between gap-2">
            <p class="font-semibold text-body text-sm">{{ item.title }}</p>
            <span class="text-xs text-dim capitalize">{{ item.type }}</span>
          </div>

          <p class="text-xs text-dim mt-1">
            {{ item.module }} • {{ formatDate(item.date) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const filter = ref('all')
const items = ref([])

onMounted(async () => {
  try {
    const [eventsRes, tasksRes, assessmentsRes] = await Promise.all([
      fetch('/api/user-events'),
      fetch('/api/tasks'),
      fetch('/api/assessments')
    ])

    const events = await eventsRes.json()
    const tasks = await tasksRes.json()
    const assessments = await assessmentsRes.json()

    items.value = [
      ...events.map(e => ({
        id: `event-${e.id}`,
        title: e.title,
        module: 'Personal',
        type: 'event',
        date: e.start_time
      })),

      ...tasks.map(t => ({
        id: `task-${t.id}`,
        title: t.title,
        module: t.module_code || 'No module',
        type: 'task',
        date: t.due_date
      })),

      ...assessments.map(a => ({
        id: `assessment-${a.id}`,
        title: a.title,
        module: a.module_code || 'No module',
        type: a.type === 'exam' ? 'exam' : 'deadline',
        date: a.deadline
      }))
    ]
  } catch (err) {
    console.error('Failed to load upcoming items:', err)
  }
})

const upcoming = computed(() => {
  return items.value
    .filter(item => item.date)
    .filter(item => filter.value === 'all' || item.type === filter.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
})

function formatDate(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<script>
export const widgetMeta = {
  name: 'Upcoming Events',
  w: 4,
  h: 3
}
</script>