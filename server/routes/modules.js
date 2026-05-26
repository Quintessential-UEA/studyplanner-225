// ─── server/routes/modules.js ────────────────────────────────────────────────
// API routes for module data. All paths are relative to /api/modules.
//
// Endpoints:
//   GET  /                     All modules the user is enrolled in
//   GET  /:code                Full module detail (staff, topics, outcomes)
//   GET  /:code/assessments    Assessments for a module
//   GET  /:code/events         Events for a module
//   GET  /:code/resources      Resources (with authors) for a module
//   GET  /:code/weekly-topics  Weekly topics (with subtopics) for a module
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import {
  getModulesForUser,
  getFullModuleDetail,
  updateUserModuleColor,
} from '../db/dal/modules.js'
import { getAssessmentsByModule } from '../db/dal/assessments.js'
import { getEventsByModule } from '../db/dal/events.js'
import { getResourcesWithAuthors } from '../db/dal/resources.js'
import { getWeeklyTopicsWithSubtopics } from '../db/dal/weeklyTopics.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/modules : all enrolled modules for the current user
router.get('/', (req, res) => {
  const modules = getModulesForUser(USER_ID)
  res.json(modules)
})

// GET /api/modules/:code : full detail for a single module
router.get('/:code', (req, res) => {
  const detail = getFullModuleDetail(req.params.code)
  if (!detail) return res.status(404).json({ error: 'Module not found' })
  res.json(detail)
})

// GET /api/modules/:code/assessments
router.get('/:code/assessments', (req, res) => {
  res.json(getAssessmentsByModule(req.params.code))
})

// GET /api/modules/:code/events
router.get('/:code/events', (req, res) => {
  res.json(getEventsByModule(req.params.code))
})

// GET /api/modules/:code/resources
router.get('/:code/resources', (req, res) => {
  res.json(getResourcesWithAuthors(req.params.code))
})

// GET /api/modules/:code/weekly-topics
router.get('/:code/weekly-topics', (req, res) => {
  res.json(getWeeklyTopicsWithSubtopics(req.params.code))
})

// PUT /api/modules/:code/color
router.put('/:code/color', (req, res) => {
  const { theme_color } = req.body
  const updated = updateUserModuleColor(USER_ID, req.params.code, theme_color)
  if (updated) {
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'Module enrolment not found' })
  }
})

export default router
