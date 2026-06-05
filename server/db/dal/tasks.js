// server/db/dal/tasks.js
import db from '../index.js'

// ═══ MILESTONES ══════════════════════════════════════════════════════════════

const findMilestoneById = db.prepare(`
  SELECT
    ml.*,
    a.title AS assessment_title,
    a.module_code
  FROM milestones ml
  JOIN assessments a ON ml.assessment_id = a.id
  WHERE ml.id = ?
`)

const findMilestonesForAssessment = db.prepare(`
  SELECT
    ml.*,
    a.title AS assessment_title,
    a.module_code
  FROM milestones ml
  JOIN assessments a ON ml.assessment_id = a.id
  WHERE ml.user_id = ? AND ml.assessment_id = ?
  ORDER BY ml.target_date, ml.id
`)

const findMilestonesForUser = db.prepare(`
  SELECT
    ml.*,
    a.title AS assessment_title,
    a.module_code
  FROM milestones ml
  JOIN assessments a ON ml.assessment_id = a.id
  WHERE ml.user_id = ?
  ORDER BY ml.target_date, ml.id
`)

const insertMilestoneStmt = db.prepare(`
  INSERT INTO milestones (user_id, assessment_id, title, target_date)
  VALUES (?, ?, ?, ?)
`)

const updateMilestoneStmt = db.prepare(`
  UPDATE milestones
  SET assessment_id = ?, title = ?, target_date = ?
  WHERE id = ? AND user_id = ?
`)

const deleteMilestoneStmt = db.prepare(`
  DELETE FROM milestones
  WHERE id = ? AND user_id = ?
`)

export function getMilestoneById(id) {
  return findMilestoneById.get(id)
}

export function getMilestonesForAssessment(userId, assessmentId) {
  return findMilestonesForAssessment.all(userId, assessmentId)
}

export function getMilestonesForUser(userId) {
  return findMilestonesForUser.all(userId)
}

export function createMilestone(userId, assessmentId, title, targetDate) {
  const result = insertMilestoneStmt.run(userId, assessmentId, title, targetDate ?? null)
  return { id: Number(result.lastInsertRowid) }
}

export function updateMilestone(id, userId, fields) {
  return updateMilestoneStmt.run(
    fields.assessment_id,
    fields.title,
    fields.target_date ?? null,
    id,
    userId
  ).changes
}

export function deleteMilestone(id, userId) {
  return deleteMilestoneStmt.run(id, userId).changes
}

// ═══ TASKS ═══════════════════════════════════════════════════════════════════

const taskSelect = `
  SELECT
    t.*,
    m.title AS module_title,
    a.title AS assessment_title,
    ml.title AS milestone_title,
    COALESCE((
      SELECT COUNT(*)
      FROM task_dependencies td
      WHERE td.user_id = t.user_id AND td.task_id = t.id
    ), 0) AS dependency_count,
    COALESCE((
      SELECT SUM(ac.amount)
      FROM activities ac
      WHERE ac.user_id = t.user_id AND ac.task_id = t.id
    ), 0) AS logged_amount,
    COALESCE((
      SELECT SUM(ac.time_spent_minutes)
      FROM activities ac
      WHERE ac.user_id = t.user_id AND ac.task_id = t.id
    ), 0) AS logged_time_spent_minutes
  FROM tasks t
  LEFT JOIN modules m ON t.module_code = m.code
  LEFT JOIN assessments a ON t.assessment_id = a.id
  LEFT JOIN milestones ml ON t.milestone_id = ml.id
`

const findTaskById = db.prepare(`
  ${taskSelect}
  WHERE t.id = ?
`)

const findTasksForUser = db.prepare(`
  ${taskSelect}
  WHERE t.user_id = ?
  ORDER BY
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date,
    t.id
`)

const findTasksByStatus = db.prepare(`
  ${taskSelect}
  WHERE t.user_id = ? AND t.status = ?
  ORDER BY
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date,
    t.id
`)

const findTasksForModule = db.prepare(`
  ${taskSelect}
  WHERE t.user_id = ? AND t.module_code = ?
  ORDER BY
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date,
    t.id
`)

const findTasksForAssessment = db.prepare(`
  ${taskSelect}
  WHERE t.user_id = ? AND t.assessment_id = ?
  ORDER BY
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date,
    t.id
`)

const findTasksForMilestone = db.prepare(`
  ${taskSelect}
  WHERE t.user_id = ? AND t.milestone_id = ?
  ORDER BY
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date,
    t.id
`)

const insertTaskStmt = db.prepare(`
  INSERT INTO tasks (
    user_id,
    assessment_id,
    milestone_id,
    module_code,
    title,
    type,
    target_metric,
    target_amount,
    description,
    status,
    due_date,
    scheduled_date,
    scheduled_start_time,
    scheduled_duration
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const updateTaskStmt = db.prepare(`
  UPDATE tasks SET
    assessment_id = ?,
    milestone_id = ?,
    module_code = ?,
    title = ?,
    type = ?,
    target_metric = ?,
    target_amount = ?,
    description = ?,
    status = ?,
    due_date = ?,
    scheduled_date = ?,
    scheduled_start_time = ?,
    scheduled_duration = ?
  WHERE id = ? AND user_id = ?
`)

const updateTaskStatusStmt = db.prepare(`
  UPDATE tasks
  SET status = ?
  WHERE id = ? AND user_id = ?
`)

const deleteTaskStmt = db.prepare(`
  DELETE FROM tasks
  WHERE id = ? AND user_id = ?
`)

export function getTaskById(id) {
  return findTaskById.get(id)
}

export function getTasksForUser(userId) {
  return findTasksForUser.all(userId)
}

export function getTasksByStatus(userId, status) {
  return findTasksByStatus.all(userId, status)
}

export function getTasksForModule(userId, moduleCode) {
  return findTasksForModule.all(userId, moduleCode)
}

export function getTasksForAssessment(userId, assessmentId) {
  return findTasksForAssessment.all(userId, assessmentId)
}

export function getTasksForMilestone(userId, milestoneId) {
  return findTasksForMilestone.all(userId, milestoneId)
}

export function createTask(task) {
  const result = insertTaskStmt.run(
    task.user_id,
    task.assessment_id ?? null,
    task.milestone_id ?? null,
    task.module_code ?? null,
    task.title,
    task.type ?? 'other',
    task.target_metric ?? null,
    task.target_amount ?? null,
    task.description ?? null,
    task.status ?? 'pending',
    task.due_date ?? null,
    task.scheduled_date ?? null,
    task.scheduled_start_time ?? null,
    task.scheduled_duration ?? 60
  )

  return { id: Number(result.lastInsertRowid) }
}

export function updateTask(id, userId, fields) {
  return updateTaskStmt.run(
    fields.assessment_id ?? null,
    fields.milestone_id ?? null,
    fields.module_code ?? null,
    fields.title,
    fields.type ?? 'other',
    fields.target_metric ?? null,
    fields.target_amount ?? null,
    fields.description ?? null,
    fields.status ?? 'pending',
    fields.due_date ?? null,
    fields.scheduled_date ?? null,
    fields.scheduled_start_time ?? null,
    fields.scheduled_duration ?? 60,
    id,
    userId
  ).changes
}

export function setTaskStatus(id, userId, status) {
  return updateTaskStatusStmt.run(status, id, userId).changes
}

export function deleteTask(id, userId) {
  return deleteTaskStmt.run(id, userId).changes
}

// ═══ TASK DEPENDENCIES ═══════════════════════════════════════════════════════

const findDependenciesForUser = db.prepare(`
  SELECT
    td.id,
    td.user_id,
    td.task_id,
    td.depends_on_task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.module_code AS task_module_code,
    d.title AS depends_on_title,
    d.status AS depends_on_status,
    d.module_code AS depends_on_module_code
  FROM task_dependencies td
  JOIN tasks t ON td.task_id = t.id
  JOIN tasks d ON td.depends_on_task_id = d.id
  WHERE td.user_id = ?
  ORDER BY td.task_id, td.depends_on_task_id
`)

const findDependenciesForTask = db.prepare(`
  SELECT
    td.id,
    td.user_id,
    td.task_id,
    td.depends_on_task_id,
    d.title AS depends_on_title,
    d.status AS depends_on_status,
    d.module_code AS depends_on_module_code,
    d.due_date AS depends_on_due_date
  FROM task_dependencies td
  JOIN tasks d ON td.depends_on_task_id = d.id
  WHERE td.user_id = ? AND td.task_id = ?
  ORDER BY d.due_date, d.id
`)

const findDependentTasksForTask = db.prepare(`
  SELECT
    td.id,
    td.user_id,
    td.task_id,
    td.depends_on_task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.module_code AS task_module_code,
    t.due_date AS task_due_date
  FROM task_dependencies td
  JOIN tasks t ON td.task_id = t.id
  WHERE td.user_id = ? AND td.depends_on_task_id = ?
  ORDER BY t.due_date, t.id
`)

const insertTaskDependencyStmt = db.prepare(`
  INSERT INTO task_dependencies (user_id, task_id, depends_on_task_id)
  VALUES (?, ?, ?)
`)

const deleteTaskDependencyStmt = db.prepare(`
  DELETE FROM task_dependencies
  WHERE id = ? AND user_id = ?
`)

const findOwnedTaskPairStmt = db.prepare(`
  SELECT COUNT(*) AS count
  FROM tasks
  WHERE user_id = ? AND id IN (?, ?)
`)

export function getTaskDependenciesForUser(userId) {
  return findDependenciesForUser.all(userId)
}

export function getTaskDependenciesForTask(userId, taskId) {
  return findDependenciesForTask.all(userId, taskId)
}

export function getDependentTasksForTask(userId, taskId) {
  return findDependentTasksForTask.all(userId, taskId)
}

export function createTaskDependency(userId, taskId, dependsOnTaskId) {
  const ownedCount = Number(
    findOwnedTaskPairStmt.get(userId, taskId, dependsOnTaskId)?.count ?? 0
  )

  if (ownedCount !== 2) {
    throw new Error('Both tasks must belong to the current user')
  }

  const result = insertTaskDependencyStmt.run(userId, taskId, dependsOnTaskId)
  return { id: Number(result.lastInsertRowid) }
}

export function deleteTaskDependency(id, userId) {
  return deleteTaskDependencyStmt.run(id, userId).changes
}

// ═══ TASK SCHEDULING ═════════════════════════════════════════════════════════

const scheduleTaskStmt = db.prepare(`
  UPDATE tasks SET
    scheduled_date = ?,
    scheduled_start_time = ?,
    scheduled_duration = ?
  WHERE id = ? AND user_id = ?
`)

const unscheduleTaskStmt = db.prepare(`
  UPDATE tasks SET
    scheduled_date = NULL,
    scheduled_start_time = NULL,
    scheduled_duration = 60
  WHERE id = ? AND user_id = ?
`)

const findScheduledTasks = db.prepare(`
  SELECT
    t.*,
    m.title AS module_title,
    um.theme_color
  FROM tasks t
  LEFT JOIN modules m ON t.module_code = m.code
  LEFT JOIN user_modules um
    ON t.module_code = um.module_code AND t.user_id = um.user_id
  WHERE t.user_id = ? AND t.scheduled_date IS NOT NULL
  ORDER BY t.scheduled_date, t.scheduled_start_time, t.id
`)

export function scheduleTask(id, userId, scheduledDate, scheduledStartTime, scheduledDuration) {
  return scheduleTaskStmt.run(
    scheduledDate,
    scheduledStartTime ?? null,
    scheduledDuration ?? 60,
    id,
    userId
  ).changes
}

export function unscheduleTask(id, userId) {
  return unscheduleTaskStmt.run(id, userId).changes
}

export function getScheduledTasks(userId) {
  return findScheduledTasks.all(userId)
}

// ═══ ACTIVITIES ══════════════════════════════════════════════════════════════

const findActivitiesForTask = db.prepare(`
  SELECT *
  FROM activities
  WHERE task_id = ?
  ORDER BY date DESC, id DESC
`)

const findActivitiesForUser = db.prepare(`
  SELECT
    a.*,
    t.title AS task_title,
    t.module_code
  FROM activities a
  JOIN tasks t ON a.task_id = t.id
  WHERE a.user_id = ?
  ORDER BY a.date DESC, a.id DESC
`)

const findActivitiesByDate = db.prepare(`
  SELECT
    a.*,
    t.title AS task_title,
    t.module_code
  FROM activities a
  JOIN tasks t ON a.task_id = t.id
  WHERE a.user_id = ? AND a.date = ?
  ORDER BY a.id
`)

const insertActivityStmt = db.prepare(`
  INSERT INTO activities (
    task_id,
    user_id,
    date,
    metric,
    amount,
    time_spent_minutes,
    description
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const deleteActivityStmt = db.prepare(`
  DELETE FROM activities
  WHERE id = ? AND user_id = ?
`)

export function getActivitiesForTask(taskId) {
  return findActivitiesForTask.all(taskId)
}

export function getActivitiesForUser(userId) {
  return findActivitiesForUser.all(userId)
}

export function getActivitiesByDate(userId, date) {
  return findActivitiesByDate.all(userId, date)
}

export function createActivity(
  taskId,
  userId,
  date,
  metric,
  amount,
  timeSpentMinutes,
  description
) {
  const result = insertActivityStmt.run(
    taskId,
    userId,
    date,
    metric,
    amount,
    timeSpentMinutes ?? 0,
    description ?? null
  )

  return { id: Number(result.lastInsertRowid) }
}

export function deleteActivity(id, userId) {
  return deleteActivityStmt.run(id, userId).changes
}