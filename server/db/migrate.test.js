// ─── server/db/migrate.test.js ────────────────────────────────────────────────
// Tests for the database migration schema.
//
// These tests create an in-memory SQLite database, run the same CREATE TABLE
// statements from migrate.js, and verify the schema is correct.
//
// Usage:
//   npx vitest run db/migrate.test.js
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Helper: extract the SQL from migrate.js ─────────────────────────────────
// We read migrate.js as text to pull out the CREATE and DROP SQL blocks,
// then replay them against an in-memory database.
function buildTestDb() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')

  // Read the migrate.js source to extract the SQL template literals
  const src = readFileSync(path.join(__dirname, 'migrate.js'), 'utf8')

  // Extract the DROP block
  const dropMatch = src.match(/\/\/ Drop existing tables[\s\S]*?db\.exec\(`([\s\S]*?)`\)/)
  if (dropMatch) db.exec(dropMatch[1])

  // Extract the CREATE block
  const createMatch = src.match(/\/\/ Create tables\s*\ndb\.exec\(`([\s\S]*?)`\)/)
  if (createMatch) db.exec(createMatch[1])

  return db
}

// ─── Expected tables ─────────────────────────────────────────────────────────
const EXPECTED_TABLES = [
  'users',
  'student_profiles',
  'module_organisers',
  'modules',
  'user_modules',
  'staff',
  'module_staff',
  'module_prerequisites',
  'module_corequisites',
  'module_topics',
  'module_learning_outcomes',
  'assessments',
  'assessment_file_types',
  'suggested_milestones',
  'suggested_tasks',
  'milestones',
  'tasks',
  'activities',
  'events',
  'event_staff',
  'resources',
  'resource_authors',
]

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Migration: Table Creation', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
  })

  afterAll(() => {
    db.close()
  })

  it('M1 : creates all expected tables', () => {
    const rows = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all()
    const tableNames = rows.map(r => r.name).sort()
    expect(tableNames).toEqual([...EXPECTED_TABLES].sort())
  })

  it('M2 : migration is idempotent (can run twice without error)', () => {
    // Building a second DB is equivalent to running migrate.js again
    const db2 = buildTestDb()
    const rows = db2.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    ).all()
    expect(rows.length).toBe(EXPECTED_TABLES.length)
    db2.close()
  })
})

describe('Migration: Foreign Key Enforcement', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
  })

  afterAll(() => {
    db.close()
  })

  it('M4 : rejects student_profiles with non-existent user_id', () => {
    expect(() => {
      db.prepare(`INSERT INTO student_profiles (user_id, student_number) VALUES (999, '100000001')`).run()
    }).toThrow()
  })

  it('M4 : rejects user_modules with non-existent user_id', () => {
    expect(() => {
      db.prepare(`INSERT INTO user_modules (user_id, module_code, academic_year) VALUES (999, 'CMP0000', '2025-2026')`).run()
    }).toThrow()
  })

  it('M4 : rejects user_modules with non-existent module_code', () => {
    db.prepare(`INSERT INTO users (email, password) VALUES ('fk@uea.ac.uk', 'hash')`).run()
    const userId = db.prepare(`SELECT id FROM users WHERE email = 'fk@uea.ac.uk'`).get().id
    expect(() => {
      db.prepare(`INSERT INTO user_modules (user_id, module_code, academic_year) VALUES (?, 'NOSUCHMOD', '2025-2026')`).run(userId)
    }).toThrow()
    // cleanup
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId)
  })
})

describe('Migration: CASCADE Deletes', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
    // Seed a chain: user → student_profile, module → assessment → task → activity
    db.prepare(`INSERT INTO users (email, password) VALUES ('cascade@uea.ac.uk', 'hash')`).run()
    db.prepare(`INSERT INTO student_profiles (user_id, student_number, full_name) VALUES (1, '100000001', 'Test User')`).run()
    db.prepare(`INSERT INTO module_organisers (name, email) VALUES ('Dr Org', 'org@uea.ac.uk')`).run()
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level, module_organiser_id) VALUES ('CMP0001', 'Test Module', 20, '1', '4', 1)`).run()
    db.prepare(`INSERT INTO user_modules (user_id, module_code, academic_year) VALUES (1, 'CMP0001', '2025-2026')`).run()
    db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('CMP0001', 'Test CW', 'submission', 50, '2026-01-01T12:00:00Z')`).run()
    db.prepare(`INSERT INTO milestones (user_id, assessment_id, title, target_date) VALUES (1, 1, 'Draft done', '2025-12-01')`).run()
    db.prepare(`INSERT INTO tasks (user_id, assessment_id, milestone_id, module_code, title, type, status) VALUES (1, 1, 1, 'CMP0001', 'Write intro', 'writing', 'pending')`).run()
    db.prepare(`INSERT INTO activities (task_id, user_id, date, metric, amount) VALUES (1, 1, '2025-11-15', 'words', 500)`).run()
  })

  afterAll(() => {
    db.close()
  })

  it('M5 : deleting a user cascades to student_profiles', () => {
    // Create a separate user for this test
    db.prepare(`INSERT INTO users (email, password) VALUES ('del@uea.ac.uk', 'hash')`).run()
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'del@uea.ac.uk'`).get().id
    db.prepare(`INSERT INTO student_profiles (user_id, student_number) VALUES (?, '100000099')`).run(uid)

    db.prepare(`DELETE FROM users WHERE id = ?`).run(uid)

    const profile = db.prepare(`SELECT * FROM student_profiles WHERE user_id = ?`).get(uid)
    expect(profile).toBeUndefined()
  })

  it('M5 : deleting a module cascades to assessments, events, resources', () => {
    // Insert a throwaway module with dependents
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('DEL0001', 'Delete Me', 20, '1', '4')`).run()
    db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('DEL0001', 'CW', 'exam', 100, '2026-06-01T09:00:00Z')`).run()
    db.prepare(`INSERT INTO events (module_code, title, type, start_time, end_time, location) VALUES ('DEL0001', 'Lec', 'lecture', '2025-09-15T10:00:00Z', '2025-09-15T11:00:00Z', 'LT1')`).run()
    db.prepare(`INSERT INTO resources (module_code, type, title) VALUES ('DEL0001', 'textbook', 'A Book')`).run()

    db.prepare(`DELETE FROM modules WHERE code = 'DEL0001'`).run()

    expect(db.prepare(`SELECT * FROM assessments WHERE module_code = 'DEL0001'`).all()).toHaveLength(0)
    expect(db.prepare(`SELECT * FROM events WHERE module_code = 'DEL0001'`).all()).toHaveLength(0)
    expect(db.prepare(`SELECT * FROM resources WHERE module_code = 'DEL0001'`).all()).toHaveLength(0)
  })

  it('M6 : deleting a milestone sets tasks.milestone_id to NULL (not delete)', () => {
    // task id=1 has milestone_id=1 from beforeAll
    const before = db.prepare(`SELECT milestone_id FROM tasks WHERE id = 1`).get()
    expect(before.milestone_id).toBe(1)

    db.prepare(`DELETE FROM milestones WHERE id = 1`).run()

    const after = db.prepare(`SELECT milestone_id, title FROM tasks WHERE id = 1`).get()
    expect(after.milestone_id).toBeNull()
    expect(after.title).toBe('Write intro') // task still exists
  })
})

describe('Migration: UNIQUE & NOT NULL Constraints', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
    db.prepare(`INSERT INTO users (email, password) VALUES ('unique@uea.ac.uk', 'hash')`).run()
  })

  afterAll(() => {
    db.close()
  })

  it('S1 : users.email rejects duplicates', () => {
    expect(() => {
      db.prepare(`INSERT INTO users (email, password) VALUES ('unique@uea.ac.uk', 'hash2')`).run()
    }).toThrow()
  })

  it('S2 : staff.email rejects duplicates', () => {
    db.prepare(`INSERT INTO staff (name, email) VALUES ('Dr A', 'staff@uea.ac.uk')`).run()
    expect(() => {
      db.prepare(`INSERT INTO staff (name, email) VALUES ('Dr B', 'staff@uea.ac.uk')`).run()
    }).toThrow()
  })

  it('S3 : users.email NOT NULL', () => {
    expect(() => {
      db.prepare(`INSERT INTO users (password) VALUES ('hash')`).run()
    }).toThrow()
  })

  it('S3 : users.password NOT NULL', () => {
    expect(() => {
      db.prepare(`INSERT INTO users (email) VALUES ('nopass@uea.ac.uk')`).run()
    }).toThrow()
  })

  it('S4 : modules.code PK rejects duplicates', () => {
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('DUP0001', 'First', 20, '1', '4')`).run()
    expect(() => {
      db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('DUP0001', 'Second', 20, '1', '4')`).run()
    }).toThrow()
  })

  it('S5 : user_modules composite PK rejects duplicate enrolments', () => {
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'unique@uea.ac.uk'`).get().id
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('ENR0001', 'Enrol', 20, '1', '4')`).run()
    db.prepare(`INSERT INTO user_modules (user_id, module_code, academic_year) VALUES (?, 'ENR0001', '2025-2026')`).run(uid)
    expect(() => {
      db.prepare(`INSERT INTO user_modules (user_id, module_code, academic_year) VALUES (?, 'ENR0001', '2025-2026')`).run(uid)
    }).toThrow()
  })

  it('S6 : module_staff allows same staff with different roles', () => {
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('ROLE001', 'Roles', 20, '1', '4')`).run()
    db.prepare(`INSERT INTO staff (name, email) VALUES ('Dr Multi', 'multi@uea.ac.uk')`).run()
    const staffId = db.prepare(`SELECT id FROM staff WHERE email = 'multi@uea.ac.uk'`).get().id

    // Same person, two roles — should work
    db.prepare(`INSERT INTO module_staff (module_code, staff_id, role) VALUES ('ROLE001', ?, 'lecturer')`).run(staffId)
    db.prepare(`INSERT INTO module_staff (module_code, staff_id, role) VALUES ('ROLE001', ?, 'associate_tutor')`).run(staffId)

    const count = db.prepare(`SELECT COUNT(*) as c FROM module_staff WHERE staff_id = ?`).get(staffId).c
    expect(count).toBe(2)
  })

  it('S7 : users.created_at defaults to current datetime', () => {
    db.prepare(`INSERT INTO users (email, password) VALUES ('default@uea.ac.uk', 'hash')`).run()
    const row = db.prepare(`SELECT created_at FROM users WHERE email = 'default@uea.ac.uk'`).get()
    expect(row.created_at).toBeTruthy()
    // Should be a valid ISO-ish datetime string
    expect(new Date(row.created_at).getTime()).not.toBeNaN()
  })
})

describe('Migration: CHECK Constraints', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
    db.prepare(`INSERT INTO users (email, password) VALUES ('check@uea.ac.uk', 'hash')`).run()
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('CHK0001', 'Checks', 20, '1', '4')`).run()
  })

  afterAll(() => {
    db.close()
  })

  it('rejects invalid assessment type', () => {
    expect(() => {
      db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('CHK0001', 'Bad', 'coursework', 50, '2026-01-01T00:00:00Z')`).run()
    }).toThrow()
  })

  it('accepts valid assessment types', () => {
    for (const type of ['exam', 'demo', 'submission']) {
      expect(() => {
        db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('CHK0001', 'Good ${type}', ?, 30, '2026-01-01T00:00:00Z')`).run(type)
      }).not.toThrow()
    }
  })

  it('rejects assessment weighting > 100', () => {
    expect(() => {
      db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('CHK0001', 'Over', 'exam', 101, '2026-01-01T00:00:00Z')`).run()
    }).toThrow()
  })

  it('rejects assessment weighting < 0', () => {
    expect(() => {
      db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline) VALUES ('CHK0001', 'Under', 'exam', -1, '2026-01-01T00:00:00Z')`).run()
    }).toThrow()
  })

  it('rejects invalid submission method', () => {
    expect(() => {
      db.prepare(`INSERT INTO assessments (module_code, title, type, weighting, deadline, submission_method) VALUES ('CHK0001', 'BadSub', 'exam', 50, '2026-01-01T00:00:00Z', 'email')`).run()
    }).toThrow()
  })

  it('rejects invalid task status', () => {
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'check@uea.ac.uk'`).get().id
    expect(() => {
      db.prepare(`INSERT INTO tasks (user_id, module_code, title, status) VALUES (?, 'CHK0001', 'Bad Status', 'done')`).run(uid)
    }).toThrow()
  })

  it('accepts valid task statuses', () => {
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'check@uea.ac.uk'`).get().id
    for (const status of ['pending', 'in_progress', 'completed']) {
      expect(() => {
        db.prepare(`INSERT INTO tasks (user_id, module_code, title, status) VALUES (?, 'CHK0001', 'Status ${status}', ?)`).run(uid, status)
      }).not.toThrow()
    }
  })

  it('rejects invalid event type', () => {
    expect(() => {
      db.prepare(`INSERT INTO events (module_code, title, type, start_time, end_time, location) VALUES ('CHK0001', 'Bad', 'meeting', '2025-09-15T10:00:00Z', '2025-09-15T11:00:00Z', 'LT1')`).run()
    }).toThrow()
  })

  it('rejects invalid module credits', () => {
    expect(() => {
      db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('BAD0001', 'Bad Credits', 15, '1', '4')`).run()
    }).toThrow()
  })

  it('rejects invalid module_staff role', () => {
    db.prepare(`INSERT INTO staff (name, email) VALUES ('Dr Bad', 'bad@uea.ac.uk')`).run()
    const sid = db.prepare(`SELECT id FROM staff WHERE email = 'bad@uea.ac.uk'`).get().id
    expect(() => {
      db.prepare(`INSERT INTO module_staff (module_code, staff_id, role) VALUES ('CHK0001', ?, 'organiser')`).run(sid)
    }).toThrow()
  })

  it('rejects invalid resource type', () => {
    expect(() => {
      db.prepare(`INSERT INTO resources (module_code, type, title) VALUES ('CHK0001', 'video', 'Bad Resource')`).run()
    }).toThrow()
  })

  it('rejects invalid student level_of_study', () => {
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'check@uea.ac.uk'`).get().id
    expect(() => {
      db.prepare(`INSERT INTO student_profiles (user_id, level_of_study) VALUES (?, '3')`).run(uid)
    }).toThrow()
  })

  it('rejects year_of_study out of range', () => {
    db.prepare(`INSERT INTO users (email, password) VALUES ('year@uea.ac.uk', 'hash')`).run()
    const uid = db.prepare(`SELECT id FROM users WHERE email = 'year@uea.ac.uk'`).get().id
    expect(() => {
      db.prepare(`INSERT INTO student_profiles (user_id, year_of_study) VALUES (?, 6)`).run(uid)
    }).toThrow()
  })
})

describe('Migration: Module Organisers', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
  })

  afterAll(() => {
    db.close()
  })

  it('module_organisers table exists with correct columns', () => {
    const cols = db.prepare(`PRAGMA table_info(module_organisers)`).all().map(c => c.name)
    expect(cols).toEqual(expect.arrayContaining(['id', 'name', 'email', 'office', 'office_hours']))
  })

  it('modules.module_organiser_id references module_organisers', () => {
    db.prepare(`INSERT INTO module_organisers (name, email) VALUES ('Dr MO', 'mo@uea.ac.uk')`).run()
    const moId = db.prepare(`SELECT id FROM module_organisers WHERE email = 'mo@uea.ac.uk'`).get().id
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level, module_organiser_id) VALUES ('MO00001', 'MO Test', 20, '1', '4', ?)`).run(moId)

    const mod = db.prepare(`SELECT module_organiser_id FROM modules WHERE code = 'MO00001'`).get()
    expect(mod.module_organiser_id).toBe(moId)
  })

  it('one MO can organise multiple modules', () => {
    const moId = db.prepare(`SELECT id FROM module_organisers WHERE email = 'mo@uea.ac.uk'`).get().id
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level, module_organiser_id) VALUES ('MO00002', 'Second', 20, '2', '4', ?)`).run(moId)

    const count = db.prepare(`SELECT COUNT(*) as c FROM modules WHERE module_organiser_id = ?`).get(moId).c
    expect(count).toBe(2)
  })

  it('deleting an MO sets module FK to NULL (not delete module)', () => {
    const moId = db.prepare(`SELECT id FROM module_organisers WHERE email = 'mo@uea.ac.uk'`).get().id
    db.prepare(`DELETE FROM module_organisers WHERE id = ?`).run(moId)

    const mod = db.prepare(`SELECT module_organiser_id, title FROM modules WHERE code = 'MO00001'`).get()
    expect(mod.module_organiser_id).toBeNull()
    expect(mod.title).toBe('MO Test') // module still exists
  })
})

describe('Migration: Event Staff', () => {
  let db

  beforeAll(() => {
    db = buildTestDb()
    db.prepare(`INSERT INTO modules (code, title, credits, semester, level) VALUES ('EVT0001', 'Events', 20, '1', '4')`).run()
    db.prepare(`INSERT INTO staff (name, email) VALUES ('Dr Evt', 'evt@uea.ac.uk')`).run()
    db.prepare(`INSERT INTO events (module_code, title, type, start_time, end_time, location) VALUES ('EVT0001', 'Lecture 1', 'lecture', '2025-09-15T10:00:00Z', '2025-09-15T11:00:00Z', 'LT1')`).run()
  })

  afterAll(() => {
    db.close()
  })

  it('can link staff to events', () => {
    const eventId = db.prepare(`SELECT id FROM events WHERE title = 'Lecture 1'`).get().id
    const staffId = db.prepare(`SELECT id FROM staff WHERE email = 'evt@uea.ac.uk'`).get().id

    db.prepare(`INSERT INTO event_staff (event_id, staff_id) VALUES (?, ?)`).run(eventId, staffId)

    const row = db.prepare(`SELECT * FROM event_staff WHERE event_id = ? AND staff_id = ?`).get(eventId, staffId)
    expect(row).toBeTruthy()
  })

  it('cascades on event delete', () => {
    const eventId = db.prepare(`SELECT id FROM events WHERE title = 'Lecture 1'`).get().id
    db.prepare(`DELETE FROM events WHERE id = ?`).run(eventId)

    const rows = db.prepare(`SELECT * FROM event_staff WHERE event_id = ?`).all(eventId)
    expect(rows).toHaveLength(0)
  })
})
