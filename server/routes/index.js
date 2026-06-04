// server/routes/index.js
import express from 'express'

import moduleRoutes from './modules.js'
import assessmentRoutes from './assessments.js'
import { taskRouter, activityRouter } from './tasks.js'
import eventRoutes from './events.js'
import userRoutes from './user.js'
import userEventRoutes from './user_events.js'
import calendarRoutes from './calendar.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'API router is live' })
})

router.use('/modules', moduleRoutes)
router.use('/assessments', assessmentRoutes)
router.use('/tasks', taskRouter)
router.use('/activities', activityRouter)
router.use('/events', eventRoutes)
router.use('/user', userRoutes)
router.use('/user-events', userEventRoutes)
router.use('/calendar', calendarRoutes)

export default router