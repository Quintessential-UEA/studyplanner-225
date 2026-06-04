// client/src/api/index.js
import axios from 'axios'

function clearStoredSession() {
  localStorage.removeItem('token')
}

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    return Promise.reject(error)
  }
)

export default api