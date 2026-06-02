import cron from 'node-cron'
import db from '../db/index.js'
import transporter from '../services/email.js'
import {getDueEvents} from '../db/dal/events.js'

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    console.log('Checking events...')

    const now = new Date().toISOString()


    const events = getDueEvents(now)

    if (events.length === 0) return

    for (const event of events) {
      try {
        await transporter.sendMail({
          to: email,
          subject: event.title,
          text: `Your event "${event.title}" is happening now.`,
        })

        db.prepare(`
          UPDATE events
          SET email_sent = 1
          WHERE id = ?
        `).run(event.id)

      } catch (err) {
        console.error('Email failed:', event.id, err)
      }
    }
  })
}
