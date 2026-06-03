// ─── src/main.js ──────────────────────────────────────────────────────────────
// This is the JavaScript entry point for the entire Vue application.
// Vite loads this file first (referenced from index.html), and everything
// else in the app flows from here.
// ──────────────────────────────────────────────────────────────────────────────

// createApp: The function that creates a Vue application instance.
import { createApp } from 'vue'

// createPinia: Creates the Pinia store instance (global state management).
import { createPinia } from 'pinia'

// App.vue: The root component — the top-level building block of the UI.
// Every other component is nested inside this one.
import App from './App.vue'

// Import the global CSS file (which wires in Tailwind CSS).
// This import must happen here so styles apply to the whole app.
import './assets/main.css'


// ─── Create the App ─────────────────────────────────────────────────────────
// createApp(App) creates a Vue application using App.vue as the root component.
const app = createApp(App)

// ─── Install Plugins ────────────────────────────────────────────────────────
// .use() installs a plugin into the Vue app.
// Pinia must be installed before any component tries to use a store.
app.use(createPinia())



// ─── Mount the App ──────────────────────────────────────────────────────────
// .mount('#app') finds the <div id="app"> in index.html and renders the
// entire Vue component tree inside it. This is the last step that "starts" the app.
app.mount('#app')
