import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export const useNavigationStore = defineStore('navigation', () => {
  const currentView = ref('Login')
  const enableTransitions = ref(true)
  const isExpanded = ref(true)
  
  // Track the direction of navigation for sliding animations
  // 'forward' or 'backward'
  const transitionDirection = ref('forward')

  // Read from localStorage on initialization
  const savedState = localStorage.getItem('appState')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      const now = Date.now()
      
      // Check if session has expired
      if (now - parsed.lastActivity < SESSION_TIMEOUT_MS) {
        currentView.value = parsed.currentView || 'Login'
        if (parsed.enableTransitions !== undefined) {
          enableTransitions.value = parsed.enableTransitions
        }
        if (parsed.isExpanded !== undefined) {
          isExpanded.value = parsed.isExpanded
        }
      } else {
        // Session expired, clean up
        localStorage.removeItem('appState')
      }
    } catch (e) {
      console.error('Failed to parse saved state', e)
    }
  }

  // Save to localStorage whenever state changes
  const updateActivity = () => {
    localStorage.setItem('appState', JSON.stringify({
      currentView: currentView.value,
      enableTransitions: enableTransitions.value,
      isExpanded: isExpanded.value,
      lastActivity: Date.now()
    }))
  }

  watch([currentView, enableTransitions, isExpanded], () => {
    updateActivity()
  }, { deep: true })

  // Intercept window interactions to reset session timeout
  if (typeof window !== 'undefined') {
    const resetTimeout = () => updateActivity()
    window.addEventListener('click', resetTimeout)
    window.addEventListener('keypress', resetTimeout)
  }

  const navigate = (view, direction = 'forward') => {
    transitionDirection.value = direction
    currentView.value = view
  }

  const toggleTransitions = () => {
    enableTransitions.value = !enableTransitions.value
  }

  return {
    currentView,
    enableTransitions,
    isExpanded,
    transitionDirection,
    navigate,
    toggleTransitions
  }
})

