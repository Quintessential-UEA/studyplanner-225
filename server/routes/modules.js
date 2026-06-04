// server/routes/modules.js
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
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  const modules = getModulesForUser(req.userId)
  res.json(modules)
})

router.get('/:code', (req, res) => {
  const detail = getFullModuleDetail(req.params.code)
  if (!detail) {
    return res.status(404).json({ error: 'Module not found' })
  }
  res.json(detail)
})

router.get('/:code/assessments', (req, res) => {
  res.json(getAssessmentsByModule(req.params.code))
})

router.get('/:code/events', (req, res) => {
  res.json(getEventsByModule(req.params.code))
})

router.get('/:code/resources', (req, res) => {
  res.json(getResourcesWithAuthors(req.params.code))
})

router.get('/:code/weekly-topics', (req, res) => {
  res.json(getWeeklyTopicsWithSubtopics(req.params.code))
})

router.put('/:code/color', (req, res) => {
  const { theme_color } = req.body
  const updated = updateUserModuleColor(req.userId, req.params.code, theme_color)

  if (updated) {
    return res.json({ success: true })
  }

  return res.status(404).json({ error: 'Module enrolment not found' })
})

export default router