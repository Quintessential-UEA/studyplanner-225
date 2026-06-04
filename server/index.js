// ─── server/index.js ──────────────────────────────────────────────────────────
// This is the ENTRY POINT for the Express backend server.
// Running "node index.js" (or "npm run dev") starts the server.
//
// Its job is to:
//   1. Create the Express app
//   2. Install middleware (functions that run on every request)
//   3. Mount the API routes
//   4. Start listening on a port
// ──────────────────────────────────────────────────────────────────────────────

// dotenv loads the variables from the ".env" file into process.env,
// making them accessible as process.env.PORT, process.env.JWT_SECRET, etc.
// This MUST be the very first import so all other modules can read env vars.
import 'dotenv/config'

// Express is the web framework. It handles incoming HTTP requests (GET, POST,
// PUT, DELETE) and routes them to the correct handler function.
import express from 'express'

// Import the router that contains all /api/* route definitions.
// See server/routes/index.js for the actual route handlers.
import apiRouter from './routes/index.js'

//import {startScheduler} from './services/eventScheduler.js' (TEMPORARY)

// ─── App Initialisation ──────────────────────────────────────────────────────
// express() creates the application object. All configuration and routes
// are attached to this object.
const app = express()

// ─── Middleware ──────────────────────────────────────────────────────────────
// Middleware are functions that run on EVERY request before it reaches a route.
// app.use() installs them in order — they form a "pipeline".

// express.json() parses incoming request bodies that have Content-Type: application/json.
// Without this, req.body would always be undefined for POST/PUT requests.
app.use(express.json())

// express.urlencoded() parses form data (Content-Type: application/x-www-form-urlencoded).
// extended: true allows nested objects in form data.
app.use(express.urlencoded({ extended: true }))

// ─── Routes ──────────────────────────────────────────────────────────────────
// Mount the API router at the '/api' prefix.
// This means a route defined as GET '/' in apiRouter becomes GET '/api/' here.
// e.g. GET '/tasks' in routes/tasks.js becomes GET '/api/tasks'
app.use('/api', apiRouter)

// ─── Root Health Check ───────────────────────────────────────────────────────
// A simple GET / endpoint that confirms the server is up.
// Useful for checking the server is running without needing the frontend.
app.get('/', (req, res) => {
  res.json({ message: 'OK: Study Planner API is running!' })
})

// ─── Start Server ────────────────────────────────────────────────────────────
// process.env.PORT reads the PORT value from your .env file.
// The '?? 3000' means "if PORT is not set, fall back to 3000".
const PORT = process.env.PORT ?? 3000

//startScheduler() (TEMPORARY)

app.listen(PORT, () => {
  // This callback runs once when the server successfully starts listening.
  console.log(`OK:Server running at http://localhost:${PORT}`)
})

export default app
