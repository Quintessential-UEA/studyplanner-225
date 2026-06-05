<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex items-center gap-4 mb-8 shrink-0">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <h1 class="text-4xl font-extrabold text-body tracking-tight">
        Task Inbox
      </h1>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6 min-h-0 flex-1">
      <div class="min-h-0">
        <TaskManager ref="taskManagerRef" :hideQuickAdd="true" />
      </div>

      <div class="flex flex-col gap-6 min-h-0">
        <TaskStatsWidget />

        <div class="bg-card rounded-2xl shadow-sm border border-edge p-5">
          <h2 class="text-base font-bold text-body mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">overview</span>
            Planner Summary
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-pop rounded-xl p-4 border border-edge">
              <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                Milestones
              </p>
              <p class="text-2xl font-extrabold text-body">
                {{ taskStore.milestones.length }}
              </p>
            </div>

            <div class="bg-pop rounded-xl p-4 border border-edge">
              <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                Dependencies
              </p>
              <p class="text-2xl font-extrabold text-body">
                {{ taskStore.dependencies.length }}
              </p>
            </div>

            <div class="bg-pop rounded-xl p-4 border border-edge">
              <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                Activities
              </p>
              <p class="text-2xl font-extrabold text-body">
                {{ taskStore.activities.length }}
              </p>
            </div>

            <div class="bg-pop rounded-xl p-4 border border-edge">
              <p class="text-[11px] uppercase tracking-wider text-ghost font-bold mb-1">
                Scheduled
              </p>
              <p class="text-2xl font-extrabold text-body">
                {{ taskStore.scheduledTasks.length }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-2xl shadow-sm border border-edge p-5">
          <h2 class="text-base font-bold text-body mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">add_task</span>
            Quick Add Task
          </h2>

          <div class="space-y-3">
            <input
              v-model="quickTaskText"
              @keyup.enter="openQuickAddModal"
              type="text"
              placeholder="What needs to be done?"
              class="w-full px-4 py-3 rounded-xl border border-edge bg-pop text-body placeholder-ghost focus:border-primary focus:ring-2 focus:ring-primary-soft outline-none transition-all text-sm"
            />

            <button
              @click="openQuickAddModal"
              :disabled="!quickTaskText.trim()"
              class="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Open task details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useTaskStore } from '../stores/tasks'
import TaskManager from '../components/TaskManager.vue'
import TaskStatsWidget from '../components/widgets/TaskStatsWidget.vue'

const nav = useNavigationStore()
const taskStore = useTaskStore()

const taskManagerRef = ref(null)
const quickTaskText = ref('')

onMounted(async () => {
  if (
    !taskStore.tasks.length &&
    !taskStore.milestones.length &&
    !taskStore.dependencies.length &&
    !taskStore.activities.length
  ) {
    await taskStore.fetchPlannerData()
  }
})

function openQuickAddModal() {
  if (!quickTaskText.value.trim()) return

  taskManagerRef.value?.openCreateModal(quickTaskText.value.trim())
  quickTaskText.value = ''
}
</script>