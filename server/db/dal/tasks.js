// ─── server/db/dal/tasks.js ──────────────────────────────────────────────────
// Data Access Layer for: milestones, tasks, activities
//
// These are the user-facing planning tables. A user creates milestones and
// tasks to plan their work, then logs activities to track progress.
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ MILESTONES ══════════════════════════════════════════════════════════════

const findMilestoneById = db.prepare(`SELECT * FROM milestones WHERE id = ?`)

const findMilestonesForAssessment = db.prepare(`
  SELECT * FROM milestones WHERE user_id = ? AND assessment_id = ? ORDER BY target_date
`)

const findMilestonesForUser = db.prepare(`
  SELECT ml.*, a.title AS assessment_title, a.module_code
  FROM milestones ml
  JOIN assessments a ON ml.assessment_id = a.id
  WHERE ml.user_id = ?
  ORDER BY ml.target_date
`)

const insertMilestone = db.prepare(`
  INSERT INTO milestones (user_id, assessment_id, title, target_date)
  VALUES (?, ?, ?, ?)
`)

const updateMilestoneStmt = db.prepare(`
  UPDATE milestones SET title = ?, target_date = ? WHERE id = ? AND user_id = ?
`)

const deleteMilestoneStmt = db.prepare(`
  DELETE FROM milestones WHERE id = ? AND user_id = ?
`)

/** Get a milestone by ID. */
export function getMilestoneById(id) {
  return findMilestoneById.get(id)
}

/** Get all milestones a user has set for a specific assessment. */
export function getMilestonesForAssessment(userId, assessmentId) {
  return findMilestonesForAssessment.all(userId, assessmentId)
}

/** Get all milestones for a user across all assessments. */
export function getMilestonesForUser(userId) {
  return findMilestonesForUser.all(userId)
}

/**
 * Create a new milestone.
 * @returns {object} { id } of the new milestone
 */
export function createMilestone(userId, assessmentId, title, targetDate) {
  const result = insertMilestone.run(userId, assessmentId, title, targetDate)
  return { id: result.lastInsertRowid }
}

/** Update a milestone's title and target date. Only the owning user can update. */
export function updateMilestone(id, userId, title, targetDate) {
  return updateMilestoneStmt.run(title, targetDate, id, userId).changes
}

/** Delete a milestone. Tasks referencing it get milestone_id set to NULL. */
export function deleteMilestone(id, userId) {
  return deleteMilestoneStmt.run(id, userId).changes
}


// ═══ TASKS ═══════════════════════════════════════════════════════════════════

const findTaskById = db.prepare(`SELECT * FROM tasks WHERE id = ?`)

const findTasksForUser = db.prepare(`
  SELECT t.*, m.title AS module_title
  FROM tasks t
  LEFT JOIN modules m ON t.module_code = m.code
  WHERE t.user_id = ?
  ORDER BY t.due_date
`)

const findTasksByStatus = db.prepare(`
  SELECT t.*, m.title AS module_title
  FROM tasks t
  LEFT JOIN modules m ON t.module_code = m.code
  WHERE t.user_id = ? AND t.status = ?
  ORDER BY t.due_date
`)

const findTasksForModule = db.prepare(`
  SELECT * FROM tasks WHERE user_id = ? AND module_code = ? ORDER BY due_date
`)

const insertTask = db.prepare(`
  INSERT INTO tasks (
    user_id, assessment_id, milestone_id, module_code,
    title, type, target_metric, target_amount,
    description, status, due_date,
    scheduled_date, scheduled_start_time, scheduled_duration
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const updateTaskStmt = db.prepare(`
  UPDATE tasks SET
    milestone_id = ?, title = ?, type = ?,
    target_metric = ?, target_amount = ?,
    description = ?, status = ?, due_date = ?,
    scheduled_date = ?, scheduled_start_time = ?, scheduled_duration = ?
  WHERE id = ? AND user_id = ?
`)

const updateTaskStatusStmt = db.prepare(`
  UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?
`)

const deleteTaskStmt = db.prepare(`
  DELETE FROM tasks WHERE id = ? AND user_id = ?
`)

/** Get a task by ID. */
export function getTaskById(id) {
  return findTaskById.get(id)
}

/** Get all tasks for a user, ordered by due date. */
export function getTasksForUser(userId) {
  return findTasksForUser.all(userId)
}

/** Get tasks for a user filtered by status ('pending', 'in_progress', 'completed'). */
export function getTasksByStatus(userId, status) {
  return findTasksByStatus.all(userId, status)
}

/** Get tasks for a specific module. */
export function getTasksForModule(userId, moduleCode) {
  return findTasksForModule.all(userId, moduleCode)
}

/**
 * Create a new task.
 * @param {object} t - Task fields (see tasks table columns)
 * @returns {object} { id } of the new task
 */
export function createTask(t) {
  const result = insertTask.run(
    t.user_id, t.assessment_id ?? null, t.milestone_id ?? null,
    t.module_code, t.title, t.type,
    t.target_metric ?? null, t.target_amount ?? null,
    t.description ?? null, t.status ?? 'pending', t.due_date ?? null,
    t.scheduled_date ?? null, t.scheduled_start_time ?? null,
    t.scheduled_duration ?? 60
  )
  return { id: result.lastInsertRowid }
}

/** Update all editable fields of a task. Only the owning user can update. */
export function updateTask(id, userId, fields) {
  return updateTaskStmt.run(
    fields.milestone_id ?? null, fields.title, fields.type,
    fields.target_metric ?? null, fields.target_amount ?? null,
    fields.description ?? null, fields.status, fields.due_date ?? null,
    fields.scheduled_date ?? null, fields.scheduled_start_time ?? null,
    fields.scheduled_duration ?? 60,
    id, userId
  ).changes
}

/** Quick status update (e.g. marking a task as completed). */
export function setTaskStatus(id, userId, status) {
  return updateTaskStatusStmt.run(status, id, userId).changes
}

/** Delete a task. Cascades to activities. */
export function deleteTask(id, userId) {
  return deleteTaskStmt.run(id, userId).changes
}


// ═══ TASK SCHEDULING (Calendar drag-and-drop) ════════════════════════════════

const scheduleTaskStmt = db.prepare(`
  UPDATE tasks SET
    scheduled_date = ?, scheduled_start_time = ?, scheduled_duration = ?
  WHERE id = ? AND user_id = ?
`)

const unscheduleTaskStmt = db.prepare(`
  UPDATE tasks SET
    scheduled_date = NULL, scheduled_start_time = NULL, scheduled_duration = 60
  WHERE id = ? AND user_id = ?
`)

const findScheduledTasks = db.prepare(`
  SELECT t.*, m.title AS module_title, um.theme_color
  FROM tasks t
  LEFT JOIN modules m ON t.module_code = m.code
  LEFT JOIN user_modules um ON t.module_code = um.module_code AND t.user_id = um.user_id
  WHERE t.user_id = ? AND t.scheduled_date IS NOT NULL
  ORDER BY t.scheduled_date, t.scheduled_start_time
`)

/** Pin a task to a calendar slot (from drag-and-drop). */
export function scheduleTask(id, userId, scheduledDate, scheduledStartTime, scheduledDuration) {
  return scheduleTaskStmt.run(
    scheduledDate, scheduledStartTime ?? null, scheduledDuration ?? 60,
    id, userId
  ).changes
}

/** Remove a task from the calendar (back to inbox only). */
export function unscheduleTask(id, userId) {
  return unscheduleTaskStmt.run(id, userId).changes
}

/** Get all scheduled tasks for a user (for the calendar aggregate). */
export function getScheduledTasks(userId) {
  return findScheduledTasks.all(userId)
}


// ═══ ACTIVITIES ══════════════════════════════════════════════════════════════

const findActivitiesForTask = db.prepare(`
  SELECT * FROM activities WHERE task_id = ? ORDER BY date DESC
`)

const findActivitiesForUser = db.prepare(`
  SELECT a.*, t.title AS task_title, t.module_code
  FROM activities a
  JOIN tasks t ON a.task_id = t.id
  WHERE a.user_id = ?
  ORDER BY a.date DESC
`)

const findActivitiesByDate = db.prepare(`
  SELECT a.*, t.title AS task_title, t.module_code
  FROM activities a
  JOIN tasks t ON a.task_id = t.id
  WHERE a.user_id = ? AND a.date = ?
  ORDER BY a.id
`)

const insertActivity = db.prepare(`
  INSERT INTO activities (task_id, user_id, date, metric, amount, description)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const deleteActivityStmt = db.prepare(`
  DELETE FROM activities WHERE id = ? AND user_id = ?
`)

/** Get all activity log entries for a specific task. */
export function getActivitiesForTask(taskId) {
  return findActivitiesForTask.all(taskId)
}

/** Get all activities for a user, newest first. */
export function getActivitiesForUser(userId) {
  return findActivitiesForUser.all(userId)
}

/** Get activities for a user on a specific date (for heatmap / daily view). */
export function getActivitiesByDate(userId, date) {
  return findActivitiesByDate.all(userId, date)
}

/**
 * Log a new activity entry.
 * @returns {object} { id } of the new activity
 */
export function createActivity(taskId, userId, date, metric, amount, description) {
  const result = insertActivity.run(
    taskId, userId, date, metric, amount, description ?? null
  )
  return { id: result.lastInsertRowid }
}

/** Delete an activity log entry. */
export function deleteActivity(id, userId) {
  return deleteActivityStmt.run(id, userId).changes
}
