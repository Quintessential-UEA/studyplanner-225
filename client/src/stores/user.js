// client/src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const profile = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))

  const displayName = computed(() => {
    if (profile.value?.preferred_name) return profile.value.preferred_name
    if (profile.value?.full_name) return profile.value.full_name
    if (profile.value?.email) return profile.value.email
    return 'Guest'
  })

  const initials = computed(() => {
    const name = profile.value?.full_name || profile.value?.preferred_name || profile.value?.email

    if (!name) return '?'

    if (name.includes('@')) {
      return name[0].toUpperCase()
    }

    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  })

  const studentNumber = computed(() => profile.value?.student_number || '')

  function setToken(value) {
    token.value = value || ''

    if (token.value) {
      localStorage.setItem('token', token.value)
    } else {
      localStorage.removeItem('token')
    }
  }

  function clearSession() {
    setToken('')
    profile.value = null
  }

  async function login(email) {
    loading.value = true

    try {
      const { data } = await api.post('/user/login', { email })

      if (!data?.token) {
        throw new Error('Login response did not include a token')
      }

      setToken(data.token)
      profile.value = data.user ?? null

      if (!profile.value) {
        await fetchProfile()
      }

      return profile.value
    } catch (err) {
      clearSession()
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) {
      profile.value = null
      return null
    }

    loading.value = true

    try {
      const { data } = await api.get('/user/profile')
      profile.value = data
      return data
    } catch (err) {
      profile.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  async function bootstrapSession() {
    if (!token.value) {
      profile.value = null
      return false
    }

    try {
      await fetchProfile()
      return true
    } catch {
      clearSession()
      return false
    }
  }

  function logout() {
    clearSession()
  }

  return {
    token,
    profile,
    loading,
    isAuthenticated,
    displayName,
    initials,
    studentNumber,
    login,
    fetchProfile,
    bootstrapSession,
    logout,
    clearSession,
  }
})