// ─── server/routes/user.js ───────────────────────────────────────────────────
// API routes for user profile data. All paths relative to /api/user.
//
// Endpoints:
//   GET  /profile   Current user's account + student profile
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { getUserById, getProfile } from '../db/dal/users.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/user/profile : combined user + student_profiles data
router.get('/profile', (req, res) => {
  const user = getUserById(USER_ID)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const profile = getProfile(USER_ID)

  // Merge user account fields with student profile fields,
  // omitting the password hash from the response.
  const { password, ...safeUser } = user
  res.json({ ...safeUser, ...profile })
})

export default router
