<template>
  <div class="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-edge overflow-hidden relative">
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

        <button
          @click="openCreateModal()"
          class="text-xs font-bold px-2.5 py-1 rounded-md bg-primary text-white hover:bg-primary-text transition-colors"
        >
          Add Task
        </button>

        <span class="text-xs font-bold bg-primary-soft text-primary-text px-2.5 py-0.5 rounded-full">
          {{ filteredTasks.length }}
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div
        v-if="actionError"
        class="px-3 py-2 rounded-xl border border-danger-border bg-danger-soft text-danger text-sm font-medium"
      >
        {{ actionError }}
      </div>

      <div v-if="taskStore.loading" class="p-4 text-center text-dim text-sm font-medium">
        Loading tasks...
      </div>

      <div v-else-if="!filteredTasks.length" class="p-4 text-center text-dim text-sm font-medium">
        {{ showCompleted ? 'No tasks found.' : 'No pending tasks. You\'re all caught up!' }}
      </div>

      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="draggable-task p-3 rounded-xl hover:bg-pop border border-transparent hover:border-edge transition-all group"
        :data-task-id="task.id"
        :data-title="task.title"
        :data-color="(task.theme_color || '#10b981') + '80'"
      >
        <div class="flex items-start gap-3 cursor-pointer" @click="openEditModal(task)">
          <span class="material-symbols-outlined text-ghost mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-[16px]">
            drag_indicator
          </span>

          <input
            type="checkbox"
            :checked="task.status === 'completed'"
            :disabled="isTaskBlocked(task)"
            :title="isTaskBlocked(task) ? `Blocked by: ${blockingDependencyText(task)}` : ''"
            @click.stop
            @change="toggleTaskStatus(task)"
            class="mt-1 w-4 h-4 rounded border-rim text-primary focus:ring-primary cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-sm font-semibold transition-colors truncate"
                  :class="task.status === 'completed' ? 'text-ghost line-through' : 'text-body group-hover:text-primary'"
                >
                  {{ task.title }}
                </p>

                <div class="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    v-if="task.module_code"
                    class="text-[10px] font-bold bg-pop text-dim px-1.5 py-0.5 rounded uppercase"
                  >
                    {{ task.module_code }}
                  </span>

                  <span
                    v-if="task.type"
                    class="text-[10px] font-bold bg-primary-soft text-primary-text px-1.5 py-0.5 rounded uppercase"
                  >
                    {{ formatTaskType(task.type) }}
                  </span>

                  <span
                    v-if="task.assessment_title"
                    class="text-[10px] font-bold bg-info-soft text-info-text px-1.5 py-0.5 rounded"
                  >
                    {{ task.assessment_title }}
                  </span>

                  <span
                    v-if="task.milestone_title"
                    class="text-[10px] font-bold bg-warn-soft text-warn-text px-1.5 py-0.5 rounded"
                  >
                    {{ task.milestone_title }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-ghost">
                  <p v-if="task.due_date" class="flex items-center gap-1 font-medium">
                    <span class="material-symbols-outlined text-[12px]">calendar_today</span>
                    {{ formatDate(task.due_date) }}
                  </p>

                  <p v-if="hasTarget(task)" class="flex items-center gap-1 font-medium">
                    <span class="material-symbols-outlined text-[12px]">timeline</span>
                    {{ Number(task.logged_amount || 0) }} / {{ Number(task.target_amount) }} {{ task.target_metric || '' }}
                  </p>

                  <p
                    v-if="taskStore.activitySummaryForTask(task.id).count"
                    class="flex items-center gap-1 font-medium"
                  >
                    <span class="material-symbols-outlined text-[12px]">schedule</span>
                    {{ taskStore.activitySummaryForTask(task.id).totalTimeSpentHours }}h logged
                  </p>

                  <p
                    v-if="taskStore.activitySummaryForTask(task.id).count"
                    class="flex items-center gap-1 font-medium"
                  >
                    <span class="material-symbols-outlined text-[12px]">bolt</span>
                    {{ taskStore.activitySummaryForTask(task.id).count }} activities
                  </p>
                </div>

                <p
                  v-if="isTaskBlocked(task)"
                  class="mt-2 text-[11px] font-medium text-warn-text"
                >
                  Blocked by: {{ blockingDependencyText(task) }}
                </p>

                <p
                  v-if="task.description"
                  class="mt-2 text-[12px] text-dim"
                >
                  {{ task.description }}
                </p>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button
                  @click.stop="openActivityModal(task)"
                  class="text-ghost hover:text-ok transition-all"
                  title="Log activity"
                >
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                </button>

                <button
                  @click.stop="openEditModal(task)"
                  class="text-ghost hover:text-primary transition-all"
                  title="Edit task"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>

                <button
                  @click.stop="removeTask(task.id)"
                  class="text-ghost hover:text-danger transition-all"
                  title="Delete task"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>

            <div v-if="hasTarget(task)" class="mt-3">
              <div class="h-2 rounded-full bg-pop overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-300"
                  :style="{ width: `${taskStore.taskProgress(task).progressPercent}%` }"
                ></div>
              </div>
              <p class="mt-1 text-[11px] text-ghost font-medium">
                {{ taskStore.taskProgress(task).progressPercent }}% complete
                <span v-if="taskStore.taskProgress(task).loggedTimeSpentHours">
                  · {{ taskStore.taskProgress(task).loggedTimeSpentHours }}h spent
                </span>
              </p>
            </div>

            <div
              v-if="taskStore.activitiesForTask(task.id).length"
              class="mt-4 rounded-xl border border-edge bg-card"
            >
              <div class="px-3 py-2 border-b border-edge text-[11px] uppercase tracking-wider text-ghost font-bold">
                Activity Log
              </div>

              <div class="divide-y divide-edge">
                <div
                  v-for="activity in taskStore.activitiesForTask(task.id)"
                  :key="activity.id"
                  class="px-3 py-3 flex items-start justify-between gap-3"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[10px] font-bold bg-primary-soft text-primary-text px-1.5 py-0.5 rounded uppercase">
                        {{ activity.metric }}
                      </span>
                      <span class="text-[10px] font-bold bg-pop text-dim px-1.5 py-0.5 rounded">
                        {{ Number(activity.amount) }}
                      </span>
                      <span class="text-[10px] font-bold bg-info-soft text-info-text px-1.5 py-0.5 rounded">
                        {{ formatMinutes(activity.time_spent_minutes) }}
                      </span>
                    </div>

                    <p class="text-[12px] text-body font-medium mt-2">
                      {{ formatDate(activity.date) }}
                    </p>

                    <p
                      v-if="activity.description"
                      class="text-[12px] text-dim mt-1 break-words"
                    >
                      {{ activity.description }}
                    </p>
                  </div>

                  <button
                    @click.stop="removeActivity(activity.id)"
                    class="text-ghost hover:text-danger transition-colors shrink-0"
                    title="Delete activity"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <button
                @click.stop="openActivityModal(task)"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-ok-soft text-ok-text border border-ok-border hover:opacity-90 transition-colors"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!hideQuickAdd" class="p-3 border-t border-edge bg-pop">
      <div class="relative flex items-center">
        <input
          v-model="quickTaskText"
          @keyup.enter="openCreateModal(quickTaskText)"
          type="text"
          placeholder="Quick add a task..."
          class="w-full pl-4 pr-24 py-3 rounded-xl border border-edge bg-card text-body placeholder-ghost focus:border-primary focus:ring-2 focus:ring-primary-soft outline-none transition-all text-sm shadow-sm"
        />
        <button
          @click="openCreateModal(quickTaskText)"
          :disabled="!quickTaskText.trim()"
          class="absolute right-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-text disabled:opacity-40 transition-all flex items-center justify-center shadow-sm text-sm font-semibold"
        >
          Details
        </button>
      </div>
    </div>

    <div
      v-if="isModalOpen"
      class="absolute inset-0 bg-card z-10 flex flex-col p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)]"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-extrabold text-body">
          {{ isEditing ? 'Edit Task' : 'New Task Details' }}
        </h3>

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
            Task Title
          </label>
          <input
            v-model="form.title"
            type="text"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Module
            </label>
            <select
              v-model="form.module_code"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option :value="null">Select module</option>
              <option
                v-for="modOption in moduleStore.modules"
                :key="modOption.code"
                :value="modOption.code"
              >
                {{ modOption.code }} - {{ modOption.title }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Task Type
            </label>
            <select
              v-model="form.type"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option
                v-for="type in taskTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Assessment
            </label>
            <select
              v-model="form.assessment_id"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              :disabled="!form.module_code || assessmentLoading"
            >
              <option :value="null">
                {{ assessmentLoading ? 'Loading assessments...' : 'Optional' }}
              </option>
              <option
                v-for="assessment in assessmentOptions"
                :key="assessment.id"
                :value="assessment.id"
              >
                {{ assessment.title }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Milestone
            </label>
            <select
              v-model="form.milestone_id"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              :disabled="!form.assessment_id || taskStore.milestoneLoading"
            >
              <option :value="null">Optional</option>
              <option
                v-for="milestone in milestoneOptions"
                :key="milestone.id"
                :value="milestone.id"
              >
                {{ milestone.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Target Metric
            </label>
            <input
              v-model="form.target_metric"
              type="text"
              placeholder="hours, pages, sections..."
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Target Amount
            </label>
            <input
              v-model.number="form.target_amount"
              type="number"
              min="0"
              step="0.5"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Due Date
            </label>
            <input
              v-model="form.due_date"
              type="date"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div v-if="isEditing">
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Status
          </label>
          <select
            v-model="form.status"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="Add notes, requirements, or context for this task..."
          ></textarea>
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
          @click="saveTask"
          :disabled="saving"
          class="flex-1 py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text transition-colors shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-60"
        >
          <span class="material-symbols-outlined text-[20px]">check</span>
          {{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task' }}
        </button>
      </div>
    </div>

    <div
      v-if="isActivityModalOpen"
      class="absolute inset-0 bg-card z-20 flex flex-col p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)]"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-extrabold text-body">
          Log Activity
          <span v-if="activityTaskTitle" class="text-dim font-semibold">· {{ activityTaskTitle }}</span>
        </h3>

        <button
          @click="closeActivityModal"
          class="text-ghost hover:text-danger transition-colors bg-pop hover:bg-danger-soft rounded-full p-1 flex"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto pr-1">
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Date
          </label>
          <input
            v-model="activityForm.date"
            type="date"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Metric
            </label>
            <input
              v-model="activityForm.metric"
              type="text"
              placeholder="hours, pages, sections..."
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
              Contribution Amount
            </label>
            <input
              v-model.number="activityForm.amount"
              type="number"
              min="0"
              step="0.5"
              class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Time Spent (Minutes)
          </label>
          <input
            v-model.number="activityForm.time_spent_minutes"
            type="number"
            min="1"
            step="5"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Description
          </label>
          <textarea
            v-model="activityForm.description"
            rows="4"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="Describe what work you completed..."
          ></textarea>
        </div>

        <p v-if="activityFormError" class="text-sm text-danger font-medium">
          {{ activityFormError }}
        </p>
      </div>

      <div class="pt-4 mt-auto flex gap-3">
        <button
          @click="closeActivityModal"
          class="flex-1 py-3 bg-pop text-body rounded-xl font-bold tracking-wide hover:bg-edge transition-colors"
        >
          Cancel
        </button>

        <button
          @click="saveActivity"
          :disabled="activitySaving"
          class="flex-1 py-3 bg-ok text-white rounded-xl font-bold tracking-wide hover:opacity-90 transition-colors disabled:opacity-60"
        >
          {{ activitySaving ? 'Saving...' : 'Save Activity' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineExpose, onMounted, reactive, ref, watch } from 'vue'
import api from '../api'
import { useTaskStore } from '../stores/tasks'
import { useModuleStore } from '../stores/modules'

const props = defineProps({
  hideQuickAdd: { type: Boolean, default: false },
  moduleCode: { type: String, default: null },
})

const taskStore = useTaskStore()
const moduleStore = useModuleStore()

const quickTaskText = ref('')
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingTaskId = ref(null)
const saving = ref(false)
const showCompleted = ref(false)
const formError = ref('')
const actionError = ref('')

const assessmentLoading = ref(false)
const assessmentOptions = ref([])

const isActivityModalOpen = ref(false)
const activitySaving = ref(false)
const activityFormError = ref('')
const activityTaskTitle = ref('')

const taskTypes = [
  { value: 'studying', label: 'Studying' },
  { value: 'programming', label: 'Programming' },
  { value: 'writing', label: 'Writing' },
  { value: 'reading', label: 'Reading' },
  { value: 'revision', label: 'Revision' },
  { value: 'practice', label: 'Practice' },
  { value: 'other', label: 'Other' },
]

const form = reactive({
  title: '',
  module_code: null,
  assessment_id: null,
  milestone_id: null,
  type: 'other',
  target_metric: '',
  target_amount: null,
  description: '',
  due_date: '',
  status: 'pending',
})

const activityForm = reactive({
  task_id: null,
  date: new Date().toISOString().slice(0, 10),
  metric: '',
  amount: null,
  time_spent_minutes: 60,
  description: '',
})

const filteredTasks = computed(() => {
  const baseTasks = showCompleted.value
    ? taskStore.tasks
    : taskStore.tasks.filter((task) => task.status !== 'completed')

  if (props.moduleCode) {
    return baseTasks.filter((task) => task.module_code === props.moduleCode)
  }

  return baseTasks
})

const milestoneOptions = computed(() => {
  if (!form.assessment_id) return []
  return taskStore.milestonesByAssessment(form.assessment_id)
})

watch(
  () => form.module_code,
  async (newModuleCode, oldModuleCode) => {
    if (newModuleCode === oldModuleCode) return

    form.assessment_id = null
    form.milestone_id = null
    assessmentOptions.value = []

    if (!newModuleCode) return

    await loadAssessmentOptions(newModuleCode)
  }
)

watch(
  () => form.assessment_id,
  async (newAssessmentId, oldAssessmentId) => {
    if (newAssessmentId === oldAssessmentId) return

    form.milestone_id = null

    if (!newAssessmentId) return

    try {
      await taskStore.fetchMilestones({ assessment_id: newAssessmentId })
    } catch (err) {
      console.error('Failed to load milestone options:', err)
    }
  }
)

onMounted(async () => {
  if (!taskStore.tasks.length) {
    await taskStore.fetchTasks()
  }

  if (!moduleStore.modules.length) {
    await moduleStore.fetchModules()
  }

  if (!taskStore.milestones.length) {
    await taskStore.fetchMilestones()
  }

  if (!taskStore.dependencies.length) {
    await taskStore.fetchDependencies()
  }

  if (!taskStore.activities.length) {
    await taskStore.fetchActivities()
  }
})

function resetForm() {
  form.title = ''
  form.module_code = props.moduleCode || null
  form.assessment_id = null
  form.milestone_id = null
  form.type = 'other'
  form.target_metric = ''
  form.target_amount = null
  form.description = ''
  form.due_date = ''
  form.status = 'pending'

  assessmentOptions.value = []
  formError.value = ''
  actionError.value = ''
  editingTaskId.value = null
  isEditing.value = false
}

function resetActivityForm() {
  activityForm.task_id = null
  activityForm.date = new Date().toISOString().slice(0, 10)
  activityForm.metric = ''
  activityForm.amount = null
  activityForm.time_spent_minutes = 60
  activityForm.description = ''
  activityFormError.value = ''
  activityTaskTitle.value = ''
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}

function formatMinutes(minutes) {
  const totalMinutes = Number(minutes || 0)

  if (!totalMinutes) {
    return '0m'
  }

  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const remainder = totalMinutes % 60

  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function formatTaskType(value) {
  return String(value || 'other')
    .replace('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function hasTarget(task) {
  return Number(task?.target_amount) > 0
}

function getBlockingDependencies(task) {
  return taskStore.dependenciesForTask(task.id).filter((dependency) => {
    const prerequisiteTask = taskStore.tasks.find(
      (item) => item.id === dependency.depends_on_task_id
    )

    return prerequisiteTask?.status !== 'completed'
  })
}

function isTaskBlocked(task) {
  return task.status !== 'completed' && getBlockingDependencies(task).length > 0
}

function blockingDependencyText(task) {
  return getBlockingDependencies(task)
    .map((dependency) => dependency.depends_on_title)
    .join(', ')
}

async function loadAssessmentOptions(moduleCode) {
  assessmentLoading.value = true

  try {
    const { data } = await api.get(`/modules/${moduleCode}/assessments`)
    assessmentOptions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch assessment options:', err)
    assessmentOptions.value = []
  } finally {
    assessmentLoading.value = false
  }
}

async function openCreateModal(prefillTitle = '') {
  resetForm()
  form.title = String(prefillTitle || '').trim()
  isModalOpen.value = true

  if (form.module_code) {
    await loadAssessmentOptions(form.module_code)
  }
}

async function openEditModal(task) {
  resetForm()

  isEditing.value = true
  editingTaskId.value = task.id

  form.title = task.title || ''
  form.module_code = task.module_code || props.moduleCode || null
  form.assessment_id = task.assessment_id || null
  form.milestone_id = task.milestone_id || null
  form.type = task.type || 'other'
  form.target_metric = task.target_metric || ''
  form.target_amount =
    task.target_amount != null ? Number(task.target_amount) : null
  form.description = task.description || ''
  form.due_date = task.due_date ? String(task.due_date).slice(0, 10) : ''
  form.status = task.status || 'pending'

  isModalOpen.value = true

  if (form.module_code) {
    await loadAssessmentOptions(form.module_code)
  }

  if (form.assessment_id) {
    try {
      await taskStore.fetchMilestones({ assessment_id: form.assessment_id })
    } catch (err) {
      console.error('Failed to fetch milestone options:', err)
    }
  }
}

function closeModal() {
  isModalOpen.value = false
  quickTaskText.value = ''
  resetForm()
}

function buildPayload() {
  return {
    title: form.title.trim(),
    module_code: form.module_code || null,
    assessment_id: form.assessment_id || null,
    milestone_id: form.milestone_id || null,
    type: form.type || 'other',
    target_metric: form.target_metric.trim() || null,
    target_amount:
      form.target_amount === '' || form.target_amount == null
        ? null
        : Number(form.target_amount),
    description: form.description.trim() || null,
    due_date: form.due_date || null,
    status: form.status || 'pending',
  }
}

async function saveTask() {
  formError.value = ''

  if (!form.title.trim()) {
    formError.value = 'Task title is required.'
    return
  }

  saving.value = true

  try {
    const payload = buildPayload()

    if (isEditing.value && editingTaskId.value) {
      await taskStore.updateTask(editingTaskId.value, payload)
    } else {
      await taskStore.addTask(payload)
    }

    quickTaskText.value = ''
    closeModal()
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to save task.'
  } finally {
    saving.value = false
  }
}

async function toggleTaskStatus(task) {
  actionError.value = ''

  if (isTaskBlocked(task)) {
    actionError.value = `Complete prerequisite tasks first: ${blockingDependencyText(task)}`
    return
  }

  const nextStatus =
    task.status === 'completed' ? 'pending' : 'completed'

  try {
    await taskStore.updateTaskStatus(task.id, nextStatus)
  } catch (err) {
    actionError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to update task status.'
  }
}

async function removeTask(id) {
  await taskStore.removeTask(id)
}

function openActivityModal(task) {
  resetActivityForm()
  activityForm.task_id = task.id
  activityForm.metric = task.target_metric || 'hours'
  activityTaskTitle.value = task.title
  isActivityModalOpen.value = true
}

function closeActivityModal() {
  isActivityModalOpen.value = false
  resetActivityForm()
}

async function saveActivity() {
  activityFormError.value = ''

  if (!activityForm.task_id) {
    activityFormError.value = 'Task is required.'
    return
  }

  if (!activityForm.date) {
    activityFormError.value = 'Date is required.'
    return
  }

  if (!String(activityForm.metric || '').trim()) {
    activityFormError.value = 'Metric is required.'
    return
  }

  if (activityForm.amount == null || Number(activityForm.amount) <= 0) {
    activityFormError.value = 'Contribution amount must be greater than 0.'
    return
  }

  if (
    activityForm.time_spent_minutes == null ||
    Number(activityForm.time_spent_minutes) <= 0
  ) {
    activityFormError.value = 'Time spent must be greater than 0.'
    return
  }

  activitySaving.value = true

  try {
    await taskStore.addActivity({
      task_id: activityForm.task_id,
      date: activityForm.date,
      metric: String(activityForm.metric).trim(),
      amount: Number(activityForm.amount),
      time_spent_minutes: Number(activityForm.time_spent_minutes),
      description: String(activityForm.description || '').trim() || null,
    })

    closeActivityModal()
  } catch (err) {
    activityFormError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to save activity.'
  } finally {
    activitySaving.value = false
  }
}

async function removeActivity(id) {
  try {
    await taskStore.removeActivity(id)
  } catch (err) {
    actionError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to delete activity.'
  }
}

defineExpose({
  openCreateModal,
})
</script>