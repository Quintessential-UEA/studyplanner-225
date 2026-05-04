// ─── server/routes/index.js ───────────────────────────────────────────────────
// This is the central API router. It groups all sub-routers together and
// mounts them at their respective path prefixes.
//
// ─── How Express Routing Works ────────────────────────────────────────────────
// express.Router() creates a mini-application that handles a subset of routes.
// In server/index.js, this entire router is mounted at '/api', so:
//
//   router.use('/tasks',      taskRoutes)   →  accessible at  GET /api/tasks
//   router.use('/activities', activityRoutes) →  accessible at GET /api/activities
//   etc.
//
// ─── Adding New Route Groups ──────────────────────────────────────────────────
// 1. Create a new file: server/routes/myFeature.js
// 2. Define your routes in it using express.Router()
// 3. Import it here and add: router.use('/myFeature', myFeatureRoutes)
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'

// Import individual route group files (create these as we build each feature)
// EXAMPLES:
//   import semesterRoutes  from './semesters.js'
//   import taskRoutes      from './tasks.js'
//   import activityRoutes  from './activities.js'
//   import dashboardRoutes from './dashboard.js'

const router = express.Router()

// ─── Placeholder Health Check ────────────────────────────────────────────────
// Returns a simple JSON response confirming the /api prefix is reachable.
// Replace this with real routes as we build them.
router.get('/', (req, res) => {
  res.json({
    message: 'API router is live',
    availableEndpoints: [
      'GET  /api/semesters/:id/modules',
      'POST /api/tasks  |  GET/PUT/DELETE /api/tasks/:id',
      'POST /api/activities  |  GET/PUT/DELETE /api/activities/:id',
      'GET  /api/dashboard/summary',
    ],
  })
})

// ─── Route Mounts ────────────────────────────────────────────────────────────
// Uncomment OR add new lines as we create the corresponding route file:
// router.use('/semesters',  semesterRoutes)
// router.use('/tasks',      taskRoutes)
// router.use('/activities', activityRoutes)
// router.use('/dashboard',  dashboardRoutes)

export default router
