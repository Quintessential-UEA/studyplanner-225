// client/src/App.vue
<template>
  <div
    v-if="appReady"
    id="app-root"
    class="min-h-screen bg-canvas text-body font-sans overflow-x-hidden flex"
  >
    <NavBar v-if="nav.currentView !== 'Login'" />

    <div
      v-if="nav.currentView !== 'Login'"
      class="h-screen transition-all duration-300 ease-in-out shrink-0"
      :class="nav.isExpanded ? 'w-64' : 'w-20'"
    ></div>

    <main class="flex-1 relative overflow-y-auto">
      <Transition :name="transitionName" mode="out-in">
        <component :is="activeComponent" :key="nav.currentView" />
      </Transition>
    </main>
  </div>

  <div v-else class="min-h-screen bg-canvas text-body flex items-center justify-center">
    <div class="text-dim text-sm tracking-wide uppercase">Loading session...</div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useNavigationStore } from './stores/navigation'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user'

import NavBar from './components/NavBar.vue'

import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import SettingsView from './views/SettingsView.vue'
import SemesterView from './views/SemesterView.vue'
import ModuleView from './views/ModuleView.vue'
import CalendarView from './views/CalendarView.vue'
import TaskInboxView from './views/TaskInboxView.vue'

const views = {
  Login: LoginView,
  Dashboard: DashboardView,
  Settings: SettingsView,
  Semester: SemesterView,
  Module: ModuleView,
  Calendar: CalendarView,
  TaskInbox: TaskInboxView,
}

const nav = useNavigationStore()
const userStore = useUserStore()
useThemeStore()

const appReady = ref(false)

const activeComponent = computed(() => {
  return views[nav.currentView] || LoginView
})

const transitionName = computed(() => {
  if (!nav.enableTransitions) return ''
  return nav.transitionDirection === 'forward' ? 'slide-left' : 'slide-right'
})

function handleUnauthorized() {
  userStore.clearSession()
  nav.navigate('Login', 'backward')
}

onMounted(async () => {
  window.addEventListener('auth:unauthorized', handleUnauthorized)

  const hasSession = await userStore.bootstrapSession()

  if (hasSession) {
    if (nav.currentView === 'Login') {
      nav.navigate('Dashboard', 'forward')
    }
  } else {
    nav.navigate('Login', 'backward')
  }

  appReady.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:unauthorized', handleUnauthorized)
})
</script>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>