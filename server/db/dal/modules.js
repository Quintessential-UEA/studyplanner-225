// ─── server/db/dal/modules.js ────────────────────────────────────────────────
// Data Access Layer for module-related tables:
//   modules, user_modules, module_organisers, module_staff, staff,
//   module_topics, module_learning_outcomes, module_prerequisites,
//   module_corequisites
//
// These queries power "My Modules" views and the module detail pages
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═════════════════════════════════════════════════════════════════════════════
// MODULES : core table
// ═════════════════════════════════════════════════════════════════════════════

const findModuleByCode = db.prepare(`
  SELECT m.*, mo.name AS organiser_name, mo.email AS organiser_email,
         mo.office AS organiser_office, mo.office_hours AS organiser_office_hours
  FROM modules m
  LEFT JOIN module_organisers mo ON m.module_organiser_id = mo.id
  WHERE m.code = ?
`)

const findAllModules = db.prepare(`
  SELECT m.*, mo.name AS organiser_name, mo.email AS organiser_email
  FROM modules m
  LEFT JOIN module_organisers mo ON m.module_organiser_id = mo.id
  ORDER BY m.code
`)

/**
 * Get a single module by its code, including organiser details.
 * @param {string} code : Module code (e.g. 'CMP5012B')
 * @returns {object|undefined}
 */
export function getModuleByCode(code) {
  return findModuleByCode.get(code)
}

/**
 * Get all modules in the system with basic organiser info.
 * @returns {object[]}
 */
export function getAllModules() {
  return findAllModules.all()
}


// ═════════════════════════════════════════════════════════════════════════════
// USER <-> MODULE ENROLMENTS
// ═════════════════════════════════════════════════════════════════════════════

const findModulesForUser = db.prepare(`
  SELECT m.*, mo.name AS organiser_name, mo.email AS organiser_email,
         um.academic_year, um.theme_color
  FROM user_modules um
  JOIN modules m ON um.module_code = m.code
  LEFT JOIN module_organisers mo ON m.module_organiser_id = mo.id
  WHERE um.user_id = ?
  ORDER BY m.code
`)

const findModulesForUserByYear = db.prepare(`
  SELECT m.*, mo.name AS organiser_name, mo.email AS organiser_email,
         um.academic_year, um.theme_color
  FROM user_modules um
  JOIN modules m ON um.module_code = m.code
  LEFT JOIN module_organisers mo ON m.module_organiser_id = mo.id
  WHERE um.user_id = ? AND um.academic_year = ?
  ORDER BY m.code
`)

const insertEnrolment = db.prepare(`
  INSERT OR IGNORE INTO user_modules (user_id, module_code, academic_year)
  VALUES (?, ?, ?)
`)

const deleteEnrolment = db.prepare(`
  DELETE FROM user_modules
  WHERE user_id = ? AND module_code = ? AND academic_year = ?
`)

/**
 * Get all modules a user is enrolled in, with teaching staff attached.
 * @param {number} userId
 * @returns {object[]} Modules with organiser info, academic_year, and teaching_staff
 */
export function getModulesForUser(userId) {
  const modules = findModulesForUser.all(userId)
  if (!modules.length) return modules

  const codes = modules.map(m => m.code)
  const placeholders = codes.map(() => '?').join(', ')
  const staffRows = db.prepare(`
    SELECT ms.module_code, s.name, ms.role
    FROM module_staff ms
    JOIN staff s ON ms.staff_id = s.id
    WHERE ms.module_code IN (${placeholders}) AND ms.role IN ${TEACHING_ROLES}
    ORDER BY ms.role, s.name
  `).all(...codes)

  const staffByModule = {}
  for (const row of staffRows) {
    ; (staffByModule[row.module_code] ??= []).push({ name: row.name, role: row.role })
  }

  return modules.map(m => ({ ...m, teaching_staff: staffByModule[m.code] ?? [] }))
}

/**
 * Get modules a user is enrolled in for a specific academic year.
 * @param {number} userId
 * @param {string} academicYear : e.g. '2025-2026'
 * @returns {object[]}
 */
export function getModulesForUserByYear(userId, academicYear) {
  return findModulesForUserByYear.all(userId, academicYear)
}

/**
 * Enrol a user in a module. Uses INSERT OR IGNORE to silently skip duplicates.
 * @param {number} userId
 * @param {string} moduleCode
 * @param {string} academicYear
 * @returns {number} 1 if inserted, 0 if already enrolled
 */
export function enrolUser(userId, moduleCode, academicYear) {
  return insertEnrolment.run(userId, moduleCode, academicYear).changes
}

/**
 * Remove a user's enrolment in a module.
 * @param {number} userId
 * @param {string} moduleCode
 * @param {string} academicYear
 * @returns {number} Number of rows deleted (0 or 1)
 */
export function unenrolUser(userId, moduleCode, academicYear) {
  return deleteEnrolment.run(userId, moduleCode, academicYear).changes
}

const updateModuleColor = db.prepare(`
  UPDATE user_modules
  SET theme_color = ?
  WHERE user_id = ? AND module_code = ?
`)

/**
 * Update the theme color for a user's enrolled module.
 * @param {number} userId
 * @param {string} moduleCode
 * @param {string} color
 * @returns {number}
 */
export function updateUserModuleColor(userId, moduleCode, color) {
  return updateModuleColor.run(color, userId, moduleCode).changes
}


// ═════════════════════════════════════════════════════════════════════════════
// MODULE STAFF
// ═════════════════════════════════════════════════════════════════════════════

const TEACHING_ROLES = `('lecturer', 'teaching_fellow')`

const findTeachingStaffForModule = db.prepare(`
  SELECT s.id, s.name, s.email, s.office, ms.role, ms.responsibilities
  FROM module_staff ms
  JOIN staff s ON ms.staff_id = s.id
  WHERE ms.module_code = ? AND ms.role IN ${TEACHING_ROLES}
  ORDER BY ms.role, s.name
`)
const findStaffForModule = db.prepare(`
  SELECT s.id, s.name, s.email, s.office, ms.role, ms.responsibilities
  FROM module_staff ms
  JOIN staff s ON ms.staff_id = s.id
  WHERE ms.module_code = ? 
  ORDER BY ms.role, s.name
`)

/**
 * Get all teaching staff for a module with their roles.
 * @param {string} moduleCode
 * @returns {object[]} Staff members with role and responsibilities
 */
export function getTeachingStaffForModule(moduleCode) {
  return findTeachingStaffForModule.all(moduleCode)
}
export function getStaffForModule(moduleCode) {
  return findStaffForModule.all(moduleCode)
}


// ═════════════════════════════════════════════════════════════════════════════
// MODULE METADATA : topics, outcomes, prerequisites, corequisites
// ═════════════════════════════════════════════════════════════════════════════

const findTopicsForModule = db.prepare(`
  SELECT topic FROM module_topics WHERE module_code = ?
`)

const findOutcomesForModule = db.prepare(`
  SELECT outcome FROM module_learning_outcomes WHERE module_code = ?
`)

const findPrerequisitesForModule = db.prepare(`
  SELECT required_module_code FROM module_prerequisites WHERE module_code = ?
`)

const findCorequisitesForModule = db.prepare(`
  SELECT corequisite_module_code FROM module_corequisites WHERE module_code = ?
`)

/**
 * Get the list of topics covered by a module.
 * @param {string} moduleCode
 * @returns {string[]}
 */
export function getTopicsForModule(moduleCode) {
  return findTopicsForModule.all(moduleCode).map(r => r.topic)
}

/**
 * Get the learning outcomes for a module.
 * @param {string} moduleCode
 * @returns {string[]}
 */
export function getOutcomesForModule(moduleCode) {
  return findOutcomesForModule.all(moduleCode).map(r => r.outcome)
}

/**
 * Get prerequisite module codes for a module.
 * @param {string} moduleCode
 * @returns {string[]}
 */
export function getPrerequisitesForModule(moduleCode) {
  return findPrerequisitesForModule.all(moduleCode).map(r => r.required_module_code)
}

/**
 * Get corequisite module codes for a module.
 * @param {string} moduleCode
 * @returns {string[]}
 */
export function getCorequisitesForModule(moduleCode) {
  return findCorequisitesForModule.all(moduleCode).map(r => r.corequisite_module_code)
}


// ═════════════════════════════════════════════════════════════════════════════
// FULL MODULE DETAIL : aggregates all related data into one object
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get a complete module object with all related data (staff, topics, outcomes,
 * prerequisites, corequisites). Useful for module detail pages.
 * @param {string} moduleCode
 * @returns {object|null} Full module object, or null if not found
 */
export function getFullModuleDetail(moduleCode) {
  const mod = getModuleByCode(moduleCode)
  if (!mod) return null

  return {
    ...mod,
    staff: getStaffForModule(moduleCode),
    teaching_staff: getTeachingStaffForModule(moduleCode),
    topics: getTopicsForModule(moduleCode),
    learning_outcomes: getOutcomesForModule(moduleCode),
    prerequisites: getPrerequisitesForModule(moduleCode),
    corequisites: getCorequisitesForModule(moduleCode),
  }
}
