// ─── server/db/dal/assessments.js ────────────────────────────────────────────
// Data Access Layer for: assessments, assessment_file_types,
// suggested_milestones, suggested_tasks
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ ASSESSMENTS ═════════════════════════════════════════════════════════════

const findAssessmentById = db.prepare(`SELECT * FROM assessments WHERE id = ?`)

const findAssessmentsByModule = db.prepare(`
  SELECT * FROM assessments WHERE module_code = ? ORDER BY deadline
`)

const findAssessmentsForUser = db.prepare(`
  SELECT a.*, m.title AS module_title, um.theme_color
  FROM assessments a
  JOIN user_modules um ON a.module_code = um.module_code
  JOIN modules m ON a.module_code = m.code
  WHERE um.user_id = ?
  ORDER BY a.deadline
`)

/** Get a single assessment by ID. */
export function getAssessmentById(id) {
  return findAssessmentById.get(id)
}

/** Get all assessments for a module, ordered by deadline. */
export function getAssessmentsByModule(moduleCode) {
  return findAssessmentsByModule.all(moduleCode)
}

/** Get all assessments across a user's enrolled modules. */
export function getAssessmentsForUser(userId) {
  return findAssessmentsForUser.all(userId)
}

// ═══ FILE TYPES ══════════════════════════════════════════════════════════════

const findFileTypes = db.prepare(`
  SELECT file_type FROM assessment_file_types WHERE assessment_id = ?
`)

/** Get accepted file types for an assessment (e.g. ['pdf', 'zip']). */
export function getFileTypesForAssessment(assessmentId) {
  return findFileTypes.all(assessmentId).map(r => r.file_type)
}

// ═══ SUGGESTED MILESTONES ════════════════════════════════════════════════════

const findSuggestedMilestones = db.prepare(`
  SELECT * FROM suggested_milestones WHERE assessment_id = ? ORDER BY suggested_deadline
`)

/** Get organiser-suggested milestones for an assessment. */
export function getSuggestedMilestones(assessmentId) {
  return findSuggestedMilestones.all(assessmentId)
}

// ═══ SUGGESTED TASKS ═════════════════════════════════════════════════════════

const findSuggestedTasks = db.prepare(`
  SELECT * FROM suggested_tasks WHERE assessment_id = ?
`)

/** Get organiser-suggested tasks for an assessment. */
export function getSuggestedTasks(assessmentId) {
  return findSuggestedTasks.all(assessmentId)
}

// ═══ FULL DETAIL ═════════════════════════════════════════════════════════════

/**
 * Get a complete assessment with file types, suggested milestones & tasks.
 * @param {number} assessmentId
 * @returns {object|null}
 */
export function getFullAssessmentDetail(assessmentId) {
  const assessment = getAssessmentById(assessmentId)
  if (!assessment) return null
  return {
    ...assessment,
    file_types:           getFileTypesForAssessment(assessmentId),
    suggested_milestones: getSuggestedMilestones(assessmentId),
    suggested_tasks:      getSuggestedTasks(assessmentId),
  }
}
