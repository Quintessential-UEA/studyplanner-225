import express from 'express'
import {
  getAssessmentsForUser,
  getFullAssessmentDetail,
} from '../db/dal/assessments.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  try {
    console.log('[assessments] GET /api/assessments for user:', req.userId)

    const assessments = getAssessmentsForUser(req.userId)

    console.log('[assessments] count:', Array.isArray(assessments) ? assessments.length : 'not-an-array')

    return res.json(assessments)
  } catch (err) {
    console.error('[assessments] list failed:', err)
    return res.status(500).json({
      error: 'Failed to load assessments',
      detail: err.message,
    })
  }
})

router.get('/:id', (req, res) => {
  try {
    const assessmentId = Number(req.params.id)

    if (!Number.isInteger(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment id' })
    }

    const allowed = getAssessmentsForUser(req.userId).some(
      (assessment) => assessment.id === assessmentId
    )

    if (!allowed) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    const detail = getFullAssessmentDetail(assessmentId)

    if (!detail) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    return res.json(detail)
  } catch (err) {
    console.error('[assessments] detail failed:', err)
    return res.status(500).json({
      error: 'Failed to load assessment detail',
      detail: err.message,
    })
  }
})

export default router