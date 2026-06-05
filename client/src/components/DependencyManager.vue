// client/src/components/DependencyManager.vue
<template>
  <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col min-h-[280px] relative overflow-hidden">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold text-body flex items-center gap-2">
        <span class="material-symbols-outlined text-accent-text text-[20px]">device_hub</span>
        Dependencies
      </h2>

      <button
        @click="openCreateModal()"
        :disabled="moduleTasks.length < 2"
        class="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add Dependency
      </button>
    </div>

    <div v-if="moduleTasks.length < 2" class="flex-1 flex items-center justify-center text-sm text-dim font-medium">
      Create at least two tasks in this module to add dependencies.
    </div>

    <div v-else class="space-y-3 flex-1 overflow-y-auto pr-1">
      <div
        v-for="task in moduleTasks"
        :key="task.id"
        class="bg-pop rounded-xl border border-edge p-4"
      >
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="min-w-0">
            <p class="text-sm font-bold text-body truncate">
              {{ task.title }}
            </p>
            <p class="text-[11px] text-ghost font-medium mt-1">
              {{ dependenciesForTask(task.id).length }} prerequisite<span v-if="dependenciesForTask(task.id).length !== 1">s</span>
            </p>
          </div>
        </div>

        <div v-if="dependenciesForTask(task.id).length" class="space-y-2">
          <div
            v-for="dependency in dependenciesForTask(task.id)"
            :key="dependency.id"
            class="bg-card rounded-lg border border-edge px-3 py-3 flex items-start justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold text-body">
                Depends on: {{ dependency.depends_on_title }}
              </p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <span class="text-[10px] font-bold bg-primary-soft text-primary-text px-1.5 py-0.5 rounded uppercase">
                  {{ formatStatus(dependency.depends_on_status) }}
                </span>

                <span
                  v-if="dependency.depends_on_due_date"
                  class="text-[10px] font-bold bg-pop text-dim px-1.5 py-0.5 rounded"
                >
                  {{ formatDate(dependency.depends_on_due_date) }}
                </span>
              </div>
            </div>

            <button
              @click="removeDependency(dependency.id)"
              class="text-ghost hover:text-danger transition-colors shrink-0"
              title="Delete dependency"
            >
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>

        <div v-else class="text-sm text-dim font-medium">
          No dependencies yet for this task.
        </div>
      </div>
    </div>

    <div
      v-if="isModalOpen"
      class="absolute inset-0 bg-card z-10 flex flex-col p-6 rounded-2xl"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-extrabold text-body">New Dependency</h3>

        <button
          @click="closeModal"
          class="text-ghost hover:text-danger transition-colors bg-pop hover:bg-danger-soft rounded-full p-1 flex"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto pr-1">
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Task
          </label>
          <select
            v-model="form.task_id"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option :value="null">Select task</option>
            <option
              v-for="task in moduleTasks"
              :key="task.id"
              :value="task.id"
            >
              {{ task.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Depends On
          </label>
          <select
            v-model="form.depends_on_task_id"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option :value="null">Select prerequisite task</option>
            <option
              v-for="task in availableDependencyTargets"
              :key="task.id"
              :value="task.id"
            >
              {{ task.title }}
            </option>
          </select>
        </div>

        <p v-if="formError" class="text-sm text-danger font-medium">
          {{ formError }}
        </p>
      </div>

      <div class="pt-4 mt-auto flex gap-3">
        <button
          @click="closeModal"
          class="flex-1 py-3 bg-pop text-body rounded-xl font-bold tracking-wide hover:bg-edge transition-colors"
        >
          Cancel
        </button>

        <button
          @click="saveDependency"
          :disabled="saving"
          class="flex-1 py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text transition-colors disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : 'Create Dependency' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useTaskStore } from '../stores/tasks'

const props = defineProps({
  moduleCode: {
    type: String,
    required: true,
  },
})

const taskStore = useTaskStore()

const isModalOpen = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  task_id: null,
  depends_on_task_id: null,
})

const moduleTasks = computed(() => {
  return taskStore.tasksByModule(props.moduleCode) || []
})

const moduleTaskIds = computed(() => {
  return new Set(moduleTasks.value.map((task) => task.id))
})

const moduleDependencies = computed(() => {
  return taskStore.dependencies.filter(
    (dependency) =>
      moduleTaskIds.value.has(dependency.task_id) &&
      moduleTaskIds.value.has(dependency.depends_on_task_id)
  )
})

const availableDependencyTargets = computed(() => {
  return moduleTasks.value.filter((task) => task.id !== form.task_id)
})

function dependenciesForTask(taskId) {
  return moduleDependencies.value.filter((dependency) => dependency.task_id === taskId)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}

function formatStatus(value) {
  return String(value || 'pending')
    .replace('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function resetForm() {
  form.task_id = null
  form.depends_on_task_id = null
  formError.value = ''
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  resetForm()
}

async function saveDependency() {
  formError.value = ''

  if (!form.task_id) {
    formError.value = 'Task is required.'
    return
  }

  if (!form.depends_on_task_id) {
    formError.value = 'Prerequisite task is required.'
    return
  }

  if (form.task_id === form.depends_on_task_id) {
    formError.value = 'A task cannot depend on itself.'
    return
  }

  saving.value = true

  try {
    await taskStore.addDependency({
      task_id: form.task_id,
      depends_on_task_id: form.depends_on_task_id,
    })

    closeModal()
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to save dependency.'
  } finally {
    saving.value = false
  }
}

async function removeDependency(id) {
  await taskStore.removeDependency(id)
}
</script>