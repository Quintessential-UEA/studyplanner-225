// server/db/add-activity-time-column.js
import db from './index.js'

const columns = db.prepare(`PRAGMA table_info(activities)`).all()
const hasTimeSpentMinutes = columns.some((column) => column.name === 'time_spent_minutes')

if (hasTimeSpentMinutes) {
  console.log('time_spent_minutes already exists on activities')
  process.exit(0)
}

db.prepare(`
  ALTER TABLE activities
  ADD COLUMN time_spent_minutes INTEGER NOT NULL DEFAULT 0
`).run()

console.log('Added time_spent_minutes to activities')