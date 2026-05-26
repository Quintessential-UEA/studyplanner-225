// ─── server/db/dal/users.js ──────────────────────────────────────────────────
// Data Access Layer for the `users` and `student_profiles` tables.
//
// This file contains all database queries related to user accounts and their
// student profile data. Route handlers call these functions instead of writing
// SQL directly, keeping database logic in one place.
//
// ─── Pattern ─────────────────────────────────────────────────────────────────
// Each function uses `db.prepare()` to compile SQL into a reusable prepared
// statement. Prepared statements are faster for repeated queries and
// automatically protect against SQL injection via parameter binding (hopefully?)
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═════════════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Prepared Statements ────────────────────────────────────────────────────
// We define these once at module load. better-sqlite3 caches the compiled SQL
// so subsequent calls are very fast.

const findUserById = db.prepare(`
  SELECT * FROM users WHERE id = ?
`)

const findUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`)

const insertUser = db.prepare(`
  INSERT INTO users (email, password) VALUES (?, ?)
`)

const updateUserEmail = db.prepare(`
  UPDATE users SET email = ? WHERE id = ?
`)

const updateUserPassword = db.prepare(`
  UPDATE users SET password = ? WHERE id = ?
`)

const deleteUserById = db.prepare(`
  DELETE FROM users WHERE id = ?
`)

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get a user by their primary key.
 * @param {number} id : User ID
 * @returns {object|undefined} The user row, or undefined if not found
 */
export function getUserById(id) {
  return findUserById.get(id)
}

/**
 * Get a user by their email address.
 * @param {string} email
 * @returns {object|undefined} The user row, or undefined if not found
 */
export function getUserByEmail(email) {
  return findUserByEmail.get(email)
}

/**
 * Create a new user account.
 * @param {string} email
 * @param {string} hashedPassword : Already-hashed password (never plaintext)
 * @returns {object} { id } of the newly created user
 */
export function createUser(email, hashedPassword) {
  const result = insertUser.run(email, hashedPassword)
  return { id: result.lastInsertRowid }
}

/**
 * Update a user's email address.
 * @param {number} id : User ID
 * @param {string} newEmail
 * @returns {number} Number of rows changed (0 or 1)
 */
export function setUserEmail(id, newEmail) {
  return updateUserEmail.run(newEmail, id).changes
}

/**
 * Update a user's password.
 * @param {number} id : User ID
 * @param {string} newHashedPassword
 * @returns {number} Number of rows changed (0 or 1)
 */
export function setUserPassword(id, newHashedPassword) {
  return updateUserPassword.run(newHashedPassword, id).changes
}

/**
 * Delete a user account (cascades to student_profiles, tasks, activities, etc.).
 * @param {number} id : User ID
 * @returns {number} Number of rows deleted (0 or 1)
 */
export function deleteUser(id) {
  return deleteUserById.run(id).changes
}


// ═════════════════════════════════════════════════════════════════════════════
// STUDENT PROFILES
// ═════════════════════════════════════════════════════════════════════════════

const findProfileByUserId = db.prepare(`
  SELECT * FROM student_profiles WHERE user_id = ?
`)

const upsertProfile = db.prepare(`
  INSERT INTO student_profiles (
    user_id, student_number, full_name, preferred_name,
    school_name, school_acronym, programme_code, programme_title,
    year_of_study, level_of_study, has_reasonable_adjustments,
    advisor_name, advisor_email, advisor_office
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    student_number = excluded.student_number,
    full_name = excluded.full_name,
    preferred_name = excluded.preferred_name,
    school_name = excluded.school_name,
    school_acronym = excluded.school_acronym,
    programme_code = excluded.programme_code,
    programme_title = excluded.programme_title,
    year_of_study = excluded.year_of_study,
    level_of_study = excluded.level_of_study,
    has_reasonable_adjustments = excluded.has_reasonable_adjustments,
    advisor_name = excluded.advisor_name,
    advisor_email = excluded.advisor_email,
    advisor_office = excluded.advisor_office
`)

/**
 * Get the student profile for a user.
 * @param {number} userId
 * @returns {object|undefined} The profile row, or undefined if none exists
 */
export function getProfile(userId) {
  return findProfileByUserId.get(userId)
}

/**
 * Create or update a student profile. Uses SQLite UPSERT so callers don't
 * need to check whether a profile already exists.
 * @param {object} p : Profile fields (see student_profiles columns)
 * @returns {number} Number of rows changed (always 1)
 */
export function upsertStudentProfile(p) {
  return upsertProfile.run(
    p.user_id, p.student_number, p.full_name, p.preferred_name,
    p.school_name, p.school_acronym, p.programme_code, p.programme_title,
    p.year_of_study, p.level_of_study, p.has_reasonable_adjustments ? 1 : 0,
    p.advisor_name, p.advisor_email, p.advisor_office
  ).changes
}
