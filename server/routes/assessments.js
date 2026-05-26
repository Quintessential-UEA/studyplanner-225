// ─── server/routes/assessments.js ────────────────────────────────────────────
// API routes for assessment data. All paths are relative to /api/assessments.
//
// Endpoints:
//   GET  /       All assessments across the user's enrolled modules
//   GET  /:id    Full detail for a single assessment (with file types,
//                  suggested milestones, suggested tasks)
// ──────────────────────────────────────────────────────────────────────────────

import express from 'express'
import {
  getAssessmentsForUser,
  getFullAssessmentDetail,
} from '../db/dal/assessments.js'

const router = express.Router()

// Temporary: hardcode userId until auth is implemented
const USER_ID = 1

// GET /api/assessments: all assessments for the current user's modules
router.get('/', (req, res) => {
  res.json(getAssessmentsForUser(USER_ID))
})

// GET /api/assessments/:id: full assessment detail
router.get('/:id', (req, res) => {
  const detail = getFullAssessmentDetail(Number(req.params.id))
  if (!detail) return res.status(404).json({ error: 'Assessment not found' })
  res.json(detail)
})

export default router
