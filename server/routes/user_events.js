// server/routes/user_events.js
import express from 'express'
import {
  getUserEvents,
  createUserEvent,
  updateUserEvent,
  deleteUserEvent,
} from '../db/dal/user_events.js'
import { getUserById } from '../db/dal/users.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  res.json(getUserEvents(req.userId))
})

router.post('/', (req, res) => {
  try {
    const user = getUserById(req.userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = createUserEvent({
      user_id: req.userId,
      ...req.body,
      email: user.email,
      email_sent: 0,
    })

    return res.status(201).json(result)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  const user = getUserById(req.userId)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const changes = updateUserEvent(
    Number(req.params.id),
    req.userId,
    req.body,
    user.email
  )

  if (changes === 0) {
    return res.status(404).json({ error: 'User event not found' })
  }

  return res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const changes = deleteUserEvent(Number(req.params.id), req.userId)

  if (changes === 0) {
    return res.status(404).json({ error: 'User event not found' })
  }

  return res.json({ success: true })
})

export default router