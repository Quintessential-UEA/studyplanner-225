<template>
  <div id="app-root" class="min-h-screen bg-canvas text-body font-sans overflow-x-hidden flex">

    <!-- Sidebar Navigation -->
    <NavBar v-if="nav.currentView !== 'Login'" />

    <!-- Spacer to reserve space for fixed navbar -->
    <div
      v-if="nav.currentView !== 'Login'"
      class="h-screen transition-all duration-300 ease-in-out shrink-0"
      :class="nav.isExpanded ? 'w-64' : 'w-20'"
    ></div>

    <!-- Main Content Area -->
    <main class="flex-1 relative overflow-y-auto">
      <Transition :name="transitionName" mode="out-in">
        <component :is="activeComponent" :key="nav.currentView" />
      </Transition>
    </main>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNavigationStore } from './stores/navigation'
import { useThemeStore } from './stores/theme'

// Import components
import NavBar from './components/NavBar.vue'

// Import all views
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
  TaskInbox: TaskInboxView
}

const nav = useNavigationStore()
// Init theme store (applies dark class and OS preference on first load)
useThemeStore()

const activeComponent = computed(() => {
  return views[nav.currentView] || LoginView
})

const transitionName = computed(() => {
  if (!nav.enableTransitions) return ''
  return nav.transitionDirection === 'forward' ? 'slide-left' : 'slide-right'
})
</script>

<style>
/* Base transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Left (Forward) */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide Right (Backward) */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
