// ─── vite.config.js ───────────────────────────────────────────────────────────
// This is the configuration file for Vite, the frontend build tool.
// Vite reads this file before starting the dev server or building for production.
// ──────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// defineConfig() is a Vite helper that gives you autocomplete in your editor.
export default defineConfig({
  plugins: [
    // vue() tells Vite how to process .vue Single File Components.
    // Without this plugin, Vite wouldn't understand the <template>, <script>,
    // and <style> blocks inside .vue files.
    vue(),
  ],

  server: {
    // ─── API Proxy ──────────────────────────────────────────────────────────
    // During development, the Vite frontend runs on http://localhost:5173
    // and the Express backend runs on http://localhost:3000.
    //
    // Without a proxy, the browser would block API requests from port 5173
    // to port 3000 due to CORS (Cross-Origin Resource Sharing) restrictions.
    //
    // This proxy tells Vite: "if the frontend makes a request to /api/...,
    // forward it silently to the backend at localhost:3000."
    // This means in frontend code you just write: axios.get('/api/tasks')
    // instead of: axios.get('http://localhost:3000/api/tasks')
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // The Express backend address
        changeOrigin: true,              // Rewrites the 'Host' header to match the target
      },
    },
  },
  test: {
    globals: true,
  },
})
