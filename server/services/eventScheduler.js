import cron from 'node-cron'
import db from '../db/index.js'
import transporter from '../routes/email.js'


export function startScheduler(){
  cron.schedule('* * * * *', async () => {
    console.log('Checking events...')
    const now = new Date().toISOString()
    const events = db.prepare(`
      SELECT * FROM events
      WHERE event_start <= ?
      AND email_sent = 0
`).all(now)

    if(events.length == 0) return 

  for(const event of events){
      try{
        await transporter.sendMail({
          to: event.email,
          subject: event.title,
          text: `Your event  "${event.title}" is happening now. `,
        })
      }

      db.prepare(`
      UPDATE events
      SET email_sent = 1
      WHERE id = ?
`).run(event.id)
    }catch(err){
      console.error('Email failed for event: ', event.id, err)
    }
  })
}
