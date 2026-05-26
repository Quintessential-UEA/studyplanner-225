<template>
  <div class="p-6 h-full flex flex-col relative pointer-events-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6 shrink-0">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <h1 class="text-3xl font-extrabold text-body tracking-tight">Calendar</h1>
    </div>

    <!-- Main Layout -->
    <div class="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
      <!-- FullCalendar (Left) -->
      <div class="bg-card rounded-2xl shadow-sm border border-edge p-4 flex-1 min-w-0 min-h-[500px] flex flex-col">
        <FullCalendar
          ref="calendarRef"
          :options="calendarOptions"
          class="flex-1 min-h-0 calendar-host"
        />
      </div>

      <!-- Task Manager (Right) -->
      <div class="w-full lg:w-96 shrink-0 h-[500px] lg:h-auto lg:min-h-0 task-manager-container">
        <TaskManager />
      </div>
    </div>

    <!-- Event Form Modal (create) -->
    <div
      v-if="isCreateModalOpen"
      class="absolute inset-0 bg-black/20 z-10 flex items-center justify-center p-6 backdrop-blur-sm"
      @click.self="closeCreateModal"
    >
      <div class="w-full max-w-md">
        <EventFormWidget :initialDate="selectedDate" :onClose="closeCreateModal" />
      </div>
    </div>

    <!-- Event Details Modal -->
    <div
      v-if="isDetailsOpen"
      class="absolute inset-0 bg-black/20 z-10 flex items-center justify-center p-6 backdrop-blur-sm"
      @click.self="closeDetails"
    >
      <div class="w-full max-w-md bg-card rounded-2xl shadow-xl border border-edge p-6">
        <div class="flex items-start gap-3 mb-4">
          <span
            class="w-3 h-3 rounded-full mt-2 shrink-0"
            :style="{ backgroundColor: selectedEvent?.color || '#3b82f6' }"
          ></span>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-body break-words">
              {{ selectedEvent?.title || '(untitled)' }}
            </h2>
            <p class="text-sm text-dim mt-1">{{ detailsTimeLabel }}</p>
          </div>
          <button
            @click="closeDetails"
            class="p-1 rounded-full hover:bg-pop text-dim"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div v-if="selectedEvent?.notes" class="text-sm text-body mb-4 whitespace-pre-wrap">
          {{ selectedEvent.notes }}
        </div>

        <div class="text-xs text-dim mb-5 space-y-1">
          <div v-if="selectedEvent?.source">
            <span class="uppercase tracking-wide">Source:</span> {{ selectedEvent.source }}
          </div>
          <div v-if="selectedEvent?.allDay">All-day event</div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            v-if="canDelete"
            @click="deleteSelectedEvent"
            class="px-3 py-1.5 text-sm rounded-md text-red-500 hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            @click="closeDetails"
            class="px-3 py-1.5 text-sm rounded-md border border-edge hover:bg-pop text-body"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useEventStore } from '../stores/events'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import TaskManager from '../components/TaskManager.vue'
import EventFormWidget from '../components/widgets/EventFormWidget.vue'

const nav        = useNavigationStore()
const eventStore = useEventStore()

const calendarRef = ref(null)

// ---- Create modal ----
const isCreateModalOpen = ref(false)
const selectedDate = ref(null)

// ---- Details modal ----
const isDetailsOpen = ref(false)
const selectedEvent = ref(null)

let draggableInstance = null

// Keyboard ESC fallback
const handleKey = (e) => {
  if (e.key === 'Escape') {
    if (isDetailsOpen.value) closeDetails()
    else if (isCreateModalOpen.value) closeCreateModal()
  }
}

onMounted(async () => {
  if (!eventStore.events.length) await eventStore.fetchEvents()

  // External draggable tasks
  const containerEl = document.querySelector('.task-manager-container')
  if (containerEl) {
    draggableInstance = new Draggable(containerEl, {
      itemSelector: '.draggable-task',
      eventData: function (eventEl) {
        return {
          title: `✅ ${eventEl.dataset.title}`,
          id: `task-${eventEl.dataset.taskId}`,
          backgroundColor: eventEl.dataset.color,
          borderColor: eventEl.dataset.color,
          textColor: '#f8fafc',
          duration: '01:00'
        }
      }
    })
  }

  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  if (draggableInstance) draggableInstance.destroy()
  window.removeEventListener('keydown', handleKey)
})

// ---------- Modal handlers ----------
const closeCreateModal = () => {
  isCreateModalOpen.value = false
  selectedDate.value = null
}

const closeDetails = () => {
  isDetailsOpen.value = false
  selectedEvent.value = null
}

const canDelete = computed(() => {
  const src = selectedEvent.value?.source
  return src === 'user_event' || (selectedEvent.value?.id || '').startsWith('task-')
})

const detailsTimeLabel = computed(() => {
  const ev = selectedEvent.value
  if (!ev) return ''
  if (ev.allDay) {
    return ev.start
      ? new Date(ev.start).toLocaleDateString(undefined, {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        })
      : ''
  }
  const start = ev.start ? new Date(ev.start) : null
  const end   = ev.end   ? new Date(ev.end)   : null
  if (!start) return ''
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  })
  const timeOpts = { hour: 'numeric', minute: '2-digit' }
  const startStr = start.toLocaleTimeString(undefined, timeOpts)
  const endStr   = end ? end.toLocaleTimeString(undefined, timeOpts) : ''
  return end ? `${dateStr} · ${startStr} – ${endStr}` : `${dateStr} · ${startStr}`
})

async function deleteSelectedEvent() {
  const ev = selectedEvent.value
  if (!ev) return
  try {
    if ((ev.id || '').startsWith('task-')) {
      const taskId = ev.id.replace('task-', '')
      // Adjust this to match your store's unschedule API
      if (typeof eventStore.unscheduleTask === 'function') {
        await eventStore.unscheduleTask(taskId)
      } else {
        await eventStore.scheduleTask(taskId, {
          scheduled_date: null,
          scheduled_start_time: null,
          scheduled_duration: null
        })
      }
    } else if (ev.source === 'user_event' && ev.db_id != null) {
      if (typeof eventStore.deleteUserEvent === 'function') {
        await eventStore.deleteUserEvent(ev.db_id)
      }
    }
  } finally {
    closeDetails()
  }
}

// ---------- Day-click: month -> week with highlighted day ----------
const handleDateClick = (info) => {
  const api = calendarRef.value?.getApi?.()
  const currentView = api?.view?.type
  if (currentView === 'dayGridMonth' && api) {
    api.changeView('timeGridWeek', info.date)
    nextTick(() => highlightDay(info.dateStr))
    return
  }
  selectedDate.value = info.dateStr
  isCreateModalOpen.value = true
}

function highlightDay(dateStr) {
  document.querySelectorAll('.fc-day-selected').forEach(el => {
    el.classList.remove('fc-day-selected')
  })
  document.querySelectorAll(`.fc-day[data-date="${dateStr}"]`).forEach(el => {
    el.classList.add('fc-day-selected')
  })
}

// ---------- Existing drop / resize / receive handlers ----------
const handleEventDrop = async (info) => {
  const event = info.event
  const source = event.extendedProps?.source

  if (event.id.startsWith('task-')) {
    const taskId = event.id.replace('task-', '')
    let startTime = null
    let duration = 60
    if (!event.allDay && event.start) {
      startTime = event.start.toISOString().substring(11, 16)
      if (event.end) {
        duration = (event.end.getTime() - event.start.getTime()) / 60000
      }
    }
    const dateStr = event.start.toISOString().substring(0, 10)
    await eventStore.scheduleTask(taskId, {
      scheduled_date: dateStr,
      scheduled_start_time: startTime,
      scheduled_duration: duration
    })
  } else if (source === 'user_event') {
    const startStr = event.start.toISOString()
    const endStr = event.end ? event.end.toISOString() : null
    await eventStore.updateUserEvent(event.extendedProps.db_id, {
      start_time: startStr,
      end_time: endStr,
      is_all_day: event.allDay ? 1 : 0,
      title: event.title,
      color: event.extendedProps.color
    })
  } else {
    info.revert()
  }
}

const handleEventResize = async (info) => {
  const event = info.event
  const source = event.extendedProps?.source

  if (event.id.startsWith('task-')) {
    const taskId = event.id.replace('task-', '')
    let duration = 60
    if (event.end) {
      duration = (event.end.getTime() - event.start.getTime()) / 60000
    }
    const startTime = event.start.toISOString().substring(11, 16)
    const dateStr = event.start.toISOString().substring(0, 10)
    await eventStore.scheduleTask(taskId, {
      scheduled_date: dateStr,
      scheduled_start_time: startTime,
      scheduled_duration: duration
    })
  } else if (source === 'user_event') {
    const startStr = event.start.toISOString()
    const endStr = event.end ? event.end.toISOString() : null
    await eventStore.updateUserEvent(event.extendedProps.db_id, {
      start_time: startStr,
      end_time: endStr,
      is_all_day: event.allDay ? 1 : 0,
      title: event.title,
      color: event.extendedProps.color
    })
  }
}

const handleEventReceive = async (info) => {
  const el = info.draggedEl
  const taskId = el.dataset.taskId
  if (!taskId) return

  const start = info.event.start
  let startTime = null
  let duration = 60
  if (!info.event.allDay) {
    startTime = start.toISOString().substring(11, 16)
    if (info.event.end) {
      duration = (info.event.end.getTime() - start.getTime()) / 60000
    }
  }
  const dateStr = start.toISOString().substring(0, 10)

  // Remove temp event; store re-fetch paints the real one
  info.event.remove()

  await eventStore.scheduleTask(taskId, {
    scheduled_date: dateStr,
    scheduled_start_time: startTime,
    scheduled_duration: duration
  })
}

// Event click: open details modal
const handleEventClick = (info) => {
  const e = info.event
  selectedEvent.value = {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    color: e.backgroundColor || e.extendedProps?.color,
    source: e.extendedProps?.source,
    db_id: e.extendedProps?.db_id,
    notes: e.extendedProps?.notes || e.extendedProps?.description
  }
  isDetailsOpen.value = true
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left:   'prev,next today',
    center: 'title',
    right:  'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: eventStore.calendarEvents,
  height: '100%',
  expandRows: true,
  editable: true,
  droppable: true,
  nowIndicator: true,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  eventReceive: handleEventReceive,
  dateClick: handleDateClick,
  eventClick: handleEventClick
}))
</script>

<style scoped>
/* Make sure FC actually fills the flex parent. bbbroken */
.calendar-host :deep(.fc) {
  height: 100%;
}
.calendar-host :deep(.fc-view-harness) {
  flex: 1 1 auto;
}

/* Highlight the day that was clicked-through from month view. works mostly */
.calendar-host :deep(.fc-day-selected) {
  background-color: rgba(59, 130, 246, 0.12);
}
.calendar-host :deep(.fc-day-selected .fc-daygrid-day-number),
.calendar-host :deep(.fc-day-selected .fc-col-header-cell-cushion) {
  color: rgb(59, 130, 246);
  font-weight: 600;
}
</style>


<!-- NOTE
I am having a horrible time with this so if anyone has any improvements feel free to gut this mess
-->