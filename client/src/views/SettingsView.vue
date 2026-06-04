<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h1 class="text-4xl font-extrabold text-body tracking-tight">Settings</h1>
    </div>

    <div class="bg-card rounded-2xl shadow-sm border border-edge overflow-hidden">
      <div class="p-6 border-b border-edge">
        <h3 class="text-lg font-semibold text-body mb-4">Appearance</h3>

        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="font-medium text-body">Dark Mode</p>
            <p class="text-sm text-dim">Switch between light and dark interface.</p>
          </div>
          <button
            @click="theme.toggleDark()"
            :class="theme.isDark ? 'bg-primary' : 'bg-rim'"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              :class="theme.isDark ? 'translate-x-6' : 'translate-x-1'"
              class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-body">Enable View Transitions</p>
            <p class="text-sm text-dim">Smooth sliding animations between views.</p>
          </div>
          <button
            @click="nav.toggleTransitions()"
            :class="nav.enableTransitions ? 'bg-primary' : 'bg-rim'"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              :class="nav.enableTransitions ? 'translate-x-6' : 'translate-x-1'"
              class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>
      </div>

      <div class="p-6 border-b border-edge">
        <h3 class="text-lg font-semibold text-body mb-4">Module Themes</h3>
        <div class="space-y-4">
          <div v-for="mod in moduleStore.modules" :key="mod.code" class="flex items-center justify-between">
            <span class="font-medium text-body">{{ mod.code }} - {{ mod.title }}</span>
            <div class="flex items-center gap-3">
              <input
                type="color"
                v-model="mod.theme_color"
                class="w-10 h-10 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <button
                @click="moduleStore.updateThemeColor(mod.code, mod.theme_color)"
                class="text-sm font-medium bg-pop hover:bg-edge text-body py-2 px-3 rounded-md transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-b border-edge">
        <h3 class="text-lg font-semibold text-body mb-4">Account</h3>
        <button
          @click="logout"
          class="text-danger font-medium hover:text-danger-text transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useModuleStore } from '../stores/modules'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '../stores/user'
import { useTaskStore } from '../stores/tasks'
import { useEventStore } from '../stores/events'

const nav = useNavigationStore()
const moduleStore = useModuleStore()
const theme = useThemeStore()
const userStore = useUserStore()
const taskStore = useTaskStore()
const eventStore = useEventStore()

onMounted(() => {
  if (userStore.isAuthenticated && moduleStore.modules.length === 0) {
    moduleStore.fetchModules()
  }
})

function logout() {
  userStore.logout()
  eventStore.clear()

  moduleStore.modules = []
  moduleStore.activeModuleCode = null
  moduleStore.activeModuleDetail = null

  taskStore.tasks = []

  localStorage.removeItem('appState')
  nav.resetForLogout()
}
</script>