// ─── server/routes/index.js ───────────────────────────────────────────────────
// Central API router. All sub-routers are mounted here at their path prefixes.
//
// In server/index.js this entire router is mounted at '/api', so:
//   moduleRoutes    GET /api/modules, GET /api/modules/:code, etc.
//   assessRoutes    GET /api/assessments, GET /api/assessments/:id
//   taskRoutes      GET/POST /api/tasks, PUT/PATCH/DELETE /api/tasks/:id
//   activityRoutes  GET/POST /api/activities, DELETE /api/activities/:id
//   eventRoutes     GET /api/events
//   userRoutes      GET /api/user/profile
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'

// Import route groups
import moduleRoutes from './modules.js'
import assessmentRoutes from './assessments.js'
import { taskRouter, activityRouter } from './tasks.js'
import eventRoutes from './events.js'
import userRoutes from './user.js'
import userEventRoutes from './user_events.js'
import calendarRoutes from './calendar.js'

const router = express.Router()

// ─── Health Check ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ message: 'API router is live' })
})

// ─── Route Mounts ────────────────────────────────────────────────────────────
router.use('/modules', moduleRoutes)
router.use('/assessments', assessmentRoutes)
router.use('/tasks', taskRouter)
router.use('/activities', activityRouter)
router.use('/events', eventRoutes)
router.use('/user', userRoutes)
router.use('/user-events', userEventRoutes)
router.use('/calendar', calendarRoutes)

export default router
