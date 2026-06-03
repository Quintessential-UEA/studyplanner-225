// ─── server/db/migrate.js ─────────────────────────────────────────────────────
// Run this script ONCE to create the SQLite database and all its tables.
// Run it again at any time to start fresh (it drops and recreates all tables).
//
// Usage:
//   node db/migrate.js
//
// ─── What is a Migration? ────────────────────────────────────────────────────
// A "migration" is a script that defines and applies changes to a database
// schema (the structure of tables and columns). Running this script creates
// the database file and all tables from scratch based on your ERD design.
//
// ─── What is SQLite? ─────────────────────────────────────────────────────────
// SQLite stores the entire database in a single file (database.sqlite).
// There is no database "server" to connect to, just a file on disk.
// better-sqlite3 is the Node.js library that reads/writes this file.
// ──────────────────────────────────────────────────────────────────────────────

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

// ─── Resolve the path to the database file ───────────────────────────────────
// In ES Modules, __dirname doesn't exist. This is the equivalent workaround.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'database.sqlite')

// ─── Open / Create the database ──────────────────────────────────────────────
// Passing a file path to Database() opens or creates the .sqlite file.
const db = new Database(DB_PATH)

// ─── Tables ──────────────────────────────────────────────────────────────────
// Define all CREATE TABLE statements here, one per entity.
// !! The order matters: tables referenced by FOREIGN KEYs must be created first.

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Drop existing tables (in reverse dependency order to avoid constraint errors)
db.exec(`
  DROP TABLE IF EXISTS event_staff;
  DROP TABLE IF EXISTS user_events;
  DROP TABLE IF EXISTS weekly_topic_subtopics;
  DROP TABLE IF EXISTS weekly_topics;
  DROP TABLE IF EXISTS activities;
  DROP TABLE IF EXISTS tasks;
  DROP TABLE IF EXISTS milestones;
  DROP TABLE IF EXISTS suggested_tasks;
  DROP TABLE IF EXISTS suggested_milestones;
  DROP TABLE IF EXISTS assessment_file_types;
  DROP TABLE IF EXISTS assessments;
  DROP TABLE IF EXISTS module_learning_outcomes;
  DROP TABLE IF EXISTS module_topics;
  DROP TABLE IF EXISTS module_corequisites;
  DROP TABLE IF EXISTS module_prerequisites;
  DROP TABLE IF EXISTS resource_authors;
  DROP TABLE IF EXISTS resources;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS module_staff;
  DROP TABLE IF EXISTS staff;
  DROP TABLE IF EXISTS user_modules;
  DROP TABLE IF EXISTS modules;
  DROP TABLE IF EXISTS module_organisers;
  DROP TABLE IF EXISTS student_profiles;
  DROP TABLE IF EXISTS users;
`)

// Create tables
db.exec(`
  CREATE TABLE users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE student_profiles (
    user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_number   TEXT UNIQUE,
    full_name        TEXT,
    preferred_name   TEXT,
    school_name      TEXT,
    school_acronym   TEXT,
    programme_code   TEXT,
    programme_title  TEXT,
    year_of_study    INTEGER CHECK (year_of_study BETWEEN 1 AND 5),
    level_of_study   TEXT CHECK (level_of_study IN ('4','5','6','7')),
    has_reasonable_adjustments BOOLEAN,
    advisor_name     TEXT,
    advisor_email    TEXT,
    advisor_office   TEXT
  );

  CREATE TABLE module_organisers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    office       TEXT,
    office_hours TEXT
  );

  CREATE TABLE modules (
    code                    TEXT PRIMARY KEY,
    title                   TEXT NOT NULL,
    credits                 INTEGER CHECK (credits IN (10, 20, 30, 40, 60)),
    semester                TEXT CHECK (semester IN ('1','2','year_long')),
    level                   TEXT CHECK (level IN ('4','5','6','7')),
    description             TEXT,
    module_organiser_id     INTEGER REFERENCES module_organisers(id) ON DELETE SET NULL,
    blackboard_url          TEXT,
    study_hours_lectures    INTEGER,
    study_hours_labs        INTEGER,
    study_hours_independent INTEGER
  );

  CREATE TABLE user_modules (
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_code   TEXT REFERENCES modules(code) ON DELETE CASCADE,
    academic_year TEXT,
    theme_color   TEXT DEFAULT '#3B82F6',
    PRIMARY KEY (user_id, module_code, academic_year)
  );

  CREATE TABLE staff (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    office TEXT
  );

  CREATE TABLE module_staff (
    module_code      TEXT REFERENCES modules(code) ON DELETE CASCADE,
    staff_id         INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    role             TEXT NOT NULL CHECK (role IN ('lecturer','teaching_fellow','associate_tutor','demonstrator','guest_lecturer')),
    responsibilities TEXT,
    PRIMARY KEY (module_code, staff_id, role)
  );

  CREATE TABLE module_prerequisites (
    module_code          TEXT REFERENCES modules(code) ON DELETE CASCADE,
    required_module_code TEXT,
    PRIMARY KEY (module_code, required_module_code)
  );

  CREATE TABLE module_corequisites (
    module_code             TEXT REFERENCES modules(code) ON DELETE CASCADE,
    corequisite_module_code TEXT,
    PRIMARY KEY (module_code, corequisite_module_code)
  );

  CREATE TABLE module_topics (
    module_code TEXT REFERENCES modules(code) ON DELETE CASCADE,
    topic       TEXT,
    PRIMARY KEY (module_code, topic)
  );

  CREATE TABLE module_learning_outcomes (
    module_code TEXT REFERENCES modules(code) ON DELETE CASCADE,
    outcome     TEXT,
    PRIMARY KEY (module_code, outcome)
  );

  CREATE TABLE assessments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    module_code       TEXT REFERENCES modules(code) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    type              TEXT CHECK (type IN ('exam','demo','submission')),
    weighting         REAL CHECK (weighting BETWEEN 0 AND 100),
    deadline          TEXT,
    submission_method TEXT CHECK (submission_method IN ('blackboard','physical','demo')),
    description       TEXT,
    word_limit        INTEGER,
    location          TEXT
  );

  CREATE TABLE assessment_file_types (
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    file_type     TEXT NOT NULL,
    PRIMARY KEY (assessment_id, file_type)
  );

  CREATE TABLE suggested_milestones (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id         INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    title                 TEXT NOT NULL,
    suggested_deadline    TEXT,
    description           TEXT,
    completion_percentage REAL
  );

  CREATE TABLE suggested_tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id   INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    type            TEXT CHECK (type IN ('studying','programming','writing','reading','revision','practice','other')),
    estimated_hours REAL,
    description     TEXT
  );

  CREATE TABLE milestones (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    target_date   TEXT
  );

  CREATE TABLE tasks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    milestone_id  INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
    module_code   TEXT REFERENCES modules(code) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    type          TEXT CHECK (type IN ('studying','programming','writing','reading','revision','practice','other')),
    target_metric TEXT,
    target_amount REAL,
    description   TEXT,
    status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
    due_date             TEXT,
    scheduled_date       TEXT,
    scheduled_start_time TEXT,
    scheduled_duration   INTEGER DEFAULT 60
  );

  CREATE TABLE activities (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id          INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date             TEXT NOT NULL,
    metric           TEXT NOT NULL,
    amount           REAL NOT NULL,
    description      TEXT
  );

  CREATE TABLE user_events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    start_time          TEXT NOT NULL,
    end_time            TEXT,
    email               TEXT,
    email_sent          BOOLEAN DEFAULT 0,
    is_all_day          BOOLEAN DEFAULT 0,
    color               TEXT DEFAULT '#6366f1',
    location            TEXT,
    is_recurring        BOOLEAN DEFAULT 0,
    recurrence_pattern  TEXT CHECK (recurrence_pattern IN ('weekly','fortnightly','monthly')),
    recurrence_end_date TEXT,
    created_at          TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    module_code         TEXT REFERENCES modules(code) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    type                TEXT CHECK (type IN ('lecture','lab','seminar','tutorial','workshop','exam','other')),
    start_time          TEXT,
    end_time            TEXT,
    location            TEXT,
    is_recurring        BOOLEAN,
    recurrence_pattern  TEXT CHECK (recurrence_pattern IN ('weekly','fortnightly','monthly')),
    recurrence_end_date TEXT,
    is_mandatory        BOOLEAN,
    notes               TEXT
  );

  CREATE TABLE event_staff (
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, staff_id)
  );

  CREATE TABLE resources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    module_code TEXT REFERENCES modules(code) ON DELETE CASCADE,
    type        TEXT CHECK (type IN ('textbook','online_resource')),
    title       TEXT NOT NULL,
    edition     TEXT,
    isbn        TEXT,
    is_required BOOLEAN,
    url         TEXT,
    description TEXT
  );

  CREATE TABLE resource_authors (
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    PRIMARY KEY (resource_id, author_name)
  );

  CREATE TABLE weekly_topics (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    module_code      TEXT NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
    week             INTEGER NOT NULL CHECK (week >= 1),
    week_start_date  TEXT,
    topic            TEXT NOT NULL,
    reading          TEXT,
    notes            TEXT,
    UNIQUE (module_code, week)
  );

  CREATE TABLE weekly_topic_subtopics (
    weekly_topic_id INTEGER NOT NULL REFERENCES weekly_topics(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL,
    subtopic        TEXT NOT NULL,
    PRIMARY KEY (weekly_topic_id, position)
  );
`)

console.log('OK: Migration complete. Database created at:', DB_PATH)
db.close()
