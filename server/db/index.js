// ─── server/db/index.js ──────────────────────────────────────────────────────
// Singleton database connection.
//
// Every file that needs to talk to the database imports `db` from here.
// This ensures there is exactly ONE open connection to the SQLite file,
// which avoids locking issues and keeps configuration (WAL mode, foreign
// keys) consistent across the entire application.
//
// Usage:
//   import db from '../db/index.js'    // from a route or DAL file
//   const row = db.prepare('SELECT ...').get()
// ──────────────────────────────────────────────────────────────────────────────

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'database.sqlite')

// ─── Open the database ──────────────────────────────────────────────────────
// better-sqlite3 opens (or creates) the file at DB_PATH.
// We enable WAL (Write-Ahead Logging) for better concurrent read performance,
// and turn on foreign key enforcement (off by default in SQLite).
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db
