// client/src/stores/navigation.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'appState'

function loadSavedState() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      currentView: 'Login',
      enableTransitions: true,
      isExpanded: true,
      transitionDirection: 'forward',
    }
  }

  try {
    const parsed = JSON.parse(raw)

    return {
      currentView: parsed.currentView || 'Login',
      enableTransitions: parsed.enableTransitions ?? true,
      isExpanded: parsed.isExpanded ?? true,
      transitionDirection: parsed.transitionDirection || 'forward',
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return {
      currentView: 'Login',
      enableTransitions: true,
      isExpanded: true,
      transitionDirection: 'forward',
    }
  }
}

export const useNavigationStore = defineStore('navigation', () => {
  const saved = loadSavedState()

  const currentView = ref(saved.currentView)
  const enableTransitions = ref(saved.enableTransitions)
  const isExpanded = ref(saved.isExpanded)
  const transitionDirection = ref(saved.transitionDirection)

  function persistState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentView: currentView.value,
        enableTransitions: enableTransitions.value,
        isExpanded: isExpanded.value,
        transitionDirection: transitionDirection.value,
      })
    )
  }

  watch(
    [currentView, enableTransitions, isExpanded, transitionDirection],
    persistState,
    { deep: true }
  )

  function navigate(view, direction = 'forward') {
    transitionDirection.value = direction
    currentView.value = view
  }

  function toggleTransitions() {
    enableTransitions.value = !enableTransitions.value
  }

  function resetForLogout() {
    transitionDirection.value = 'backward'
    currentView.value = 'Login'
    persistState()
  }

  return {
    currentView,
    enableTransitions,
    isExpanded,
    transitionDirection,
    navigate,
    toggleTransitions,
    resetForLogout,
  }
})