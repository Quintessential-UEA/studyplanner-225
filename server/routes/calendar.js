// server/routes/calendar.js
import express from 'express'
import { getEventsForUser } from '../db/dal/events.js'
import { getAssessmentsForUser } from '../db/dal/assessments.js'
import { getUserEvents } from '../db/dal/user_events.js'
import { getScheduledTasks } from '../db/dal/tasks.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  const academicEvents = getEventsForUser(req.userId).map((event) => ({
    id: `academic-${event.id}`,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    source: 'academic',
    editable: false,
    type: event.type,
    location: event.location,
    module_code: event.module_code,
    module_title: event.module_title,
    theme_color: event.theme_color,
    notes: event.notes,
    is_recurring: event.is_recurring,
    recurrence_pattern: event.recurrence_pattern,
    recurrence_end_date: event.recurrence_end_date,
    is_mandatory: event.is_mandatory,
  }))

  const deadlines = getAssessmentsForUser(req.userId)
    .filter((assessment) => assessment.deadline)
    .map((assessment) => ({
      id: `deadline-${assessment.id}`,
      title: assessment.title,
      start: assessment.deadline,
      end: null,
      allDay: true,
      source: 'deadline',
      editable: false,
      type: assessment.type,
      module_code: assessment.module_code,
      module_title: assessment.module_title,
      theme_color: assessment.theme_color,
      weighting: assessment.weighting,
    }))

  const userEvents = getUserEvents(req.userId).map((event) => ({
    id: `user-${event.id}`,
    db_id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    allDay: !!event.is_all_day,
    source: 'user_event',
    editable: true,
    color: event.color,
    location: event.location,
    description: event.description,
    is_recurring: event.is_recurring,
    recurrence_pattern: event.recurrence_pattern,
    recurrence_end_date: event.recurrence_end_date,
  }))

  const scheduledTasks = getScheduledTasks(req.userId).map((task) => {
    let start = task.scheduled_date

    if (task.scheduled_start_time) {
      start = `${task.scheduled_date}T${task.scheduled_start_time}`
    }

    let end = null

    if (task.scheduled_start_time && task.scheduled_duration) {
      const [hours, minutes] = task.scheduled_start_time.split(':').map(Number)
      const endMinutes = hours * 60 + minutes + task.scheduled_duration
      const endHours = String(Math.floor(endMinutes / 60)).padStart(2, '0')
      const endMins = String(endMinutes % 60).padStart(2, '0')
      end = `${task.scheduled_date}T${endHours}:${endMins}`
    }

    return {
      id: `task-${task.id}`,
      db_id: task.id,
      title: task.title,
      start,
      end,
      allDay: !task.scheduled_start_time,
      source: 'task',
      editable: true,
      module_code: task.module_code,
      module_title: task.module_title,
      theme_color: task.theme_color,
      status: task.status,
      due_date: task.due_date,
    }
  })

  return res.json([
    ...academicEvents,
    ...deadlines,
    ...userEvents,
    ...scheduledTasks,
  ])
})

export default router