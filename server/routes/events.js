// server/routes/events.js
import express from 'express'
import { getEventsForUser } from '../db/dal/events.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  res.json(getEventsForUser(req.userId))
})

export default router