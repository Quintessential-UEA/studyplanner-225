<template>
  <div class="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-edge overflow-hidden relative">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-edge flex justify-between items-center bg-pop">
      <h2 class="text-base font-bold text-body flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[20px]">inbox</span>
        Task Inbox
      </h2>
      <div class="flex items-center gap-3">
        <button 
          @click="showCompleted = !showCompleted" 
          class="text-xs font-bold px-2.5 py-1 rounded-md transition-colors"
          :class="showCompleted ? 'bg-primary text-white' : 'bg-edge text-dim hover:text-body'"
        >
          {{ showCompleted ? 'Hide Completed' : 'Show Completed' }}
        </button>
        <span class="text-xs font-bold bg-primary-soft text-primary-text px-2.5 py-0.5 rounded-full">
          {{ filteredTasks.length }}
        </span>
      </div>
    </div>

    <!-- Task List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-1">
      <div v-if="taskStore.loading" class="p-4 text-center text-dim text-sm font-medium">
        Loading tasks...
      </div>
      <div v-else-if="!filteredTasks.length" class="p-4 text-center text-dim text-sm font-medium">
        {{ showCompleted ? 'No tasks found.' : 'No pending tasks. You\'re all caught up!' }}
      </div>

      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="draggable-task flex items-start gap-3 p-3 rounded-xl hover:bg-pop border border-transparent hover:border-edge transition-all group cursor-pointer"
        :data-task-id="task.id"
        :data-title="task.title"
        :data-color="(task.theme_color || '#10b981') + '80'"
      >
        <span class="material-symbols-outlined text-ghost mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-[16px]">drag_indicator</span>
        <input
          type="checkbox"
          :checked="task.status === 'completed'"
          @change="taskStore.updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')"
          class="mt-1 w-4 h-4 rounded border-rim text-primary focus:ring-primary cursor-pointer shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold transition-colors truncate" :class="task.status === 'completed' ? 'text-ghost line-through' : 'text-body group-hover:text-primary'">{{ task.title }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span v-if="task.module_code" class="text-[10px] font-bold bg-pop text-dim px-1.5 py-0.5 rounded uppercase">
              {{ task.module_code }}
            </span>
            <p v-if="task.due_date" class="text-xs text-ghost flex items-center gap-1 font-medium">
              <span class="material-symbols-outlined text-[12px]">calendar_today</span>
              {{ new Date(task.due_date).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <button
          @click.stop="taskStore.removeTask(task.id)"
          class="opacity-0 group-hover:opacity-100 text-ghost hover:text-danger transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>

    <!-- Quick Add -->
    <div v-if="!hideQuickAdd" class="p-3 border-t border-edge bg-pop">
      <div class="relative flex items-center">
        <input
          v-model="newTaskText"
          @keyup.enter="openModal"
          type="text"
          placeholder="Quick add a task..."
          class="w-full pl-4 pr-12 py-3 rounded-xl border border-edge bg-card text-body placeholder-ghost focus:border-primary focus:ring-2 focus:ring-primary-soft outline-none transition-all text-sm shadow-sm"
        />
        <button
          @click="openModal"
          :disabled="!newTaskText.trim()"
          class="absolute right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-text disabled:opacity-40 transition-all flex items-center justify-center shadow-sm"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
        </button>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="isModalOpen" class="absolute inset-0 bg-card z-10 flex flex-col p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)]">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-extrabold text-body">New Task Details</h3>
        <button @click="closeModal" class="text-ghost hover:text-danger transition-colors bg-pop hover:bg-danger-soft rounded-full p-1 flex">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Task Title</label>
          <input v-model="newTaskText" type="text" class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Due Date</label>
          <input v-model="newTaskDueDate" type="date" class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Module</label>
          <select v-model="newTaskModuleCode" class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
            <option :value="null">No module</option>
            <option v-for="mod in moduleStore.modules" :key="mod.code" :value="mod.code">
              {{ mod.code }} - {{ mod.title }}
            </option>
          </select>
        </div>
      </div>

      <div class="pt-4 mt-auto">
        <button
          @click="saveTask"
          class="w-full py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text transition-colors shadow-md hover:shadow-lg flex justify-center items-center gap-2"
        >
          <span class="material-symbols-outlined text-[20px]">check</span>
          Save Task
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useModuleStore } from '../stores/modules'

const props = defineProps({
  hideQuickAdd: { type: Boolean, default: false },
  moduleCode:   { type: String,  default: null  }
})

const taskStore   = useTaskStore()
const moduleStore = useModuleStore()

const newTaskText       = ref('')
const newTaskDueDate    = ref('')
const newTaskModuleCode = ref(null)
const isModalOpen       = ref(false)
const showCompleted     = ref(false)

const filteredTasks = computed(() => {
  const baseTasks = showCompleted.value ? taskStore.tasks : taskStore.pendingTasks
  if (props.moduleCode) {
    return baseTasks.filter(t => t.module_code === props.moduleCode)
  }
  return baseTasks
})

onMounted(async () => {
  if (!taskStore.tasks.length) await taskStore.fetchTasks()
  if (!moduleStore.modules.length) await moduleStore.fetchModules()
})

const openModal = () => {
  if (newTaskText.value.trim()) {
    newTaskModuleCode.value = props.moduleCode
    isModalOpen.value = true
  }
}

const closeModal = () => {
  isModalOpen.value = false
  newTaskText.value = ''
  newTaskDueDate.value = ''
  newTaskModuleCode.value = null
}

const saveTask = async () => {
  if (!newTaskText.value.trim()) return
  await taskStore.addTask({
    title:      newTaskText.value.trim(),
    due_date:   newTaskDueDate.value || null,
    module_code: newTaskModuleCode.value,
    status:     'pending'
  })
  closeModal()
}
</script>
