// ─── server/routes/user.js ───────────────────────────────────────────────────
// API routes for user profile data. All paths relative to /api/user.
//
// Endpoints:
//   GET  /profile   Current user's account + student profile
// ──────────────────────────────────────────────────────────────────────────────
import express from 'express'
import db from '../db/index.js'
import { getUserById, getProfile } from '../db/dal/users.js'

const router = express.Router()

// TEMP ONLY 
let CURRENT_USER_ID = 1

// ─── LOGIN ─────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }

  let user = db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).get(email)

  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (email, password) VALUES (?, ?)'
    ).run(email, 'temp')

    user = {
      id: result.lastInsertRowid,
      email
    }
  }

  CURRENT_USER_ID = user.id

  res.json({ userId: user.id })
})

// ─── PROFILE ─────────────────────
router.get('/profile', (req, res) => {
  const user = getUserById(CURRENT_USER_ID)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const profile = getProfile(CURRENT_USER_ID)

  const { password, ...safeUser } = user
  res.json({ ...safeUser, ...profile })
})

export default router
