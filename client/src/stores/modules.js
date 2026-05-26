// ─── src/stores/modules.js ───────────────────────────────────────────────────
// Pinia store for modules and their detail data.
//
// Provides the module list (for nav, semester view, dropdowns) and the
// currently active module detail (for ModuleView and its child widgets).
// ──────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useModuleStore = defineStore('modules', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const modules = ref([])              // Array of enrolled modules (summary)
  const activeModuleCode = ref(null)   // Currently viewed module code
  const activeModuleDetail = ref(null) // Full detail for the active module
  const loading = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const moduleCount = computed(() => modules.value.length)

  // Convenience: find a module from the list by code
  const getModule = (code) => modules.value.find(m => m.code === code)

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Fetch the user's enrolled module list */
  async function fetchModules() {
    loading.value = true
    try {
      const { data } = await api.get('/modules')
      modules.value = data
    } catch (err) {
      console.error('Failed to fetch modules:', err)
    } finally {
      loading.value = false
    }
  }

  /** Fetch full detail for a module (staff, topics, outcomes, etc.)
   *  plus assessments, resources, and weekly topics in parallel */
  async function fetchModuleDetail(code) {
    loading.value = true
    activeModuleCode.value = code
    try {
      const [detailRes, assessRes, resourceRes, topicRes, eventRes] = await Promise.all([
        api.get(`/modules/${code}`),
        api.get(`/modules/${code}/assessments`),
        api.get(`/modules/${code}/resources`),
        api.get(`/modules/${code}/weekly-topics`),
        api.get(`/modules/${code}/events`),
      ])
      activeModuleDetail.value = {
        ...detailRes.data,
        assessments:   assessRes.data,
        resources:     resourceRes.data,
        weekly_topics: topicRes.data,
        events:        eventRes.data,
      }
    } catch (err) {
      console.error('Failed to fetch module detail:', err)
    } finally {
      loading.value = false
    }
  }

  /** Set the active module and fetch its detail */
  async function setActiveModule(code) {
    if (code !== activeModuleCode.value) {
      await fetchModuleDetail(code)
    }
  }

  /** Update the theme color for a specific module */
  async function updateThemeColor(code, color) {
    try {
      await api.put(`/modules/${code}/color`, { theme_color: color })
      const mod = modules.value.find(m => m.code === code)
      if (mod) mod.theme_color = color
      if (activeModuleDetail.value && activeModuleCode.value === code) {
        activeModuleDetail.value.theme_color = color
      }
    } catch (err) {
      console.error('Failed to update color:', err)
    }
  }

  return {
    modules, activeModuleCode, activeModuleDetail, loading,
    moduleCount, getModule,
    fetchModules, fetchModuleDetail, setActiveModule, updateThemeColor,
  }
})
