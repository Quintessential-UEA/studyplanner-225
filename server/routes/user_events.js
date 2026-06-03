// ─── server/routes/user_events.js ────────────────────────────────────────────
// API routes for user-created personal calendar events.
// All paths relative to /api/user-events.
//
// Endpoints:
//   GET    /               All user events
//   POST   /               Create a new user event
//   PUT    /:id            Update a user event
//   DELETE /:id            Delete a user event
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import {
  getUserEvents,
  getUserEventById,
  createUserEvent,
  updateUserEvent,
  deleteUserEvent,
} from '../db/dal/user_events.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/user-events : all user events
router.get('/', (req, res) => {
  res.json(getUserEvents(USER_ID))
})

// POST /api/user-events : create a new user event
router.post('/', (req, res) => {
  try {
    const result = createUserEvent({ user_id: USER_ID, ...req.body, email : req.body.email, email_sent: 0 })
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/user-events/:id : update a user event
router.put('/:id', (req, res) => {
  const changes = updateUserEvent(Number(req.params.id), USER_ID, req.body)
  if (changes === 0) return res.status(404).json({ error: 'User event not found' })
  res.json({ success: true })
})

// DELETE /api/user-events/:id : delete a user event
router.delete('/:id', (req, res) => {
  const changes = deleteUserEvent(Number(req.params.id), USER_ID)
  if (changes === 0) return res.status(404).json({ error: 'User event not found' })
  res.json({ success: true })
})

export default router
