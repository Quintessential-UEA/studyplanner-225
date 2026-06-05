<template>
  <div class="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-edge overflow-hidden relative">
    <div class="p-5 border-b border-edge bg-pop">
      <h3 class="text-lg font-extrabold text-body">New Task</h3>
    </div>

    <div class="p-5 space-y-4 overflow-y-auto">
      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
          Task Title
        </label>
        <input
          v-model="newTaskText"
          type="text"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
          Due Date
        </label>
        <input
          v-model="newTaskDueDate"
          type="date"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
          Module
        </label>
        <select
          v-model="newTaskModuleCode"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option :value="null">No module</option>
          <option
            v-for="mod in moduleStore.modules"
            :key="mod.code"
            :value="mod.code"
          >
            {{ mod.code }} - {{ mod.title }}
          </option>
        </select>
      </div>

      <div v-if="newTaskModuleCode">
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
          Exam / Coursework
        </label>
        <select
          v-model="newTaskAssessmentId"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option :value="null">No exam/coursework</option>
          <option
            v-for="assessment in filteredAssessments"
            :key="assessment.id"
            :value="assessment.id"
          >
            {{ assessment.title }} - {{ assessment.type }}
          </option>
        </select>
      </div>
    </div>

    <div class="p-5 mt-auto border-t border-edge bg-pop">
      <button
        @click="saveTask"
        :disabled="!newTaskText.trim()"
        class="w-full py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text disabled:opacity-50 transition-colors shadow-md hover:shadow-lg flex justify-center items-center gap-2"
      >
        <span class="material-symbols-outlined text-[20px]">check</span>
        Save Task
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '../../stores/tasks'
import { useModuleStore } from '../../stores/modules'

const taskStore = useTaskStore()
const moduleStore = useModuleStore()

const newTaskText = ref('')
const newTaskDueDate = ref('')
const newTaskModuleCode = ref(null)
const newTaskAssessmentId = ref(null)

const assessments = ref([])

onMounted(async () => {
  if (!moduleStore.modules.length) {
    await moduleStore.fetchModules()
  }

  await fetchAssessments()
})

async function fetchAssessments() {
  try {
    const token = localStorage.getItem('token')

    const res = await fetch('/api/assessments', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      throw new Error('Failed to fetch assessments')
    }

    assessments.value = await res.json()
  } catch (err) {
    console.error('Failed to load assessments:', err)
  }
}

const filteredAssessments = computed(() => {
  if (!newTaskModuleCode.value) return []

  return assessments.value.filter(
    assessment => assessment.module_code === newTaskModuleCode.value
  )
})

watch(newTaskModuleCode, () => {
  newTaskAssessmentId.value = null
})

const saveTask = async () => {
  if (!newTaskText.value.trim()) return

  await taskStore.addTask({
    title: newTaskText.value.trim(),
    due_date: newTaskDueDate.value || null,
    module_code: newTaskModuleCode.value,
    assessment_id: newTaskAssessmentId.value,
    status: 'pending'
  })

  newTaskText.value = ''
  newTaskDueDate.value = ''
  newTaskModuleCode.value = null
  newTaskAssessmentId.value = null
}
</script>

<script>
export const widgetMeta = {
  name: 'New Task Form',
  w: 4,
  h: 6
}
</script>