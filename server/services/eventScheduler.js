import cron from 'node-cron'
import db from '../db/index.js'
import transporter from '../services/email.js'
import {getDueEvents} from '../db/dal/events.js'
import { getEmail } from '../state/userState.js'

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    console.log('Checking events...')

    try {
      const now = new Date().toISOString()

    
      const events = await getDueEvents(now)

      console.log("Due events:", events)
      console.log("Type:", typeof events)
      console.log("Is array:", Array.isArray(events))

      if (!events || events.length === 0) return

      for (const event of events) {
        try {
          await transporter.sendMail({
            to: event.user_email,
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
    } catch (err) {
      console.error('Scheduler error:', err)
    }
  })
}
