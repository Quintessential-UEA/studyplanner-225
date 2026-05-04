// ─── src/api/index.js ─────────────────────────────────────────────────────────
// This file creates and exports a single, pre-configured Axios instance.
//
// Instead of importing Axios directly everywhere and repeating configuration,
// all components import this 'api' object. This gives us one place to:
//   • Set the base URL for all requests
//   • Attach authentication headers (JWT token)
//   • Handle errors globally (e.g., redirect to login on 401 Unauthorized)
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios'

// ─── Create Axios Instance ───────────────────────────────────────────────────
// axios.create() creates a new Axios instance with custom default settings.
// Every request made through this 'api' object will use these settings.
const api = axios.create({
  // baseURL: All request paths are relative to this.
  // '/api' works because Vite proxies '/api/*' to 'http://localhost:3000' —
  // see vite.config.js. In production, this would point to the deployed backend.
  baseURL: '/api',

  // timeout: If the server doesn't respond within 8 seconds, the request
  // fails with a timeout error. Prevents the app hanging indefinitely.
  timeout: 8000,

  // headers: Default headers sent with every request.
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ────────────────────────────────────────────────────
// Interceptors run automatically before every request or after every response.
// This request interceptor attaches the user's JWT auth token to every request
// so the backend can verify who is making the request.
api.interceptors.request.use(
  (config) => {
    // Read the JWT token that was stored in localStorage after login.
    const token = localStorage.getItem('token')

    if (token) {
      // 'Authorization: Bearer <token>' is the standard HTTP header format
      // for JWT authentication. The backend reads this header to verify the user.
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ───────────────────────────────────────────────────
// This runs after every response (or error) comes back from the server.
api.interceptors.response.use(
  // If the response is successful (2xx status code), pass it through unchanged.
  (response) => response,

  (error) => {
    // If the server responds with 401 Unauthorized (e.g., token expired),
    // clear the stored token and redirect to the login page.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // TODO: redirect to login route once Vue Router is set up
      // router.push('/login')
    }

    return Promise.reject(error)
  }
)

// Export the configured instance so any component can do:
//   import api from '../api'
//   const response = await api.get('/tasks')
export default api
