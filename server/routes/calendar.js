// ─── server/routes/calendar.js ───────────────────────────────────────────────
// Aggregate calendar endpoint. Merges ALL calendar-visible items into a single
// response so the frontend can render them in one FullCalendar instance.
//
// Sources:
//   1. Academic events   (events table)        source: 'academic',   editable: false
//   2. Assessment deadlines (assessments)      source: 'deadline',   editable: false
//   3. User events       (user_events table)   source: 'user_event', editable: true
//   4. Scheduled tasks   (tasks table)         source: 'task',       editable: true
//
// Endpoint:
//   GET /api/calendar : unified calendar feed
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { getEventsForUser } from '../db/dal/events.js'
import { getAssessmentsForUser } from '../db/dal/assessments.js'
import { getUserEvents } from '../db/dal/user_events.js'
import { getScheduledTasks } from '../db/dal/tasks.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/calendar : unified calendar items
router.get('/', (req, res) => {
  // 1. Academic events (locked)
  const academicEvents = getEventsForUser(USER_ID).map(e => ({
    id: `academic-${e.id}`,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    source: 'academic',
    editable: false,
    type: e.type,
    location: e.location,
    module_code: e.module_code,
    module_title: e.module_title,
    theme_color: e.theme_color,
    notes: e.notes,
    is_recurring: e.is_recurring,
    recurrence_pattern: e.recurrence_pattern,
    recurrence_end_date: e.recurrence_end_date,
    is_mandatory: e.is_mandatory,
  }))

  // 2. Assessment deadlines (locked)
  const deadlines = getAssessmentsForUser(USER_ID)
    .filter(a => a.deadline)
    .map(a => ({
      id: `deadline-${a.id}`,
      title: `${a.title}`,
      start: a.deadline,
      end: null,
      allDay: true,
      source: 'deadline',
      editable: false,
      type: a.type,
      module_code: a.module_code,
      module_title: a.module_title,
      theme_color: a.theme_color,
      weighting: a.weighting,
    }))

  // 3. User events (editable)
  const userEvents = getUserEvents(USER_ID).map(e => ({
    id: `user-${e.id}`,
    db_id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    allDay: !!e.is_all_day,
    source: 'user_event',
    editable: true,
    color: e.color,
    location: e.location,
    description: e.description,
    is_recurring: e.is_recurring,
    recurrence_pattern: e.recurrence_pattern,
    recurrence_end_date: e.recurrence_end_date,
  }))

  // 4. Scheduled tasks (editable / draggable)
  const scheduledTasks = getScheduledTasks(USER_ID).map(t => {
    // Build start datetime from scheduled_date + optional time
    let start = t.scheduled_date
    if (t.scheduled_start_time) {
      start = `${t.scheduled_date}T${t.scheduled_start_time}`
    }
    // Calculate end from duration
    let end = null
    if (t.scheduled_start_time && t.scheduled_duration) {
      const [h, m] = t.scheduled_start_time.split(':').map(Number)
      const endMinutes = h * 60 + m + t.scheduled_duration
      const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
      const endM = String(endMinutes % 60).padStart(2, '0')
      end = `${t.scheduled_date}T${endH}:${endM}`
    }

    return {
      id: `task-${t.id}`,
      db_id: t.id,
      title: `${t.title}`,
      start,
      end,
      allDay: !t.scheduled_start_time,
      source: 'task',
      editable: true,
      module_code: t.module_code,
      module_title: t.module_title,
      theme_color: t.theme_color,
      status: t.status,
      due_date: t.due_date,
    }
  })

  res.json([...academicEvents, ...deadlines, ...userEvents, ...scheduledTasks])
})

export default router
