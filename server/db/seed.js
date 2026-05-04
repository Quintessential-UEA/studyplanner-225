// ─── server/db/seed.js ────────────────────────────────────────────────────────
// Run this script AFTER migrate.js to populate the database with sample data.
// This lets frontend work with dummy data immediately, without needing
// to manually create accounts, modules, tasks, etc. through the UI.
//
// Usage (run AFTER migrate.js):
//   node db/seed.js
//
// ─── What is Seeding? ────────────────────────────────────────────────────────
// "Seeding" means inserting a known, consistent set of test data into the
// database. Good seed data:
//   - Covers enough variety to test edge cases (empty lists, long names, etc.)
//   - Is easy to understand (not random UUIDs or Lorem Ipsum)
//   - Matches the realistic shape of real user data
//
// ─── TODO ────────────────────────────────────────────────────────────────────
// Write INSERT statements below after migrate.js tables are defined.
// At minimum, seed data must include:
//   - 1 user account
//   - 1 semester with 3 modules (one year long, two sem long?)
//   - A handful of assessments with "Hub-defined" data per module
//   - Some tasks and activities
// ──────────────────────────────────────────────────────────────────────────────

// DEVNOTE: This file is a scaffold. It is not yet functional.


// import Database from 'better-sqlite3'
// import path from 'path'
// import { fileURLToPath } from 'url'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))
// const DB_PATH = path.join(__dirname, 'database.sqlite')
// const db = new Database(DB_PATH)

// ─── Sample User ─────────────────────────────────────────────────────────────
// TODO: const insertUser = db.prepare(`
//   INSERT INTO users (name, email, password) VALUES (?, ?, ?)
// `)
// Password should be a bcrypt hash of a known test password (e.g. "password123")
// TODO: insertUser.run('Jane Doe', '[EMAIL_ADDRESS]', '<bcrypt_hash>')

// ─── Sample Semester ─────────────────────────────────────────────────────────
// TODO: const insertSemester = db.prepare(`
//   INSERT INTO semesters (user_id, name, start_date, end_date) VALUES (?, ?, ?, ?)
// `)
// TODO: insertSemester.run(1, 'Semester 2 2026', '2026-02-17', '2026-06-20')

// ─── Sample Modules ──────────────────────────────────────────────────────────
// TODO: Insert 3 modules linked to the semester above

// ─── Sample Tasks & Activities ───────────────────────────────────────────────
// TODO: Insert sample tasks and activities linked to the modules/assessments

// console.log('OK: Seed complete. Sample data inserted.')
// db.close()

console.log('WARN: seed.js is a scaffold. Fill in INSERT statements after migrate.js is complete.')
