// ─── server/db/dal/user_events.js ────────────────────────────────────────────
// Data Access Layer for: user_events
//
// User events are personal calendar entries created by the user (not tied to
// a module's academic schedule). They are fully editable and should support
// optional recurrence.
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ QUERIES ═════════════════════════════════════════════════════════════════

const findUserEvents = db.prepare(`
  SELECT * FROM user_events WHERE user_id = ? ORDER BY start_time
`)

const findUserEventById = db.prepare(`
  SELECT * FROM user_events WHERE id = ? AND user_id = ?
`)

const insertUserEvent = db.prepare(`
  INSERT INTO user_events (
    user_id, title, description, start_time, end_time,
    is_all_day, color, location,
    is_recurring, recurrence_pattern, recurrence_end_date, 
    email
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const updateUserEventStmt = db.prepare(`
  UPDATE user_events SET
    title = ?, description = ?, start_time = ?, end_time = ?,
    is_all_day = ?, color = ?, location = ?,
    is_recurring = ?, recurrence_pattern = ?, recurrence_end_date = ?,
    email = ?
  WHERE id = ? AND user_id = ?
`)

const deleteUserEventStmt = db.prepare(`
  DELETE FROM user_events WHERE id = ? AND user_id = ?
`)

// ═══ EXPORTS ═════════════════════════════════════════════════════════════════

/** Get all user events, ordered by start time. */
export function getUserEvents(userId) {
  return findUserEvents.all(userId)
}

/** Get a single user event by ID (scoped to user). */
export function getUserEventById(id, userId) {
  return findUserEventById.get(id, userId)
}

/**
 * Create a new user event.
 * @param {object} e : Event fields
 * @returns {object} { id } of the new event
 */
export function createUserEvent(e) {
  const result = insertUserEvent.run(
    e.user_id, e.title, e.description ?? null,
    e.start_time, e.end_time ?? null,
    e.is_all_day ?? 0, e.color ?? '#6366f1', e.location ?? null,
    e.is_recurring ?? 0, e.recurrence_pattern ?? null,
    e.recurrence_end_date ?? null,
    e.email
  )
  return { id: result.lastInsertRowid }
}

/** Update a user event. Only the owning user can update. */
export function updateUserEvent(id, userId, fields, email) {
  return updateUserEventStmt.run(
    fields.title, fields.description ?? null,
    fields.start_time, fields.end_time ?? null,
    fields.is_all_day ?? 0, fields.color ?? '#6366f1', fields.location ?? null,
    fields.is_recurring ?? 0, fields.recurrence_pattern ?? null,
    fields.recurrence_end_date ?? null,
    fields.email,
    id, userId
  ).changes
}

/** Delete a user event. Only the owning user can delete. */
export function deleteUserEvent(id, userId) {
  return deleteUserEventStmt.run(id, userId).changes
}

