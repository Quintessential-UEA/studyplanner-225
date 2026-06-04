// server/db/dal/user_events.js
import db from '../index.js'

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

export function getUserEvents(userId) {
  return findUserEvents.all(userId)
}

export function getUserEventById(id, userId) {
  return findUserEventById.get(id, userId)
}

export function createUserEvent(event) {
  const result = insertUserEvent.run(
    event.user_id,
    event.title,
    event.description ?? null,
    event.start_time,
    event.end_time ?? null,
    event.is_all_day ?? 0,
    event.color ?? '#6366f1',
    event.location ?? null,
    event.is_recurring ?? 0,
    event.recurrence_pattern ?? null,
    event.recurrence_end_date ?? null,
    event.email ?? null
  )

  return { id: result.lastInsertRowid }
}

export function updateUserEvent(id, userId, fields, email) {
  return updateUserEventStmt.run(
    fields.title,
    fields.description ?? null,
    fields.start_time,
    fields.end_time ?? null,
    fields.is_all_day ?? 0,
    fields.color ?? '#6366f1',
    fields.location ?? null,
    fields.is_recurring ?? 0,
    fields.recurrence_pattern ?? null,
    fields.recurrence_end_date ?? null,
    email ?? null,
    id,
    userId
  ).changes
}

export function deleteUserEvent(id, userId) {
  return deleteUserEventStmt.run(id, userId).changes
}