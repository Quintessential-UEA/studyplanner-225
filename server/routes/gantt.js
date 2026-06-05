import express from 'express'
import db from '../db/index.js'

const router = express.Router()

router.get('/', (req, res) => {
  const userId = Number(req.query.userId || 1)
  const moduleCode = req.query.moduleCode

  const taskParams = moduleCode ? [userId, moduleCode] : [userId]
  const moduleFilter = moduleCode ? 'AND t.module_code = ?' : ''

  const tasks = db.prepare(`
    SELECT
      t.id,
      t.title,
      t.module_code,
      t.status,
      t.due_date,
      t.scheduled_date
    FROM tasks t
    WHERE t.user_id = ?
    ${moduleFilter}
    ORDER BY
      CASE t.status
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'completed' THEN 3
        ELSE 4
      END,
      COALESCE(t.scheduled_date, t.due_date)
  `).all(...taskParams)

  const milestones = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.target_date,
      a.module_code
    FROM milestones m
    LEFT JOIN assessments a ON m.assessment_id = a.id
    WHERE m.user_id = ?
    ${moduleCode ? 'AND a.module_code = ?' : ''}
    ORDER BY m.target_date
  `).all(...taskParams)

  const dependencies = db.prepare(`
    SELECT task_id, depends_on_task_id
    FROM task_dependencies
    WHERE user_id = ?
  `).all(userId)

  const today = new Date().toISOString().slice(0, 10)

  const ganttItems = [
    ...tasks.map(task => {
      const startDate = task.scheduled_date || task.due_date || today
      const endDate = task.due_date || task.scheduled_date || startDate

      return {
        id: `task-${task.id}`,
        name: task.title,
        type: 'task',
        moduleCode: task.module_code,
        start: startDate,
        end: endDate,
        status: task.status || 'pending',
        dependencies: dependencies
          .filter(dep => dep.task_id === task.id)
          .map(dep => `task-${dep.depends_on_task_id}`)
      }
    }),

    ...milestones.map(milestone => {
      const date = milestone.target_date || today

      return {
        id: `milestone-${milestone.id}`,
        name: milestone.title,
        type: 'milestone',
        moduleCode: milestone.module_code,
        start: date,
        end: date,
        status: '',
        dependencies: []
      }
    })
  ]

  res.json(ganttItems)
})

router.get('/debug', (req, res) => {
  const users = db.prepare(`SELECT * FROM users`).all()
  const tasks = db.prepare(`SELECT * FROM tasks`).all()
  const milestones = db.prepare(`SELECT * FROM milestones`).all()

  res.json({
    users,
    tasks,
    milestones
  })
})

export default router