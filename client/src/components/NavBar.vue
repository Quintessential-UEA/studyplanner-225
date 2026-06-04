<template>
  <nav
    class="fixed left-0 top-0 h-screen bg-card border-r border-edge flex flex-col transition-all duration-300 ease-in-out shrink-0 z-50"
    :class="isExpanded ? 'w-64' : 'w-20'"
  >
    <button
      @click="isExpanded = !isExpanded"
      class="absolute -right-3.5 top-8 bg-card border border-edge rounded-full p-1 text-ghost hover:text-body hover:bg-pop shadow-sm z-10 flex items-center justify-center transition-transform hover:scale-110"
    >
      <span class="material-symbols-outlined text-[18px]">
        {{ isExpanded ? 'chevron_left' : 'chevron_right' }}
      </span>
    </button>

    <div class="flex-1 py-6 flex flex-col overflow-y-auto overflow-x-hidden">
      <div class="px-6 mb-6 flex items-center h-8">
        <div class="bg-primary text-white rounded-lg p-1.5 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[20px]">school</span>
        </div>
        <span
          class="ml-3 font-extrabold text-body text-lg tracking-tight truncate transition-all duration-300"
          :class="isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'"
        >
          quintessential
        </span>
      </div>

      <div class="space-y-1">
        <NavItem icon="dashboard" label="Dashboard" view="Dashboard" :isExpanded="isExpanded" />
        <NavItem icon="view_timeline" label="Semester" view="Semester" :isExpanded="isExpanded" />

        <div>
          <div
            @click="isExpanded ? (moduleAccordionOpen = !moduleAccordionOpen) : null"
            class="flex items-center px-6 py-3 cursor-pointer group transition-colors"
            :class="isModuleActive ? 'bg-primary-soft text-primary-text' : 'text-dim hover:bg-pop hover:text-body'"
          >
            <span class="material-symbols-outlined text-[24px] shrink-0">library_books</span>
            <span
              class="ml-3 text-sm font-medium flex-1 truncate transition-all duration-300"
              :class="isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'"
            >
              Modules
            </span>
            <span
              v-if="isExpanded"
              class="material-symbols-outlined text-[18px] transition-transform duration-200"
              :class="moduleAccordionOpen ? 'rotate-180' : ''"
            >
              expand_more
            </span>
          </div>

          <Transition name="accordion">
            <div v-if="moduleAccordionOpen && isExpanded" class="overflow-hidden">
              <div class="pl-8 pr-4 pb-2 space-y-1">
                <div
                  v-for="mod in moduleStore.modules"
                  :key="mod.code"
                  @click="navigateToModule(mod.code)"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm group"
                  :class="moduleStore.activeModuleCode === mod.code
                    ? 'bg-card shadow-sm border border-edge font-bold text-body'
                    : 'hover:bg-pop text-dim hover:text-body'"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-card shadow-sm"
                    :style="{ backgroundColor: mod.theme_color || '#3B82F6' }"
                  ></span>
                  <span class="truncate">{{ mod.code }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <NavItem icon="calendar_month" label="Calendar" view="Calendar" :isExpanded="isExpanded" />
      </div>
    </div>

    <div class="pb-6 pt-4 border-t border-edge flex flex-col overflow-x-hidden">
      <div v-if="isExpanded" class="px-4 mb-4 flex flex-col gap-1 transition-all duration-300">
        <div
          @click="nav.navigate('TaskInbox')"
          class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-pop cursor-pointer group transition-colors"
        >
          <div class="flex items-center text-dim group-hover:text-body">
            <span class="material-symbols-outlined text-[20px] mr-3">inbox</span>
            <span class="text-sm font-medium">Tasks</span>
          </div>
          <span class="bg-primary-soft text-primary-text font-bold px-2 py-0.5 rounded-full text-[10px]">
            {{ taskStore.pendingTasks.length }}
          </span>
        </div>

        <div class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-pop cursor-pointer group transition-colors">
          <div class="flex items-center text-dim group-hover:text-body">
            <span class="material-symbols-outlined text-[20px] mr-3">campaign</span>
            <span class="text-sm font-medium">Announcements</span>
          </div>
          <span class="bg-danger-soft text-danger-text font-bold px-2 py-0.5 rounded-full text-[10px]">0</span>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-4 mb-4 transition-all duration-300">
        <div
          class="relative cursor-pointer text-ghost hover:text-body transition-colors"
          @click="nav.navigate('TaskInbox')"
          title="Tasks"
        >
          <span class="material-symbols-outlined text-[24px]">inbox</span>
          <span
            v-if="taskStore.pendingTasks.length"
            class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white font-bold ring-2 ring-card"
          >
            {{ taskStore.pendingTasks.length }}
          </span>
        </div>

        <div class="relative cursor-pointer text-ghost hover:text-body transition-colors" title="Updates">
          <span class="material-symbols-outlined text-[24px]">campaign</span>
        </div>
      </div>

      <div class="mb-2">
        <NavItem icon="settings" label="Settings" view="Settings" :isExpanded="isExpanded" />
      </div>

      <div class="mt-2 px-4">
        <div class="flex items-center cursor-pointer hover:bg-pop p-2 rounded-xl transition-colors border border-transparent hover:border-edge">
          <div class="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-card">
            {{ userStore.initials }}
          </div>
          <div
            class="ml-3 overflow-hidden transition-all duration-300 flex-1"
            :class="isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'"
          >
            <p class="text-sm font-bold text-body truncate tracking-tight">{{ userStore.displayName }}</p>
            <p class="text-[11px] font-medium text-ghost truncate uppercase tracking-wider">Student</p>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useUserStore } from '../stores/user'
import { useModuleStore } from '../stores/modules'
import { useTaskStore } from '../stores/tasks'
import NavItem from './NavItem.vue'

const nav = useNavigationStore()
const userStore = useUserStore()
const moduleStore = useModuleStore()
const taskStore = useTaskStore()

const moduleAccordionOpen = ref(true)

const isExpanded = computed({
  get: () => nav.isExpanded,
  set: (value) => {
    nav.isExpanded = value
  },
})

const isModuleActive = computed(() => nav.currentView === 'Module')

async function loadSidebarData() {
  if (!userStore.isAuthenticated) return

  const jobs = []

  if (!moduleStore.modules.length) {
    jobs.push(moduleStore.fetchModules())
  }

  if (!taskStore.tasks.length) {
    jobs.push(taskStore.fetchTasks())
  }

  if (jobs.length) {
    await Promise.allSettled(jobs)
  }
}

onMounted(() => {
  loadSidebarData()
})

watch(
  () => userStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      loadSidebarData()
    }
  }
)

function navigateToModule(code) {
  moduleStore.setActiveModule(code)
  nav.navigate('Module', 'forward')
}
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  max-height: 300px;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>