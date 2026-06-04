// client/src/stores/events.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

function extractDbId(value) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const lastPart = value.split('-').pop()
    const parsed = Number(lastPart)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (value && typeof value === 'object') {
    if (value.db_id != null) return Number(value.db_id)
    if (typeof value.id === 'string') {
      const lastPart = value.id.split('-').pop()
      const parsed = Number(lastPart)
      return Number.isNaN(parsed) ? null : parsed
    }
    if (typeof value.id === 'number') return value.id
  }

  return null
}

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const loading = ref(false)
  const error = ref('')
  const selectedEvent = ref(null)

  const calendarEvents = computed(() =>
    events.value.map((e) => {
      let bgColor = '#6b7280'
      let textColor = '#ffffff'
      let borderColor = 'transparent'

      if (e.source === 'academic') {
        bgColor = e.theme_color || '#3b82f6'
        if (e.type !== 'lecture') bgColor += 'cc'
      } else if (e.source === 'deadline') {
        bgColor = e.theme_color || '#ef4444'
        borderColor = '#ef4444'
      } else if (e.source === 'user_event') {
        bgColor = (e.color || '#6366f1') + '80'
        textColor = '#f8fafc'
      } else if (e.source === 'task') {
        bgColor = (e.theme_color || '#10b981') + '80'
        textColor = '#f8fafc'
      }

      return {
        id: e.id,
        title: e.module_code ? `[${e.module_code}] ${e.title}` : e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        editable: e.editable,
        durationEditable: e.source === 'user_event' || e.source === 'task',
        backgroundColor: bgColor,
        borderColor: borderColor !== 'transparent' ? borderColor : bgColor,
        textColor,
        classNames: [],
        extendedProps: { ...e },
      }
    })
  )

  const upcomingEvent = computed(() => {
    const now = new Date().toISOString()

    const future = events.value
      .filter((event) => event.start > now && event.source !== 'deadline')
      .sort((a, b) => a.start.localeCompare(b.start))

    return future[0] || null
  })

  async function fetchEvents() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await api.get('/calendar')
      events.value = data
    } catch (err) {
      error.value =
        err.response?.data?.error ||
        err.message ||
        'Failed to fetch calendar events'
      console.error('Failed to fetch calendar events:', err)
    } finally {
      loading.value = false
    }
  }

  async function createUserEvent(eventData) {
    try {
      await api.post('/user-events', eventData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to create user event:', err)
      throw err
    }
  }

  async function updateUserEvent(id, eventData) {
    const dbId = extractDbId(id)

    if (!dbId) {
      throw new Error('Invalid user event id')
    }

    try {
      await api.put(`/user-events/${dbId}`, eventData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to update user event:', err)
      throw err
    }
  }

  async function deleteUserEvent(id) {
    const dbId = extractDbId(id)

    if (!dbId) {
      throw new Error('Invalid user event id')
    }

    try {
      await api.delete(`/user-events/${dbId}`)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to delete user event:', err)
      throw err
    }
  }

  async function scheduleTask(id, scheduleData) {
    const taskId = extractDbId(id)

    if (!taskId) {
      throw new Error('Invalid task id')
    }

    try {
      await api.patch(`/tasks/${taskId}/schedule`, scheduleData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to schedule task:', err)
      throw err
    }
  }

  async function unscheduleTask(id) {
    const taskId = extractDbId(id)

    if (!taskId) {
      throw new Error('Invalid task id')
    }

    try {
      await api.delete(`/tasks/${taskId}/schedule`)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to unschedule task:', err)
      throw err
    }
  }

  function setSelectedEvent(event) {
    selectedEvent.value = event ?? null
  }

  function clear() {
    events.value = []
    selectedEvent.value = null
    error.value = ''
  }

  return {
    events,
    loading,
    error,
    selectedEvent,
    calendarEvents,
    upcomingEvent,
    fetchEvents,
    createUserEvent,
    updateUserEvent,
    deleteUserEvent,
    scheduleTask,
    unscheduleTask,
    setSelectedEvent,
    clear,
  }
})