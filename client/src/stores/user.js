// ─── src/stores/user.js ──────────────────────────────────────────────────────
// Pinia store for the current user's profile data.
//
// Fetches from GET /api/user/profile and provides reactive state
// for NavBar (avatar, name) and any view that needs user info.
// ──────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useUserStore = defineStore('user', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const profile = ref(null)
  const loading = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const displayName = computed(() => profile.value?.preferred_name || profile.value?.full_name || 'Guest')

  const initials = computed(() => {
    const name = profile.value?.full_name
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  })

  const studentNumber = computed(() => profile.value?.student_number || '')

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function fetchProfile() {
    loading.value = true
    try {
      const { data } = await api.get('/user/profile')
      profile.value = data
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      loading.value = false
    }
  }

  return { profile, loading, displayName, initials, studentNumber, fetchProfile }
})
