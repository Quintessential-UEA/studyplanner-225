// ─── server/routes/tasks.js ──────────────────────────────────────────────────
// API routes for tasks and activities. All paths relative to /api/tasks (tasks)
// and /api/activities (activities).
//
// Task Endpoints:
//   GET    /tasks               All tasks for the current user
//   POST   /tasks               Create a new task
//   PUT    /tasks/:id           Update a task
//   PATCH  /tasks/:id/status    Quick status update (pending/in_progress/completed)
//   DELETE /tasks/:id           Delete a task
//
// Activity Endpoints (mounted separately at /api/activities):
//   GET    /activities              All activities for the current user
//   POST   /activities              Log a new activity
//   DELETE /activities/:id          Delete an activity
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import {
  getTasksForUser,
  getTaskById,
  createTask,
  updateTask,
  setTaskStatus,
  deleteTask,
  scheduleTask,
  unscheduleTask,
  getActivitiesForUser,
  getActivitiesForTask,
  createActivity,
  deleteActivity,
} from '../db/dal/tasks.js'

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// ═══ TASK ROUTES ═════════════════════════════════════════════════════════════
export const taskRouter = express.Router()

// GET /api/tasks : all tasks for the current user
taskRouter.get('/', (req, res) => {
  res.json(getTasksForUser(USER_ID))
})

// POST /api/tasks : create a new task
taskRouter.post('/', (req, res) => {
  try {
    const result = createTask({ user_id: USER_ID, ...req.body })
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/tasks/:id : full update
taskRouter.put('/:id', (req, res) => {
  const changes = updateTask(Number(req.params.id), USER_ID, req.body)
  if (changes === 0) return res.status(404).json({ error: 'Task not found' })
  res.json({ success: true })
})

// PATCH /api/tasks/:id/status :quick status toggle
taskRouter.patch('/:id/status', (req, res) => {
  const { status } = req.body
  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  const changes = setTaskStatus(Number(req.params.id), USER_ID, status)
  if (changes === 0) return res.status(404).json({ error: 'Task not found' })
  res.json({ success: true })
})

// DELETE /api/tasks/:id
taskRouter.delete('/:id', (req, res) => {
  const changes = deleteTask(Number(req.params.id), USER_ID)
  if (changes === 0) return res.status(404).json({ error: 'Task not found' })
  res.json({ success: true })
})

// PATCH /api/tasks/:id/schedule : schedule a task (calendar drag-and-drop)
taskRouter.patch('/:id/schedule', (req, res) => {
  const { scheduled_date, scheduled_start_time, scheduled_duration } = req.body
  const changes = scheduleTask(Number(req.params.id), USER_ID, scheduled_date, scheduled_start_time, scheduled_duration)
  if (changes === 0) return res.status(404).json({ error: 'Task not found' })
  res.json({ success: true })
})

// DELETE /api/tasks/:id/schedule : unschedule a task
taskRouter.delete('/:id/schedule', (req, res) => {
  const changes = unscheduleTask(Number(req.params.id), USER_ID)
  if (changes === 0) return res.status(404).json({ error: 'Task not found' })
  res.json({ success: true })
})

// GET /api/tasks/:id/activities : activities for a specific task
taskRouter.get('/:id/activities', (req, res) => {
  res.json(getActivitiesForTask(Number(req.params.id)))
})

// ═══ ACTIVITY ROUTES ═════════════════════════════════════════════════════════
export const activityRouter = express.Router()

// GET /api/activities : all activities for the current user
activityRouter.get('/', (req, res) => {
  res.json(getActivitiesForUser(USER_ID))
})

// POST /api/activities : log a new activity
activityRouter.post('/', (req, res) => {
  try {
    const { task_id, date, metric, amount, description } = req.body
    const result = createActivity(task_id, USER_ID, date, metric, amount, description)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/activities/:id
activityRouter.delete('/:id', (req, res) => {
  const changes = deleteActivity(Number(req.params.id), USER_ID)
  if (changes === 0) return res.status(404).json({ error: 'Activity not found' })
  res.json({ success: true })
})
