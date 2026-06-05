<!--
  Static visual placeholder for now . the bars are hardcoded with left/right percentage
  offsets to simulate a timeline. When real data is wired up+ functionality built out these positions
  should be computed from start/end dates relative to the semester span.
-->
<template>
  <section class="gantt-card">
    <div class="gantt-header">
      <h2>{{ moduleCode ? `${moduleCode} Gantt Chart` : 'All Modules Gantt Chart' }}</h2>
      <button @click="loadGantt">Refresh</button>
    </div>

    <p v-if="loading">Loading Gantt chart...</p>
    <p v-else-if="error" class="error-box">{{ error }}</p>
    <p v-else-if="visibleItems.length === 0">No tasks or milestones found.</p>

    <div v-else class="gantt-table">
      <div class="gantt-row header">
        <span>Item</span>
        <span>Module</span>
        <span>Timeline</span>
        <span>Date</span>
      </div>

      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="gantt-row"
      >
        <div>
          <strong>{{ item.name }}</strong>
          <small>{{ item.type }}</small>
          <small v-if="item.dependencies?.length">
            Depends on: {{ item.dependencies.join(', ') }}
          </small>
        </div>

        <span>{{ item.moduleCode || '—' }}</span>

        <div class="timeline">
          <div
            class="bar"
            :class="[item.type, item.status]"
            :style="barStyle(item)"
          >
            {{ item.type === 'milestone' ? '◆' : '' }}
          </div>
        </div>

        <span>{{ formatDate(item.start) }} → {{ formatDate(item.end) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  moduleCode: {
    type: String,
    default: null
  },
  userId: {
    type: Number,
    default: 1
  }
})

const items = ref([])
const loading = ref(false)
const error = ref('')
let timer = null

const visibleItems = computed(() => {
  if (!props.moduleCode) return items.value
  return items.value.filter(item => item.moduleCode === props.moduleCode)
})

async function loadGantt() {
  loading.value = true
  error.value = ''

  try {
    let url = `/api/gantt?userId=${props.userId}`

    if (props.moduleCode) {
      url += `&moduleCode=${encodeURIComponent(props.moduleCode)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Could not load Gantt chart: ${response.status}`)
    }

    const data = await response.json()
    items.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[GanttChart] failed:', err)
    error.value = err.message
    items.value = []
  } finally {
    loading.value = false
  }
}

function barStyle(item) {
  if (!visibleItems.value.length) return {}

  const validDates = visibleItems.value
    .map(item => new Date(item.start))
    .filter(date => !Number.isNaN(date.getTime()))

  if (!validDates.length) return {}

  const minDate = new Date(Math.min(...validDates))
  const start = new Date(item.start)
  const end = new Date(item.end || item.start)

  if (Number.isNaN(start.getTime())) return {}

  const daysFromStart = Math.max(
    0,
    Math.floor((start - minDate) / 86400000)
  )

  const duration = Number.isNaN(end.getTime())
    ? 1
    : Math.max(1, Math.floor((end - start) / 86400000) + 1)

  return {
    marginLeft: `${daysFromStart * 30}px`,
    width: item.type === 'milestone' ? '24px' : `${duration * 30}px`
  }
}

function formatDate(date) {
  if (!date) return '—'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short'
  })
}

onMounted(() => {
  loadGantt()
  timer = setInterval(loadGantt, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.gantt-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  color: #0f172a;
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gantt-header h2 {
  margin: 0;
  font-size: 18px;
}

.gantt-header button {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
}

.error-box {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
}

.gantt-table {
  margin-top: 16px;
  overflow-x: auto;
}

.gantt-row {
  display: grid;
  grid-template-columns: 220px 120px minmax(500px, 1fr) 160px;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.gantt-row.header {
  font-weight: bold;
  color: #475569;
}

.gantt-row small {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.timeline {
  height: 28px;
  background: #f1f5f9;
  border-radius: 8px;
}

.bar {
  height: 24px;
  margin-top: 2px;
  border-radius: 6px;
  background: #94a3b8;
  color: white;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
}

.bar.completed {
  background: #22c55e;
}

.bar.in_progress {
  background: #6366f1;
}

.bar.pending {
  background: #94a3b8;
}

.bar.milestone {
  border-radius: 50%;
  background: #f59e0b;
}
</style>
<script>
export const widgetMeta = {
  name: 'Gantt Chart',
  w: 12,
  h: 5
}
</script>