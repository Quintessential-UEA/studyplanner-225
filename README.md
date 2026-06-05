# Study Planner — Team 225

A full-stack study planning web app built with **Vue 3** (frontend) and **Express.js** (backend).

---

## Project Structure

```
/                                ← Repository root
├── package.json                 ← Root scripts (boots client + server together via concurrently)
├── .gitignore                   ← Tells Git which files/folders to never track
│
├── client/                      ← Frontend (Vue 3 + Vite + Tailwind CSS + Pinia)
│   ├── package.json             ← Frontend dependencies and npm scripts
│   ├── index.html               ← Single HTML shell that Vue mounts into
│   ├── vite.config.js           ← Vite config: Vue plugin + /api proxy to Express
│   ├── tailwind.config.js       ← Tells Tailwind which files to scan for class names
│   ├── postcss.config.js        ← Wires Tailwind + autoprefixer into the CSS pipeline
│   └── src/
│       ├── main.js              ← App entry point: creates Vue app, installs Pinia
│       ├── App.vue              ← Root component (placeholder — build from here)
│       ├── assets/
│       │   └── main.css         ← Global CSS with Tailwind @tailwind directives
│       ├── api/
│       │   └── index.js         ← Pre-configured Axios instance with JWT interceptors
│       ├── stores/
│       │   └── index.js         ← Pinia store hub (commented example included)
│       └── example.test.js      ← Vitest example (run with 'npm test')
│
├── server/                      ← Backend (Express.js + SQLite)
│   ├── package.json             ← Backend dependencies and npm scripts
│   ├── index.test.js            ← Vitest example (run with 'npm test')
│   ├── .env.example             ← Template for your private .env configuration file
│   ├── index.js                 ← Express entry point: middleware, routes, server start
│   ├── routes/
│   │   └── index.js             ← Central API router (Sprint 1 route stubs ready)
│   └── db/
│       ├── migrate.js           ← Database schema scaffold (TODO: not yet functional)
│       └── seed.js              ← Sample data scaffold (TODO: not yet functional)
│
└── README.md                    ← This file
```

---

## First-Time Setup

Follow these steps exactly. You need **Node.js** installed. Check with `node -v`.

### 1. Install all dependencies

```bash
# From the repository root:
npm install              # Installs root devDependencies (concurrently)

cd client && npm install # Installs frontend packages (Vue, Vite, Tailwind, etc.)
cd ../server && npm install # Installs backend packages (Express, SQLite, etc.)
cd ..
```

> `npm install` reads each `package.json` and downloads all listed packages into that folder's `node_modules/`.

### 2. Create your local environment file

```bash
cd server
cp .env.example .env
```

> This copies the template to a real `.env` file. Open it and fill in your own values, especially your SMTP credentials for email sending. **Never commit the `.env` file.**

### 3. Set up the database *(WIP)*

```bash
# Once migrate.js and seed.js are completed (WIP):
cd server
node db/migrate.js   # Creates all tables in a fresh SQLite database file
```

> WARNING: These scripts are scaffolded but not yet functional. They will be completed once the ERD is finalised.

---

## Running the App

### Option A: Start both servers at once (recommended)

```bash
# From the repository root:
npm run dev
```

> This uses `concurrently` to launch the backend and frontend simultaneously in one terminal.

### Option B: Start them separately

```bash
# Terminal 1 — Backend
cd server
npm run dev
```

> The server starts on `http://localhost:3000` by default and restarts automatically when you save files.

```bash
# Terminal 2 — Frontend
cd client
npm run dev
```

> Opens the app on `http://localhost:5173`. API calls to `/api/*` are automatically forwarded to the backend on port 3000 (configured in `vite.config.js`).

---

## Logging In

### Email Address

```bash
# This is the prototype user.
Email : Stew.Dent@uea.ac.uk
```

### Hub File Submission

> Navigate to server/db/hub/Stew-Dent.json

```bash
# Only accepts .json file type.
cd server/db/hub/Stew-Dent.json
```


> Alternatively, select "Browse..." and manually select the .json for Stew Dent.  

> After selecting the relevant .json it the login screen will display which file has been selected for import.

>Click "Upload and import".

---

## Running Tests

We use **Vitest** for both the frontend and backend.

### Run all tests
```bash
# From the repository root:
npm test
```

### Run only frontend or backend tests
```bash
# From the repository root:
npm run test:client
npm run test:server
```

### Watch mode
You can also run tests in watch mode by going into the respective directory:
```bash
cd client && npm test
# OR
cd server && npm test
```

---

## Available Scripts

| Command                  | Where to run | What it does                                         |
|--------------------------|--------------|------------------------------------------------------|
| `npm run dev`            | Root `/`     | Starts both client and server simultaneously         |
| `npm run dev:client`     | Root `/`     | Starts only the Vite frontend dev server             |
| `npm run dev:server`     | Root `/`     | Starts only the Express backend server               |
| `npm run dev`            | `/client`    | Starts the Vite frontend dev server                  |
| `npm run build`          | `/client`    | Compiles and bundles the frontend for production      |
| `npm run preview`        | `/client`    | Previews the production build locally                 |
| `npm run dev`            | `/server`    | Starts Express with auto-restart on file changes      |
| `npm start`              | `/server`    | Starts Express normally (for production)              |
| `npm test`               | Root `/`     | Runs all client and server tests                     |
| `npm run test:client`    | Root `/`     | Runs only frontend tests                              |
| `npm run test:server`    | Root `/`     | Runs only backend tests                               |
| `npm test`               | `/client`    | Runs frontend tests in watch mode                    |
| `npm test`               | `/server`    | Runs backend tests in watch mode                     |

---

## Tech Stack

| Layer     | Technology                    | Purpose                                       |
|-----------|-------------------------------|-----------------------------------------------|
| Frontend  | Vue 3                         | UI framework                                  |
| Frontend  | Vite                          | Build tool & development server               |
| Frontend  | Tailwind CSS                  | Utility-first CSS styling                     |
| Frontend  | Pinia                         | Global state management (shared app data)     |
| Frontend  | Axios                         | Makes HTTP requests to the backend API        |
| Backend   | Express.js                    | HTTP server and API routing                   |
| Backend   | better-sqlite3                | Reads/writes the local SQLite database        |
| Backend   | multer                        | Handles file uploads (Hub export files)       |
| Backend   | nodemailer                    | Sends reminder emails via Exchange Online     |
| Backend   | node-cron                     | Schedules recurring background tasks          |
| Backend   | dotenv                        | Loads .env secrets into process.env           |
| Tooling   | concurrently                  | Runs client + server in one terminal          |
| Tooling   | Vitest                        | Unit and integration testing                  |
