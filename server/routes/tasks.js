// server/routes/tasks.js
import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getAssessmentsForUser } from '../db/dal/assessments.js'
import {
  getTaskById,
  getTasksForUser,
  getTasksByStatus,
  getTasksForModule,
  getTasksForAssessment,
  getTasksForMilestone,
  createTask,
  updateTask,
  setTaskStatus,
  deleteTask,
  getMilestoneById,
  getMilestonesForAssessment,
  getMilestonesForUser,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getTaskDependenciesForUser,
  getTaskDependenciesForTask,
  getDependentTasksForTask,
  createTaskDependency,
  deleteTaskDependency,
  scheduleTask,
  unscheduleTask,
  getScheduledTasks,
  getActivitiesForTask,
  getActivitiesForUser,
  getActivitiesByDate,
  createActivity,
  deleteActivity,
} from '../db/dal/tasks.js'

const taskRouter = express.Router()
const activityRouter = express.Router()

taskRouter.use(requireAuth)
activityRouter.use(requireAuth)

const TASK_TYPES = new Set([
  'studying',
  'programming',
  'writing',
  'reading',
  'revision',
  'practice',
  'other',
])

const TASK_STATUSES = new Set([
  'pending',
  'in_progress',
  'completed',
])

function toInt(value) {
  if (value === '' || value == null) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function toNullableNumber(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function toNullableString(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function getOwnedAssessment(userId, assessmentId) {
  if (!assessmentId) return null
  return getAssessmentsForUser(userId).find(
    (assessment) => assessment.id === assessmentId
  ) || null
}

function ensureOwnedTask(task, userId) {
  return Boolean(task && task.user_id === userId)
}

function normaliseTaskPayload(body, userId) {
  const title = String(body.title ?? '').trim()
  const assessmentId = toInt(body.assessment_id)
  const milestoneId = toInt(body.milestone_id)
  const type = toNullableString(body.type) ?? 'other'
  const status = toNullableString(body.status) ?? 'pending'
  const targetAmount = toNullableNumber(body.target_amount)
  const scheduledDuration = toNullableNumber(body.scheduled_duration) ?? 60

  if (!title) {
    return { error: 'Task title is required' }
  }

  if (!TASK_TYPES.has(type)) {
    return { error: 'Invalid task type' }
  }

  if (!TASK_STATUSES.has(status)) {
    return { error: 'Invalid task status' }
  }

  if (!Number.isFinite(scheduledDuration) || scheduledDuration <= 0) {
    return { error: 'scheduled_duration must be a positive number' }
  }

  const assessment = getOwnedAssessment(userId, assessmentId)
  if (assessmentId && !assessment) {
    return { error: 'Assessment not found' }
  }

  let milestone = null
  if (milestoneId) {
    milestone = getMilestoneById(milestoneId)

    if (!milestone || milestone.user_id !== userId) {
      return { error: 'Milestone not found' }
    }

    if (assessmentId && milestone.assessment_id !== assessmentId) {
      return { error: 'Milestone does not belong to the selected assessment' }
    }
  }

  const resolvedAssessmentId = assessmentId ?? milestone?.assessment_id ?? null
  const resolvedAssessment = resolvedAssessmentId
    ? getOwnedAssessment(userId, resolvedAssessmentId)
    : null

  const moduleCode =
    resolvedAssessment?.module_code ??
    toNullableString(body.module_code)

  if (!resolvedAssessmentId && !moduleCode) {
    return { error: 'Task must include either assessment_id or module_code' }
  }

  return {
    value: {
      user_id: userId,
      assessment_id: resolvedAssessmentId,
      milestone_id: milestoneId,
      module_code: moduleCode,
      title,
      type,
      target_metric: toNullableString(body.target_metric),
      target_amount: targetAmount,
      description: toNullableString(body.description),
      status,
      due_date: toNullableString(body.due_date),
      scheduled_date: toNullableString(body.scheduled_date),
      scheduled_start_time: toNullableString(body.scheduled_start_time),
      scheduled_duration: scheduledDuration,
    },
  }
}

// ═══ TASKS ═══════════════════════════════════════════════════════════════════

taskRouter.get('/', (req, res) => {
  try {
    const { status, module_code, assessment_id, milestone_id } = req.query

    if (status) {
      if (!TASK_STATUSES.has(String(status))) {
        return res.status(400).json({ error: 'Invalid task status' })
      }

      return res.json(getTasksByStatus(req.userId, String(status)))
    }

    if (module_code) {
      return res.json(getTasksForModule(req.userId, String(module_code)))
    }

    if (assessment_id) {
      const assessmentId = toInt(assessment_id)

      if (!assessmentId) {
        return res.status(400).json({ error: 'Invalid assessment id' })
      }

      return res.json(getTasksForAssessment(req.userId, assessmentId))
    }

    if (milestone_id) {
      const milestoneId = toInt(milestone_id)

      if (!milestoneId) {
        return res.status(400).json({ error: 'Invalid milestone id' })
      }

      return res.json(getTasksForMilestone(req.userId, milestoneId))
    }

    return res.json(getTasksForUser(req.userId))
  } catch (err) {
    console.error('[tasks] list failed:', err)
    return res.status(500).json({ error: 'Failed to load tasks' })
  }
})

taskRouter.post('/', (req, res) => {
  try {
    const parsed = normaliseTaskPayload(req.body, req.userId)

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error })
    }

    const result = createTask(parsed.value)
    const created = getTaskById(result.id)

    return res.status(201).json(created)
  } catch (err) {
    console.error('[tasks] create failed:', err)
    return res.status(500).json({ error: 'Failed to create task' })
  }
})

taskRouter.put('/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid task id' })
    }

    const existing = getTaskById(id)

    if (!ensureOwnedTask(existing, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const parsed = normaliseTaskPayload(req.body, req.userId)

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error })
    }

    const changes = updateTask(id, req.userId, parsed.value)

    if (!changes) {
      return res.status(404).json({ error: 'Task not found' })
    }

    return res.json(getTaskById(id))
  } catch (err) {
    console.error('[tasks] update failed:', err)
    return res.status(500).json({ error: 'Failed to update task' })
  }
})

taskRouter.patch('/:id/status', (req, res) => {
  try {
    const id = toInt(req.params.id)
    const status = String(req.body?.status ?? '').trim()

    if (!id) {
      return res.status(400).json({ error: 'Invalid task id' })
    }

    if (!TASK_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid task status' })
    }

    const existing = getTaskById(id)

    if (!ensureOwnedTask(existing, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (status === 'completed') {
      const blockers = getTaskDependenciesForTask(req.userId, id).filter(
        (dependency) => dependency.depends_on_status !== 'completed'
      )

      if (blockers.length) {
        return res.status(409).json({
          error: 'Complete prerequisite tasks first',
          blockers: blockers.map((dependency) => ({
            id: dependency.depends_on_task_id,
            title: dependency.depends_on_title,
            status: dependency.depends_on_status,
          })),
        })
      }
    }

    setTaskStatus(id, req.userId, status)

    return res.json(getTaskById(id))
  } catch (err) {
    console.error('[tasks] set status failed:', err)
    return res.status(500).json({ error: 'Failed to update task status' })
  }
})

taskRouter.patch('/:id/schedule', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid task id' })
    }

    const existing = getTaskById(id)

    if (!ensureOwnedTask(existing, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const scheduledDate = toNullableString(req.body?.scheduled_date)
    const scheduledStartTime = toNullableString(req.body?.scheduled_start_time)
    const scheduledDuration = toNullableNumber(req.body?.scheduled_duration) ?? 60

    if (!scheduledDate) {
      return res.status(400).json({ error: 'scheduled_date is required' })
    }

    if (!Number.isFinite(scheduledDuration) || scheduledDuration <= 0) {
      return res.status(400).json({ error: 'scheduled_duration must be a positive number' })
    }

    scheduleTask(
      id,
      req.userId,
      scheduledDate,
      scheduledStartTime,
      scheduledDuration
    )

    return res.json(getTaskById(id))
  } catch (err) {
    console.error('[tasks] schedule failed:', err)
    return res.status(500).json({ error: 'Failed to schedule task' })
  }
})

taskRouter.delete('/:id/schedule', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid task id' })
    }

    const existing = getTaskById(id)

    if (!ensureOwnedTask(existing, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    unscheduleTask(id, req.userId)

    return res.status(204).send()
  } catch (err) {
    console.error('[tasks] unschedule failed:', err)
    return res.status(500).json({ error: 'Failed to unschedule task' })
  }
})

taskRouter.get('/scheduled/list', (req, res) => {
  try {
    return res.json(getScheduledTasks(req.userId))
  } catch (err) {
    console.error('[tasks] scheduled list failed:', err)
    return res.status(500).json({ error: 'Failed to load scheduled tasks' })
  }
})

taskRouter.delete('/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid task id' })
    }

    const existing = getTaskById(id)

    if (!ensureOwnedTask(existing, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    deleteTask(id, req.userId)

    return res.status(204).send()
  } catch (err) {
    console.error('[tasks] delete failed:', err)
    return res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ═══ MILESTONES ══════════════════════════════════════════════════════════════

taskRouter.get('/milestones', (req, res) => {
  try {
    const assessmentId = toInt(req.query.assessment_id)

    if (req.query.assessment_id != null) {
      if (!assessmentId) {
        return res.status(400).json({ error: 'Invalid assessment id' })
      }

      const assessment = getOwnedAssessment(req.userId, assessmentId)

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' })
      }

      return res.json(getMilestonesForAssessment(req.userId, assessmentId))
    }

    return res.json(getMilestonesForUser(req.userId))
  } catch (err) {
    console.error('[tasks] milestone list failed:', err)
    return res.status(500).json({ error: 'Failed to load milestones' })
  }
})

taskRouter.post('/milestones', (req, res) => {
  try {
    const assessmentId = toInt(req.body?.assessment_id)
    const title = String(req.body?.title ?? '').trim()
    const targetDate = toNullableString(req.body?.target_date)

    if (!assessmentId) {
      return res.status(400).json({ error: 'assessment_id is required' })
    }

    if (!title) {
      return res.status(400).json({ error: 'Milestone title is required' })
    }

    const assessment = getOwnedAssessment(req.userId, assessmentId)

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    const result = createMilestone(req.userId, assessmentId, title, targetDate)
    return res.status(201).json(getMilestoneById(result.id))
  } catch (err) {
    console.error('[tasks] milestone create failed:', err)
    return res.status(500).json({ error: 'Failed to create milestone' })
  }
})

taskRouter.put('/milestones/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)
    const assessmentId = toInt(req.body?.assessment_id)
    const title = String(req.body?.title ?? '').trim()
    const targetDate = toNullableString(req.body?.target_date)

    if (!id) {
      return res.status(400).json({ error: 'Invalid milestone id' })
    }

    if (!assessmentId) {
      return res.status(400).json({ error: 'assessment_id is required' })
    }

    if (!title) {
      return res.status(400).json({ error: 'Milestone title is required' })
    }

    const existing = getMilestoneById(id)

    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    const assessment = getOwnedAssessment(req.userId, assessmentId)

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    updateMilestone(id, req.userId, {
      assessment_id: assessmentId,
      title,
      target_date: targetDate,
    })

    return res.json(getMilestoneById(id))
  } catch (err) {
    console.error('[tasks] milestone update failed:', err)
    return res.status(500).json({ error: 'Failed to update milestone' })
  }
})

taskRouter.delete('/milestones/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid milestone id' })
    }

    const existing = getMilestoneById(id)

    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    deleteMilestone(id, req.userId)

    return res.status(204).send()
  } catch (err) {
    console.error('[tasks] milestone delete failed:', err)
    return res.status(500).json({ error: 'Failed to delete milestone' })
  }
})

// ═══ DEPENDENCIES ════════════════════════════════════════════════════════════

taskRouter.get('/dependencies', (req, res) => {
  try {
    const taskId = toInt(req.query.task_id)
    const reverse = String(req.query.reverse ?? '').trim() === 'true'

    if (req.query.task_id != null) {
      if (!taskId) {
        return res.status(400).json({ error: 'Invalid task id' })
      }

      const task = getTaskById(taskId)

      if (!ensureOwnedTask(task, req.userId)) {
        return res.status(404).json({ error: 'Task not found' })
      }

      return res.json(
        reverse
          ? getDependentTasksForTask(req.userId, taskId)
          : getTaskDependenciesForTask(req.userId, taskId)
      )
    }

    return res.json(getTaskDependenciesForUser(req.userId))
  } catch (err) {
    console.error('[tasks] dependency list failed:', err)
    return res.status(500).json({ error: 'Failed to load task dependencies' })
  }
})

taskRouter.post('/dependencies', (req, res) => {
  try {
    const taskId = toInt(req.body?.task_id)
    const dependsOnTaskId = toInt(req.body?.depends_on_task_id)

    if (!taskId || !dependsOnTaskId) {
      return res.status(400).json({
        error: 'task_id and depends_on_task_id are required',
      })
    }

    if (taskId === dependsOnTaskId) {
      return res.status(400).json({
        error: 'A task cannot depend on itself',
      })
    }

    const result = createTaskDependency(req.userId, taskId, dependsOnTaskId)
    const created = getTaskDependenciesForTask(req.userId, taskId).find(
      (dependency) => dependency.id === result.id
    )

    return res.status(201).json(created ?? { id: result.id })
  } catch (err) {
    if (
      String(err.message).includes('Both tasks must belong to the current user')
    ) {
      return res.status(400).json({ error: err.message })
    }

    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({
        error: 'That dependency already exists',
      })
    }

    console.error('[tasks] dependency create failed:', err)
    return res.status(500).json({ error: 'Failed to create task dependency' })
  }
})

taskRouter.delete('/dependencies/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid dependency id' })
    }

    const changes = deleteTaskDependency(id, req.userId)

    if (!changes) {
      return res.status(404).json({ error: 'Dependency not found' })
    }

    return res.status(204).send()
  } catch (err) {
    console.error('[tasks] dependency delete failed:', err)
    return res.status(500).json({ error: 'Failed to delete task dependency' })
  }
})

// ═══ ACTIVITIES ══════════════════════════════════════════════════════════════

activityRouter.get('/', (req, res) => {
  try {
    const taskId = toInt(req.query.task_id)
    const date = toNullableString(req.query.date)

    if (req.query.task_id != null) {
      if (!taskId) {
        return res.status(400).json({ error: 'Invalid task id' })
      }

      const task = getTaskById(taskId)

      if (!ensureOwnedTask(task, req.userId)) {
        return res.status(404).json({ error: 'Task not found' })
      }

      return res.json(getActivitiesForTask(taskId))
    }

    if (date) {
      return res.json(getActivitiesByDate(req.userId, date))
    }

    return res.json(getActivitiesForUser(req.userId))
  } catch (err) {
    console.error('[activities] list failed:', err)
    return res.status(500).json({ error: 'Failed to load activities' })
  }
})

activityRouter.post('/', (req, res) => {
  try {
    const taskId = toInt(req.body?.task_id)
    const date = toNullableString(req.body?.date)
    const metric = String(req.body?.metric ?? '').trim()
    const amount = toNullableNumber(req.body?.amount)
    const timeSpentMinutes = toNullableNumber(req.body?.time_spent_minutes)
    const description = toNullableString(req.body?.description)

    if (!taskId) {
      return res.status(400).json({ error: 'task_id is required' })
    }

    if (!date) {
      return res.status(400).json({ error: 'date is required' })
    }

    if (!metric) {
      return res.status(400).json({ error: 'metric is required' })
    }

    if (amount == null || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' })
    }

    if (
      timeSpentMinutes == null ||
      !Number.isFinite(timeSpentMinutes) ||
      timeSpentMinutes <= 0
    ) {
      return res.status(400).json({
        error: 'time_spent_minutes must be a positive number',
      })
    }

    const task = getTaskById(taskId)

    if (!ensureOwnedTask(task, req.userId)) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const result = createActivity(
      taskId,
      req.userId,
      date,
      metric,
      amount,
      timeSpentMinutes,
      description
    )

    return res.status(201).json({ id: result.id })
  } catch (err) {
    console.error('[activities] create failed:', err)
    return res.status(500).json({ error: 'Failed to create activity' })
  }
})

activityRouter.delete('/:id', (req, res) => {
  try {
    const id = toInt(req.params.id)

    if (!id) {
      return res.status(400).json({ error: 'Invalid activity id' })
    }

    const changes = deleteActivity(id, req.userId)

    if (!changes) {
      return res.status(404).json({ error: 'Activity not found' })
    }

    return res.status(204).send()
  } catch (err) {
    console.error('[activities] delete failed:', err)
    return res.status(500).json({ error: 'Failed to delete activity' })
  }
})

export { taskRouter, activityRouter }