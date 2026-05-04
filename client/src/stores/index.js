// ─── src/stores/index.js ──────────────────────────────────────────────────────
// This file is the central export point for all Pinia stores.
//
// ─── What is Pinia? ───────────────────────────────────────────────────────────
// Pinia is Vue's official global state management library.
//
// Problem it solves: Vue components can only pass data "downward" via props.
// If two unrelated components need to share data (e.g., the logged-in user's
// name shown in the nav bar AND used in the dashboard), passing it through
// props becomes messy. Pinia provides a "store" — a central place to hold
// data that any component can read from or write to directly.
//
// ─── Store Structure ──────────────────────────────────────────────────────────
// Each "domain" of the app gets its own store file in this folder, e.g.:
//   stores/user.js       — logged-in user info, login/logout actions
//   stores/semester.js   — current semester, modules list
//   stores/tasks.js      — tasks list, add/update/delete actions
//
// This file imports and re-exports them all for convenience.
// ──────────────────────────────────────────────────────────────────────────────

// TODO: As you create store files, import and re-export them here.
// Example:
// export { useUserStore } from './user'
// export { useSemesterStore } from './semester'
// export { useTaskStore } from './tasks'

// ─── Example Store (User) ─────────────────────────────────────────────────────
// Uncomment and move to stores/user.js when ready.
//
// import { defineStore } from 'pinia'
//
// export const useUserStore = defineStore('user', {
//   // state: The reactive data held in this store (like data() in Options API).
//   state: () => ({
//     currentUser: null,  // null means "not logged in"
//     token: localStorage.getItem('token') ?? null,
//   }),
//
//   // getters: Computed values derived from state (like computed in Options API).
//   getters: {
//     isLoggedIn: (state) => state.token !== null,
//     displayName: (state) => state.currentUser?.name ?? 'Guest',
//   },
//
//   // actions: Functions that can read AND modify state (like methods in Options API).
//   actions: {
//     login(user, token) {
//       this.currentUser = user
//       this.token = token
//       localStorage.setItem('token', token)
//     },
//     logout() {
//       this.currentUser = null
//       this.token = null
//       localStorage.removeItem('token')
//     },
//   },
// })
