// ─── src/stores/events.js ────────────────────────────────────────────────────
// Pinia store for the calendar.
// Fetches all events (academic, deadlines, user events, tasks) from /api/calendar.
// ──────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useEventStore = defineStore('events', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const events = ref([])
  const loading = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────

  /** Events formatted for FullCalendar */
  const calendarEvents = computed(() =>
    events.value.map(e => {
      // Colour logic:
      // - Lectures: full opacity module color
      // - Labs/etc: 80% opacity module color ('cc')
      // - Deadlines: full opacity module color + red text? Or just module color.
      // - User Events: 50% opacity ('80') of their chosen color
      // - Tasks: 50% opacity ('80') of module color (if any) or default

      let bgColor = '#6b7280' // default gray
      let textColor = '#ffffff'
      let borderColor = 'transparent'
      let classNames = []

      if (e.source === 'academic') {
        bgColor = e.theme_color || '#3b82f6'
        if (e.type !== 'lecture') {
          bgColor += 'cc' // 80% opacity for non-lectures
        }
      } else if (e.source === 'deadline') {
        bgColor = e.theme_color || '#ef4444'
        borderColor = '#ef4444' // red border to highlight
      } else if (e.source === 'user_event') {
        bgColor = (e.color || '#6366f1') + '80' // 50% opacity
        textColor = '#f8fafc' // slate-50
      } else if (e.source === 'task') {
        bgColor = (e.theme_color || '#10b981') + '80' // 50% opacity
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
        textColor: textColor,
        classNames,
        extendedProps: { ...e },
      }
    })
  )

  /** Next upcoming event from now */
  const upcomingEvent = computed(() => {
    const now = new Date().toISOString()
    const future = events.value
      .filter(e => e.start > now && e.source !== 'deadline')
      .sort((a, b) => a.start.localeCompare(b.start))
    return future[0] || null
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Fetch the unified calendar feed */
  async function fetchEvents() {
    loading.value = true
    try {
      const { data } = await api.get('/calendar')
      events.value = data
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    } finally {
      loading.value = false
    }
  }

  /** Create a user event */
  async function createUserEvent(eventData) {
    try {
      await api.post('/user-events', eventData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to create user event:', err)
      throw err
    }
  }

  /** Update a user event */
  async function updateUserEvent(id, eventData) {
    try {
      await api.put(`/user-events/${id}`, eventData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to update user event:', err)
      throw err
    }
  }

  /** Delete a user event */
  async function deleteUserEvent(id) {
    try {
      await api.delete(`/user-events/${id}`)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to delete user event:', err)
      throw err
    }
  }

  /** Schedule a task via drag-and-drop */
  async function scheduleTask(id, scheduleData) {
    try {
      await api.patch(`/tasks/${id}/schedule`, scheduleData)
      await fetchEvents()
    } catch (err) {
      console.error('Failed to schedule task:', err)
      throw err
    }
  }

  return {
    events, loading, calendarEvents, upcomingEvent,
    fetchEvents, createUserEvent, updateUserEvent, deleteUserEvent, scheduleTask
  }
})
