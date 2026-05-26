// ─── server/db/seed.js ────────────────────────────────────────────────────────
// Run this script AFTER migrate.js to populate the database with sample data.
//
// Usage (run AFTER migrate.js):
//   node db/seed.js
//
// Seeds: 1 user, 1 student profile, 3 modules (1 real + 2 foobar),
//        assessments, events, resources, weekly topics, staff,
//        sample tasks and activities.
// ──────────────────────────────────────────────────────────────────────────────

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'database.sqlite')
const db = new Database(DB_PATH)

db.pragma('foreign_keys = ON')

// ─── Helper: hash a password (simple sha256 for seed data only) ──────────────
// In production use bcrypt. This is just so the field isn't plaintext.
function hashPassword(pw) {
    return createHash('sha256').update(pw).digest('hex')
}

// ─── Wrap everything in a transaction for speed and atomicity ─────────────────
const seed = db.transaction(() => {

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. USER
    // ═══════════════════════════════════════════════════════════════════════════
    const insertUser = db.prepare(`
    INSERT INTO users (email, password) VALUES (?, ?)
  `)
    const userResult = insertUser.run('jane.doe@uea.ac.uk', hashPassword('password123'))
    const userId = userResult.lastInsertRowid

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. STUDENT PROFILE
    // ═══════════════════════════════════════════════════════════════════════════
    db.prepare(`
    INSERT INTO student_profiles (
      user_id, student_number, full_name, preferred_name,
      school_name, school_acronym, programme_code, programme_title,
      year_of_study, level_of_study, has_reasonable_adjustments,
      advisor_name, advisor_email, advisor_office
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        userId, '100000000', 'Jane Doe', 'Jane',
        'School of Computing Sciences', 'CMP', 'G400', 'BSc (Hons) Computing Science',
        2, '5', 0,
        'Dr Academic Advisor', 'a.advisor@uea.ac.uk', 'SCI 2.10'
    )

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. MODULE ORGANISERS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertOrganiser = db.prepare(`
    INSERT INTO module_organisers (name, email, office, office_hours) VALUES (?, ?, ?, ?)
  `)
    const org1 = insertOrganiser.run('Max Mustermann', 'm.mustermann@uea.ac.uk', 'SCI 2.20', 'Wednesdays 14:00-16:00')
    const org2 = insertOrganiser.run('Dr Foo Bar', 'f.bar@uea.ac.uk', 'SCI 1.10', 'Thursdays 10:00-12:00')
    const org3 = insertOrganiser.run('Dr Baz Qux', 'b.qux@uea.ac.uk', 'SCI 3.05', 'Fridays 11:00-13:00')

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. MODULES
    // ═══════════════════════════════════════════════════════════════════════════
    const insertModule = db.prepare(`
    INSERT INTO modules (
      code, title, credits, semester, level, description,
      module_organiser_id, blackboard_url,
      study_hours_lectures, study_hours_labs, study_hours_independent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

    insertModule.run(
        'CMP5012B', 'Software Engineering', 20, '2', '5',
        'Software Engineering is one of the most essential skills for work in the software development industry. Covers phased software development methodologies from initial class model design to operational software systems, complemented with software project management and development facilitation.',
        org1.lastInsertRowid, 'https://learn.uea.ac.uk',
        22, 22, 156
    )

    insertModule.run(
        'CMP5014B', 'DATA STRUCTURES AND ALGORITHMS', 20, '2', '5',
        'Introduces fundamental data structures and algorithmic paradigms. Topics include complexity analysis (Big O), sorting, searching, lists, stacks, queues, trees, graphs, and basic graph algorithms. Emphasis is placed on choosing appropriate structures and algorithms to solve real-world computational problems efficiently.',
        org2.lastInsertRowid, 'https://learn.uea.ac.uk/',
        22, 22, 156
    )

    insertModule.run(
        'CMP5045B', 'EMBEDDED SYSTEMS', 20, 'year_long', '5',
        'Explores the design, development, and interfacing of embedded systems. Covers microcontroller architectures, register-level peripheral configuration (GPIO, timers, ADC), interrupt handling, and real-time firmware development in C. Students will gain practical experience working with development kits and debugging tools.',
        org3.lastInsertRowid, 'https://learn.uea.ac.uk/',
        22, 22, 156
    )

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. USER <-> MODULE ENROLMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertEnrolment = db.prepare(`
    INSERT INTO user_modules (user_id, module_code, academic_year, theme_color) VALUES (?, ?, ?, ?)
  `)
    insertEnrolment.run(userId, 'CMP5012B', '2025-2026', '#3B82F6')
    insertEnrolment.run(userId, 'CMP5014B', '2025-2026', '#10B981')
    insertEnrolment.run(userId, 'CMP5045B', '2025-2026', '#F59E0B')

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. STAFF
    // ═══════════════════════════════════════════════════════════════════════════
    const insertStaff = db.prepare(`
    INSERT INTO staff (name, email, office) VALUES (?, ?, ?)
  `)
    const staff1 = insertStaff.run('Temi Alade', 't.alade@uea.ac.uk', null)
    const staff2 = insertStaff.run('Alex Palmer', 'a.palmer@uea.ac.uk', null)
    const staff3 = insertStaff.run('Dr Foo Bar', 'f.bar@uea.ac.uk', 'SCI 1.10')
    const staff4 = insertStaff.run('Dr Baz Qux', 'b.qux@uea.ac.uk', 'SCI 3.05')
    const staff5 = insertStaff.run('Quux Corge', 'q.corge@uea.ac.uk', null)

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. MODULE ↔ STAFF
    // ═══════════════════════════════════════════════════════════════════════════
    const insertModuleStaff = db.prepare(`
    INSERT INTO module_staff (module_code, staff_id, role, responsibilities) VALUES (?, ?, ?, ?)
  `)
    insertModuleStaff.run('CMP5012B', staff1.lastInsertRowid, 'lecturer', 'Lectures 1, 7-11 and lab sessions')
    insertModuleStaff.run('CMP5012B', staff2.lastInsertRowid, 'lecturer', 'Lectures 2-6 and lab sessions')
    insertModuleStaff.run('CMP5014B', staff3.lastInsertRowid, 'lecturer', 'All lectures and labs')
    insertModuleStaff.run('CMP5045B', staff4.lastInsertRowid, 'lecturer', 'All lectures')
    insertModuleStaff.run('CMP5045B', staff5.lastInsertRowid, 'associate_tutor', 'Lab sessions')

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. MODULE TOPICS & LEARNING OUTCOMES
    // ═══════════════════════════════════════════════════════════════════════════
    const insertTopic = db.prepare(`INSERT INTO module_topics (module_code, topic) VALUES (?, ?)`)
    const insertOutcome = db.prepare(`INSERT INTO module_learning_outcomes (module_code, outcome) VALUES (?, ?)`)

    // CMP5012B topics
    const seTopics = [
        'Requirements Engineering and Project Vision',
        'Software Architecture and System Structure',
        'Software Design and Interaction Modelling',
        'Project Planning Tools and Documentation',
        'Integrating Software Design and Implementation',
        'Server-side Programming in NodeJS',
        'MVC and Server-side Rendering in NodeJS',
        'Database Integration in NodeJS',
        'Securing NodeJS Applications',
        'Summary and Emerging Trends'
    ]
    for (const t of seTopics) insertTopic.run('CMP5012B', t)

    // CMP5012B learning outcomes
    const seOutcomes = [
        'Describe the objectives of software design in terms of software requirements and quality attributes',
        'Develop UML models including class diagrams, use cases, sequence diagrams, state diagrams',
        'Understand the relationship between UML models and code, and transfer diagrams into code',
        'Work together in teams to tackle technical problems in a group project context',
        'Develop skills for coping with and managing parallel implementation tasks'
    ]
    for (const o of seOutcomes) insertOutcome.run('CMP5012B', o)

    // CMP5014B topics
    for (const t of ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet']) {
        insertTopic.run('CMP5014B', t)
    }
    insertOutcome.run('CMP5014B', 'Lorem ipsum dolor sit amet outcomes 1')
    insertOutcome.run('CMP5014B', 'Lorem ipsum dolor sit amet outcomes 2')

    // CMP5045B topics
    for (const t of ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet']) {
        insertTopic.run('CMP5045B', t)
    }
    insertOutcome.run('CMP5045B', 'Lorem ipsum dolor sit amet outcomes 1')
    insertOutcome.run('CMP5045B', 'Lorem ipsum dolor sit amet outcomes 2')
    insertOutcome.run('CMP5045B', 'Lorem ipsum dolor sit amet outcomes 3')

    // CMP5014B prerequisite
    db.prepare(`INSERT INTO module_prerequisites (module_code, required_module_code) VALUES (?, ?)`).run('CMP5014B', 'CMP4011A')

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. ASSESSMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertAssessment = db.prepare(`
    INSERT INTO assessments (module_code, title, type, weighting, deadline, submission_method, description, word_limit, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    const insertFileType = db.prepare(`INSERT INTO assessment_file_types (assessment_id, file_type) VALUES (?, ?)`)
    const insertSugMilestone = db.prepare(`
    INSERT INTO suggested_milestones (assessment_id, title, suggested_deadline, description, completion_percentage)
    VALUES (?, ?, ?, ?, ?)
  `)
    const insertSugTask = db.prepare(`
    INSERT INTO suggested_tasks (assessment_id, title, type, estimated_hours, description)
    VALUES (?, ?, ?, ?, ?)
  `)

    // ── CMP5012B Assessment 1: Stage 1 Report ──
    const a1 = insertAssessment.run(
        'CMP5012B', 'Project Requirements and Design Report', 'submission', 45,
        '2026-03-06T23:59:00Z', 'blackboard',
        'Stage 1: Project requirements and design report with individual reflective report',
        0, null
    )
    insertFileType.run(a1.lastInsertRowid, 'pdf')
    insertSugMilestone.run(a1.lastInsertRowid, 'Complete requirements analysis', '2026-02-13', 'Analyse similar solutions and define use cases and test cases', 30)
    insertSugMilestone.run(a1.lastInsertRowid, 'Complete system design', '2026-02-27', 'Finish OO architecture, class diagrams, and interaction models', 70)
    insertSugMilestone.run(a1.lastInsertRowid, 'Final report write-up', '2026-03-04', 'Compile report and write individual reflective component', 100)
    insertSugTask.run(a1.lastInsertRowid, 'Analyse similar existing solutions', 'studying', 4, 'Research and compare similar software systems to inform requirements')
    insertSugTask.run(a1.lastInsertRowid, 'Develop UML diagrams', 'writing', 8, 'Create use case, class, and sequence diagrams for the system')
    insertSugTask.run(a1.lastInsertRowid, 'Write project requirements document', 'writing', 6, 'Document functional and non-functional requirements')
    insertSugTask.run(a1.lastInsertRowid, 'Write individual reflective report', 'writing', 3, 'Reflect on team contribution and learning during Stage 1')

    // ── CMP5012B Assessment 2: Stage 2 Demo ──
    const a2 = insertAssessment.run(
        'CMP5012B', 'Team Demo, Source Code and Reflective Report', 'demo', 45,
        '2026-05-15T23:59:00Z', 'demo',
        'Stage 2: Team demo video, individual reflective report, and source code. Group presentation on 18 May.',
        0, null
    )
    insertFileType.run(a2.lastInsertRowid, 'pdf')
    insertFileType.run(a2.lastInsertRowid, 'zip')
    insertSugMilestone.run(a2.lastInsertRowid, 'Server-side foundation complete', '2026-04-03', 'Basic NodeJS server with routing and MVC structure in place', 30)
    insertSugMilestone.run(a2.lastInsertRowid, 'Database integration complete', '2026-04-24', 'Database connected and CRUD operations working', 60)
    insertSugMilestone.run(a2.lastInsertRowid, 'Security and polish', '2026-05-08', 'Authentication, input validation, and final testing', 85)
    insertSugMilestone.run(a2.lastInsertRowid, 'Final submission and demo prep', '2026-05-14', 'Record demo video, write reflective report, package source code', 100)
    insertSugTask.run(a2.lastInsertRowid, 'Build NodeJS server with Express', 'programming', 10, 'Set up server-side application with routing and template engine')
    insertSugTask.run(a2.lastInsertRowid, 'Implement MVC architecture', 'programming', 8, 'Structure application following MVC pattern with template rendering')
    insertSugTask.run(a2.lastInsertRowid, 'Integrate database', 'programming', 8, 'Connect database and implement data models and queries')
    insertSugTask.run(a2.lastInsertRowid, 'Implement security features', 'programming', 5, 'Add authentication, session management, and input validation')
    insertSugTask.run(a2.lastInsertRowid, 'Record team demo video', 'other', 3, 'Prepare and record demonstration of the working application')
    insertSugTask.run(a2.lastInsertRowid, 'Write individual reflective report', 'writing', 3, 'Reflect on team contribution and learning during Stage 2')

    // ── CMP5012B Assessment 3: Synoptic ──
    const a3 = insertAssessment.run(
        'CMP5012B', 'Synoptic Assessment', 'exam', 10,
        '2026-05-18T23:59:00Z', 'blackboard',
        'Synoptic project component assessing overall understanding across the module',
        0, null
    )
    insertSugTask.run(a3.lastInsertRowid, 'Review all module topics', 'revision', 5, 'Revise key concepts across requirements, design, and implementation')

    // ── CMP5014B Assessment 1: Coursework ──
    const a4 = insertAssessment.run(
        'CMP5014B', 'Data Structures and Algorithm Midterm', 'exam', 50,
        '2026-03-20T23:59:00Z', 'blackboard',
        'Data Structures and Algorithm Midterm',
        2500, null
    )
    insertFileType.run(a4.lastInsertRowid, 'pdf')
    insertFileType.run(a4.lastInsertRowid, 'zip')
    insertSugMilestone.run(a4.lastInsertRowid, 'Lorem Milestone 1', '2026-02-20', 'Lorem ipsum dolor sit amet', 40)
    insertSugMilestone.run(a4.lastInsertRowid, 'Lorem Milestone 2', '2026-03-10', 'Lorem ipsum dolor sit amet', 80)
    insertSugTask.run(a4.lastInsertRowid, 'Lorem Task 1', 'writing', 5, 'Lorem ipsum dolor sit amet')
    insertSugTask.run(a4.lastInsertRowid, 'Lorem Task 2', 'programming', 6, 'Lorem ipsum dolor sit amet')

    // ── CMP5014B Assessment 2: Exam ──
    const a5 = insertAssessment.run(
        'CMP5014B', 'Data Structures and Algorithms Final', 'exam', 50,
        '2026-05-22T09:00:00Z', 'blackboard',
        'Lorem ipsum dolor sit amet final exam',
        0, 'ZICER LT1'
    )
    insertSugMilestone.run(a5.lastInsertRowid, 'Lorem Revision complete', '2026-05-18', 'Lorem ipsum dolor sit amet', 100)
    insertSugTask.run(a5.lastInsertRowid, 'Lorem Revision task', 'revision', 8, 'Lorem ipsum dolor sit amet')

    // ── CMP5045B Assessment 1: Coursework ──
    const a6 = insertAssessment.run(
        'CMP5045B', 'Embedded Systems Midterm', 'exam', 40,
        '2026-03-13T23:59:00Z', 'blackboard',
        'Embedded Systems Midterm',
        2000, null
    )
    insertFileType.run(a6.lastInsertRowid, 'pdf')
    insertSugMilestone.run(a6.lastInsertRowid, 'Lorem Milestone 1', '2026-02-06', 'Lorem ipsum dolor sit amet', 20)
    insertSugTask.run(a6.lastInsertRowid, 'Lorem Task 1', 'programming', 6, 'Lorem ipsum dolor sit amet')
    insertSugTask.run(a6.lastInsertRowid, 'Lorem Task 2', 'programming', 8, 'Lorem ipsum dolor sit amet')

    // ── CMP5045B Assessment 2: Portfolio ──
    const a7 = insertAssessment.run(
        'CMP5045B', 'Embedded Systems Final', 'submission', 60,
        '2026-05-29T23:59:00Z', 'blackboard',
        'Embedded Systems Final',
        3000, null
    )
    insertFileType.run(a7.lastInsertRowid, 'pdf')
    insertFileType.run(a7.lastInsertRowid, 'zip')
    insertSugMilestone.run(a7.lastInsertRowid, 'Lorem Milestone 1', '2026-04-24', 'Lorem ipsum dolor sit amet', 40)
    insertSugMilestone.run(a7.lastInsertRowid, 'Lorem Milestone 2', '2026-05-15', 'Lorem ipsum dolor sit amet', 75)
    insertSugTask.run(a7.lastInsertRowid, 'Lorem Task 1', 'writing', 10, 'Lorem ipsum dolor sit amet')
    insertSugTask.run(a7.lastInsertRowid, 'Lorem Task 2', 'practice', 5, 'Lorem ipsum dolor sit amet')

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertEvent = db.prepare(`
    INSERT INTO events (module_code, title, type, start_time, end_time, location, is_recurring, recurrence_pattern, recurrence_end_date, is_mandatory, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    const insertEventStaff = db.prepare(`INSERT INTO event_staff (event_id, staff_id) VALUES (?, ?)`)

    // CMP5012B events
    const ev1 = insertEvent.run('CMP5012B', 'Software Engineering Lecture', 'lecture',
        '2026-01-26T09:00:00Z', '2026-01-26T11:00:00Z', 'JSC LT 0.01',
        1, 'weekly', '2026-05-11', 0, 'Draft lecture slides available on Blackboard 48 hours in advance')
    insertEventStaff.run(ev1.lastInsertRowid, staff1.lastInsertRowid)
    insertEventStaff.run(ev1.lastInsertRowid, staff2.lastInsertRowid)

    const ev2 = insertEvent.run('CMP5012B', 'Software Engineering Lab (Group 1)', 'lab',
        '2026-01-26T12:00:00Z', '2026-01-26T14:00:00Z', 'SCI 2.37',
        1, 'weekly', '2026-05-11', 0, 'Labs are an essential part of the module. Work in teams.')
    insertEventStaff.run(ev2.lastInsertRowid, staff1.lastInsertRowid)
    insertEventStaff.run(ev2.lastInsertRowid, staff2.lastInsertRowid)

    const ev3 = insertEvent.run('CMP5012B', 'Software Engineering Lab (Group 2)', 'lab',
        '2026-01-26T14:00:00Z', '2026-01-26T16:00:00Z', 'SCI 2.37',
        1, 'weekly', '2026-05-11', 0, 'Labs are an essential part of the module. Work in teams.')
    insertEventStaff.run(ev3.lastInsertRowid, staff1.lastInsertRowid)
    insertEventStaff.run(ev3.lastInsertRowid, staff2.lastInsertRowid)

    // CMP5014B events
    const ev4 = insertEvent.run('CMP5014B', 'DATA STRUCTURES AND ALGORITHMS Lecture', 'lecture',
        '2026-01-27T11:00:00Z', '2026-01-27T13:00:00Z', 'ZICER LT1',
        1, 'weekly', '2026-05-12', 0, 'Lorem ipsum dolor sit amet')
    insertEventStaff.run(ev4.lastInsertRowid, staff3.lastInsertRowid)

    const ev5 = insertEvent.run('CMP5014B', 'DATA STRUCTURES AND ALGORITHMS Lab', 'lab',
        '2026-01-28T14:00:00Z', '2026-01-28T16:00:00Z', 'SCI 2.37',
        1, 'weekly', '2026-05-13', 0, 'Lorem ipsum dolor sit amet')
    insertEventStaff.run(ev5.lastInsertRowid, staff3.lastInsertRowid)

    // CMP5045B events
    const ev6 = insertEvent.run('CMP5045B', 'Embedded Systems Lecture', 'lecture',
        '2026-01-29T09:00:00Z', '2026-01-29T11:00:00Z', 'ARTS LT2',
        1, 'weekly', '2026-05-14', 0, 'Lorem ipsum dolor sit amet')
    insertEventStaff.run(ev6.lastInsertRowid, staff4.lastInsertRowid)

    const ev7 = insertEvent.run('CMP5045B', 'Embedded Systems Lab', 'lab',
        '2026-01-30T10:00:00Z', '2026-01-30T12:00:00Z', 'SCI 2.37',
        1, 'weekly', '2026-05-15', 0, 'Lorem ipsum dolor sit amet')
    insertEventStaff.run(ev7.lastInsertRowid, staff5.lastInsertRowid)

    // ═══════════════════════════════════════════════════════════════════════════
    // 11. RESOURCES
    // ═══════════════════════════════════════════════════════════════════════════
    const insertResource = db.prepare(`
    INSERT INTO resources (module_code, type, title, edition, isbn, is_required, url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    const insertAuthor = db.prepare(`INSERT INTO resource_authors (resource_id, author_name) VALUES (?, ?)`)

    // CMP5012B - online resource only
    const r1 = insertResource.run('CMP5012B', 'online_resource', 'Module Blackboard Page', null, null, null,
        'https://learn.uea.ac.uk', 'Weekly announcements, lecture slides, and additional learning materials')

    // CMP5014B
    const r2 = insertResource.run('CMP5014B', 'textbook', 'Lorem Ipsum Textbook', '1st Edition',
        '1234567890', 1, 'https://library.uea.ac.uk/', 'Lorem ipsum dolor sit amet')
    insertAuthor.run(r2.lastInsertRowid, 'Lorem Author')

    const r3 = insertResource.run('CMP5014B', 'online_resource', 'Module Blackboard Page', null, null, null,
        'https://learn.uea.ac.uk/', 'Lorem ipsum dolor sit amet')

    // CMP5045B
    const r4 = insertResource.run('CMP5045B', 'textbook', 'Lorem Ipsum Textbook', '1st Edition',
        '1234567890', 1, 'https://library.uea.ac.uk/', 'Lorem ipsum dolor sit amet')
    insertAuthor.run(r4.lastInsertRowid, 'Lorem Author')

    const r5 = insertResource.run('CMP5045B', 'online_resource', 'Module Blackboard Page', null, null, null,
        'https://learn.uea.ac.uk/', 'Lorem ipsum dolor sit amet')

    // ═══════════════════════════════════════════════════════════════════════════
    // 12. WEEKLY TOPICS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertWeeklyTopic = db.prepare(`
    INSERT INTO weekly_topics (module_code, week, week_start_date, topic, reading, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    const insertSubtopic = db.prepare(`
    INSERT INTO weekly_topic_subtopics (weekly_topic_id, position, subtopic) VALUES (?, ?, ?)
  `)

    // ── CMP5012B weekly topics (all 11 weeks from the schedule) ──
    const seWeeks = [
        { week: 1, date: '2026-01-26', topic: 'Introduction and Module Overview', subtopics: ['Module structure', 'Assessment overview', 'Team building'], notes: 'Lab 1 focuses on team building' },
        { week: 2, date: '2026-02-02', topic: 'Requirement Engineering and Project Vision', subtopics: ['Requirements gathering', 'Use cases', 'Project scoping'], notes: 'Assessment briefing this week' },
        { week: 3, date: '2026-02-09', topic: 'Software Architecture and System Structure', subtopics: ['Architectural patterns', 'System components', 'Feature identification'] },
        { week: 4, date: '2026-02-16', topic: 'Software Design and Interaction Modelling', subtopics: ['UML diagrams', 'Sequence diagrams', 'OO architectures', 'Class relationships'] },
        { week: 5, date: '2026-02-23', topic: 'Project Planning Tools and Documentation', subtopics: ['Project management tools', 'Work planning', 'Documentation practices'] },
        { week: 6, date: '2026-03-02', topic: 'Integrating Software Design and Preparing for Implementation', subtopics: ['Design consolidation', 'Implementation readiness', 'Software design review'], notes: 'Stage 1 submission due 6 March' },
        { week: 7, date: '2026-03-09', topic: 'Server-Side Programming in NodeJS', subtopics: ['NodeJS fundamentals', 'Express framework', 'Server-side JavaScript'] },
        { week: 8, date: '2026-03-16', topic: 'MVC and Server-Side Rendering in NodeJS', subtopics: ['MVC pattern', 'Template engines', 'Server-side rendering'] },
        { week: 9, date: '2026-04-20', topic: 'Database Integration in NodeJS', subtopics: ['Database connections', 'SQL queries in Node', 'ORM basics'], notes: 'After Easter break' },
        { week: 10, date: '2026-04-27', topic: 'Securing NodeJS Applications', subtopics: ['Authentication', 'Input validation', 'Session management', 'Security best practices'] },
        { week: 11, date: '2026-05-11', topic: 'Revision, Summary and Emerging Trends', subtopics: ['Module review', 'Industry trends', 'Assessment completion'], notes: 'Stage 2 source code and reflective report due 15 May. Group presentation 18 May.' },
    ]

    for (const w of seWeeks) {
        const wt = insertWeeklyTopic.run('CMP5012B', w.week, w.date, w.topic, w.reading || null, w.notes || null)
        for (let i = 0; i < (w.subtopics || []).length; i++) {
            insertSubtopic.run(wt.lastInsertRowid, i + 1, w.subtopics[i])
        }
    }

    // ── CMP5014B weekly topics (Lorem Ipsum) ──
    const dsaWeeks = [
        { week: 1, date: '2026-01-26', topic: 'Lorem Ipsum 1', subtopics: ['Lorem', 'Ipsum'], reading: 'Lorem Ipsum', notes: 'Lorem ipsum' },
        { week: 2, date: '2026-02-02', topic: 'Lorem Ipsum 2', subtopics: ['Lorem', 'Ipsum', 'Dolor'], reading: 'Lorem Ipsum' },
        { week: 3, date: '2026-02-09', topic: 'Lorem Ipsum 3', subtopics: ['Lorem', 'Ipsum', 'Dolor', 'Sit'], reading: 'Lorem Ipsum' },
    ]
    for (const w of dsaWeeks) {
        const wt = insertWeeklyTopic.run('CMP5014B', w.week, w.date, w.topic, w.reading || null, w.notes || null)
        for (let i = 0; i < (w.subtopics || []).length; i++) {
            insertSubtopic.run(wt.lastInsertRowid, i + 1, w.subtopics[i])
        }
    }

    // ── CMP5045B weekly topics (Lorem Ipsum) ──
    const embeddedWeeks = [
        { week: 1, date: '2026-01-26', topic: 'Lorem Ipsum 1', subtopics: ['Lorem', 'Ipsum'], reading: 'Lorem Ipsum', notes: 'Lorem ipsum' },
        { week: 2, date: '2026-02-02', topic: 'Lorem Ipsum 2', subtopics: ['Lorem', 'Ipsum', 'Dolor'], reading: 'Lorem Ipsum' },
        { week: 3, date: '2026-02-09', topic: 'Lorem Ipsum 3', subtopics: ['Lorem', 'Ipsum', 'Dolor', 'Sit'], reading: 'Lorem Ipsum' },
    ]
    for (const w of embeddedWeeks) {
        const wt = insertWeeklyTopic.run('CMP5045B', w.week, w.date, w.topic, w.reading || null, w.notes || null)
        for (let i = 0; i < (w.subtopics || []).length; i++) {
            insertSubtopic.run(wt.lastInsertRowid, i + 1, w.subtopics[i])
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 13. SAMPLE USER MILESTONES, TASKS & ACTIVITIES
    // ═══════════════════════════════════════════════════════════════════════════
    const insertMilestone = db.prepare(`
    INSERT INTO milestones (user_id, assessment_id, title, target_date) VALUES (?, ?, ?, ?)
  `)
    const insertTask = db.prepare(`
    INSERT INTO tasks (user_id, assessment_id, milestone_id, module_code, title, type, target_metric, target_amount, description, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    const insertActivity = db.prepare(`
    INSERT INTO activities (task_id, user_id, date, metric, amount, description) VALUES (?, ?, ?, ?, ?, ?)
  `)

    // A user milestone for Stage 1
    const m1 = insertMilestone.run(userId, a1.lastInsertRowid, 'Finish requirements section', '2026-02-15')

    // A couple of tasks linked to that milestone
    const t1 = insertTask.run(userId, a1.lastInsertRowid, m1.lastInsertRowid, 'CMP5012B',
        'Research competitor apps', 'studying', 'hours', 4,
        'Look at 3 similar applications and document features', 'completed', '2026-02-10')

    const t2 = insertTask.run(userId, a1.lastInsertRowid, m1.lastInsertRowid, 'CMP5012B',
        'Draft use case diagrams', 'writing', 'diagrams', 5,
        'Create use case diagrams for core user flows', 'in_progress', '2026-02-14')

    // A standalone task (no milestone)
    const t3 = insertTask.run(userId, a2.lastInsertRowid, null, 'CMP5012B',
        'Set up NodeJS project skeleton', 'programming', 'hours', 3,
        'Initialise npm project, install Express, create folder structure', 'pending', '2026-03-12')

    // A DSA module task
    const t4 = insertTask.run(userId, a4.lastInsertRowid, null, 'CMP5014B',
        'Read AVL Tree chapter', 'reading', 'pages', 20,
        'Read chapter on AVL trees and practice left/right rotations.', 'pending', '2026-02-18')

    // Sample activities (logging work done)
    insertActivity.run(t1.lastInsertRowid, userId, '2026-02-08', 'hours', 2, 'Reviewed two competitor apps and took notes')
    insertActivity.run(t1.lastInsertRowid, userId, '2026-02-09', 'hours', 1.5, 'Reviewed third app, wrote comparison table')
    insertActivity.run(t2.lastInsertRowid, userId, '2026-02-11', 'diagrams', 2, 'Drafted login and registration use cases')

    // ═══════════════════════════════════════════════════════════════════════════
    // 14. SAMPLE USER EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const insertUserEvent = db.prepare(`
      INSERT INTO user_events (user_id, title, description, start_time, end_time, is_all_day, color, location, is_recurring, recurrence_pattern, recurrence_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertUserEvent.run(userId, 'Study Group', 'Meet with team for Stage 1 report', '2026-02-13T15:00:00Z', '2026-02-13T17:00:00Z', 0, '#6366f1', 'Library Group Room 2', 0, null, null)
    insertUserEvent.run(userId, 'Gym', 'Leg day', '2026-01-27T08:00:00Z', '2026-01-27T09:30:00Z', 0, '#f43f5e', 'Sportspark', 1, 'weekly', '2026-06-01')
    insertUserEvent.run(userId, 'Dentist', 'Checkup', '2026-02-05T00:00:00Z', null, 1, '#10b981', 'City Centre Dental', 0, null, null)

    console.log('OK: Seed complete. Sample data inserted.')
})

// ─── Run ─────────────────────────────────────────────────────────────────────
try {
    seed()
} catch (err) {
    console.error('SEED ERROR:', err.message)
    process.exit(1)
} finally {
    db.close()
}
