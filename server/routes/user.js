// server/routes/user.js
import express from 'express'
import {
  createUser,
  getProfile,
  getUserByEmail,
  getUserById,
} from '../db/dal/users.js'
import { requireAuth, signAuthToken } from '../middleware/auth.js'

const router = express.Router()

function sanitizeUser(user) {
  const { password, ...safeUser } = user
  return safeUser
}

function normaliseEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

router.post('/login', (req, res) => {
  const email = normaliseEmail(req.body.email)

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  let user = getUserByEmail(email)

  if (!user) {
    const created = createUser(email, '__email_only__')
    user = getUserById(Number(created.id))
  }

  if (!user) {
    return res.status(500).json({ error: 'Failed to create or load user' })
  }

  const profile = getProfile(user.id) ?? {}
  const token = signAuthToken(user)

  return res.json({
    token,
    user: {
      ...sanitizeUser(user),
      ...profile,
    },
  })
})

router.get('/profile', requireAuth, (req, res) => {
  const user = getUserById(req.userId)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const profile = getProfile(req.userId) ?? {}

  return res.json({
    ...sanitizeUser(user),
    ...profile,
  })
})

export default router