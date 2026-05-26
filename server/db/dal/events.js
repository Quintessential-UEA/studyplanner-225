// ─── server/db/dal/events.js ─────────────────────────────────────────────────
// Data Access Layer for: events, event_staff
//
// Events are scheduled teaching sessions (lectures, labs, etc.) linked to
// modules. Each event can optionally have staff members assigned via the
// event_staff junction table.
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ EVENTS ══════════════════════════════════════════════════════════════════

const findEventById = db.prepare(`SELECT * FROM events WHERE id = ?`)

const findEventsByModule = db.prepare(`
  SELECT * FROM events WHERE module_code = ? ORDER BY start_time
`)

// Get all events across a user's enrolled modules (for calendar views)
const findEventsForUser = db.prepare(`
  SELECT e.*, m.title AS module_title, um.theme_color
  FROM events e
  JOIN user_modules um ON e.module_code = um.module_code
  JOIN modules m ON e.module_code = m.code
  WHERE um.user_id = ?
  ORDER BY e.start_time
`)

/** Get a single event by ID. */
export function getEventById(id) {
  return findEventById.get(id)
}

/** Get all events for a module, ordered by start time. */
export function getEventsByModule(moduleCode) {
  return findEventsByModule.all(moduleCode)
}

/** Get all events across a user's enrolled modules (for calendar). */
export function getEventsForUser(userId) {
  return findEventsForUser.all(userId)
}


// ═══ EVENT STAFF ═════════════════════════════════════════════════════════════

const findStaffForEvent = db.prepare(`
  SELECT s.id, s.name, s.email, s.office
  FROM event_staff es
  JOIN staff s ON es.staff_id = s.id
  WHERE es.event_id = ?
  ORDER BY s.name
`)

/** Get staff members assigned to a specific event. */
export function getStaffForEvent(eventId) {
  return findStaffForEvent.all(eventId)
}

/**
 * Get a complete event with its assigned staff list.
 * @param {number} eventId
 * @returns {object|null}
 */
export function getFullEventDetail(eventId) {
  const event = getEventById(eventId)
  if (!event) return null
  return { ...event, staff: getStaffForEvent(eventId) }
}
