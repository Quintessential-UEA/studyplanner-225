// ─── server/routes/events.js ─────────────────────────────────────────────────
// API routes for calendar events. All paths relative to /api/events.
//
// Endpoints:
//   GET  /   All events across the user's enrolled modules
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { getEventsForUser } from '../db/dal/events.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/events : all events for the current user's enrolled modules
router.get('/', (req, res) => {
  res.json(getEventsForUser(USER_ID))
})

export default router
