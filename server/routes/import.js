// server/routes/import.js

import express from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { getProfile } from '../db/dal/users.js'
import { validateHubPayload } from '../services/hub/validateHubPayload.js'
import {
  getImportStatusForUser,
  importHubDataForUser,
  ImportConflictError,
} from '../services/hub/importHubData.js'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
})

router.use(requireAuth)

router.get('/status', (req, res) => {
  const profile = getProfile(req.userId)
  const status = getImportStatusForUser(req.userId)

  return res.json({
    ...status,
    hasProfile: Boolean(profile),
  })
})

router.post('/hub', upload.single('hubFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE',
      })
    }

    let payload

    try {
      payload = JSON.parse(req.file.buffer.toString('utf-8'))
    } catch {
      return res.status(400).json({
        error: 'Uploaded file is not valid JSON',
        code: 'INVALID_JSON',
      })
    }

    const validationErrors = validateHubPayload(payload, req.userEmail)

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Hub file validation failed',
        code: 'VALIDATION_FAILED',
        details: validationErrors,
      })
    }

    const summary = importHubDataForUser({
      userId: req.userId,
      payload,
    })

    return res.status(201).json({
      success: true,
      message: 'Hub data imported successfully',
      summary,
    })
  } catch (err) {
    if (err instanceof ImportConflictError || err.code === 'IMPORT_ALREADY_EXISTS') {
      return res.status(409).json({
        error: err.message,
        code: err.code,
      })
    }

    console.error('[import] hub import failed:', err)

    return res.status(500).json({
      error: 'Failed to import Hub data',
      code: 'IMPORT_FAILED',
      detail: err.message,
    })
  }
})

export default router