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
//
// ─── TODO ────────────────────────────────────────────────────────────────────
// Fill in the CREATE TABLE statements below based on our ERD. 
// Each table represents one entity in the system.
// ──────────────────────────────────────────────────────────────────────────────

// DEVNOTE: This file is a scaffold. It is not yet functional.

// import Database from 'better-sqlite3'
// import path from 'path'
// import { fileURLToPath } from 'url'

// ─── Resolve the path to the database file ───────────────────────────────────
// In ES Modules, __dirname doesn't exist. This is the equivalent workaround.
// const __dirname = path.dirname(fileURLToPath(import.meta.url))
// const DB_PATH = path.join(__dirname, 'database.sqlite')

// ─── Open / Create the database ──────────────────────────────────────────────
// Passing a file path to Database() opens or creates the .sqlite file.
// const db = new Database(DB_PATH)

// ─── Tables ──────────────────────────────────────────────────────────────────
// Define all CREATE TABLE statements here, one per entity.
// !! The order matters: tables referenced by FOREIGN KEYs must be created first.

// TODO: db.exec(`
//   CREATE TABLE IF NOT EXISTS users (
//     id        INTEGER PRIMARY KEY AUTOINCREMENT,
//     name      TEXT    NOT NULL,
//     email     TEXT    NOT NULL UNIQUE,
//     password  TEXT    NOT NULL,    -- Store hashed passwords only, NEVER plaintext
//     created_at TEXT   DEFAULT (datetime('now'))
//   );
// `)

// TODO: db.exec(`
//   CREATE TABLE IF NOT EXISTS semesters (
//     id         INTEGER PRIMARY KEY AUTOINCREMENT,
//     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     name       TEXT    NOT NULL,
//     start_date TEXT    NOT NULL,
//     end_date   TEXT    NOT NULL
//   );
// `)

// TODO: Add tables for modules, assessments, tasks, activities, etc.

// console.log('OK: Migration complete. Database created at:', DB_PATH)
// db.close()

console.log('WARN: migrate.js is a scaffold. Fill in CREATE TABLE statements before running.')
