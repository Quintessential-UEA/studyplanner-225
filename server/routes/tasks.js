// server/routes/tasks.js
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
import { requireAuth } from '../middleware/auth.js'

export const taskRouter = express.Router()
export const activityRouter = express.Router()

taskRouter.use(requireAuth)
activityRouter.use(requireAuth)

taskRouter.get('/', (req, res) => {
  res.json(getTasksForUser(req.userId))
})

taskRouter.post('/', (req, res) => {
  try {
    const result = createTask({ user_id: req.userId, ...req.body })
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

taskRouter.put('/:id', (req, res) => {
  const changes = updateTask(Number(req.params.id), req.userId, req.body)

  if (changes === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json({ success: true })
})

taskRouter.patch('/:id/status', (req, res) => {
  const { status } = req.body

  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const changes = setTaskStatus(Number(req.params.id), req.userId, status)

  if (changes === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json({ success: true })
})

taskRouter.delete('/:id', (req, res) => {
  const changes = deleteTask(Number(req.params.id), req.userId)

  if (changes === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json({ success: true })
})

taskRouter.patch('/:id/schedule', (req, res) => {
  const { scheduled_date, scheduled_start_time, scheduled_duration } = req.body

  const changes = scheduleTask(
    Number(req.params.id),
    req.userId,
    scheduled_date,
    scheduled_start_time,
    scheduled_duration
  )

  if (changes === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json({ success: true })
})

taskRouter.delete('/:id/schedule', (req, res) => {
  const changes = unscheduleTask(Number(req.params.id), req.userId)

  if (changes === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json({ success: true })
})

taskRouter.get('/:id/activities', (req, res) => {
  const task = getTaskById(Number(req.params.id))

  if (!task || task.user_id !== req.userId) {
    return res.status(404).json({ error: 'Task not found' })
  }

  return res.json(getActivitiesForTask(Number(req.params.id)))
})

activityRouter.get('/', (req, res) => {
  res.json(getActivitiesForUser(req.userId))
})

activityRouter.post('/', (req, res) => {
  try {
    const { task_id, date, metric, amount, description } = req.body
    const task = getTaskById(Number(task_id))

    if (!task || task.user_id !== req.userId) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const result = createActivity(
      Number(task_id),
      req.userId,
      date,
      metric,
      amount,
      description
    )

    return res.status(201).json(result)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
})

activityRouter.delete('/:id', (req, res) => {
  const changes = deleteActivity(Number(req.params.id), req.userId)

  if (changes === 0) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  return res.json({ success: true })
})