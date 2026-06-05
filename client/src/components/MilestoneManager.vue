<template>
  <div class="bg-card rounded-2xl shadow-sm border border-edge p-5 flex flex-col min-h-[280px] relative overflow-hidden">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold text-body flex items-center gap-2">
        <span class="material-symbols-outlined text-accent-text text-[20px]">flag</span>
        Milestones
      </h2>

      <button
        @click="openCreateModal()"
        class="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-text transition-colors"
      >
        Add Milestone
      </button>
    </div>

    <div v-if="moduleAssessments.length" class="space-y-3 flex-1 overflow-y-auto pr-1">
      <div
        v-for="assessment in moduleAssessments"
        :key="assessment.id"
        class="bg-pop rounded-xl border border-edge p-4"
      >
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="min-w-0">
            <p class="text-sm font-bold text-body truncate">
              {{ assessment.title }}
            </p>
            <p class="text-[11px] text-ghost font-medium mt-1">
              {{ milestonesByAssessment(assessment.id).length }} milestone<span v-if="milestonesByAssessment(assessment.id).length !== 1">s</span>
            </p>
          </div>
        </div>

        <div v-if="milestonesByAssessment(assessment.id).length" class="space-y-2">
          <div
            v-for="milestone in milestonesByAssessment(assessment.id)"
            :key="milestone.id"
            class="bg-card rounded-lg border border-edge px-3 py-3 flex items-start justify-between gap-3"
          >
           <div class="min-w-0">
            <p class="text-sm font-semibold text-body">{{ milestone.title }}</p>
            <p class="text-[11px] text-ghost mt-1">
              {{ milestone.target_date ? formatDate(milestone.target_date) : 'No target date' }}
            </p>
            <div v-if="tasksForMilestone(milestone.id).length" class="mt-2">
              <div class="h-1.5 rounded-full bg-pop overflow-hidden">
                <div
                  class="h-full rounded-full bg-accent transition-all duration-300"
                  :style="{ width: `${milestoneProgress(milestone.id).percent}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-ghost mt-1 font-medium">
                {{ milestoneProgress(milestone.id).completed }}/{{ milestoneProgress(milestone.id).total }} tasks completed
              </p>
            </div>
            <div v-else class="text-[11px] text-dim mt-1">No tasks linked yet</div>
          </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="openEditModal(milestone)"
                class="text-ghost hover:text-primary transition-colors"
                title="Edit milestone"
              >
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>

              <button
                @click="removeMilestone(milestone.id)"
                class="text-ghost hover:text-danger transition-colors"
                title="Delete milestone"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-dim font-medium">
          No milestones yet for this assessment.
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center text-sm text-dim font-medium">
      No assessments available for this module.
    </div>

    <div
      v-if="isModalOpen"
      class="absolute inset-0 bg-card z-10 flex flex-col p-6 rounded-2xl"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-extrabold text-body">
          {{ isEditing ? 'Edit Milestone' : 'New Milestone' }}
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
            Assessment
          </label>
          <select
            v-model="form.assessment_id"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option :value="null">Select assessment</option>
            <option
              v-for="assessment in moduleAssessments"
              :key="assessment.id"
              :value="assessment.id"
            >
              {{ assessment.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Milestone Title
          </label>
          <input
            v-model="form.title"
            type="text"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="Draft report complete"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">
            Target Date
          </label>
          <input
            v-model="form.target_date"
            type="date"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
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
          @click="saveMilestone"
          :disabled="saving"
          class="flex-1 py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text transition-colors disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Milestone' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useModuleStore } from '../stores/modules'

const props = defineProps({
  moduleCode: {
    type: String,
    required: true,
  },
})

const taskStore = useTaskStore()
const moduleStore = useModuleStore()

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingMilestoneId = ref(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  assessment_id: null,
  title: '',
  target_date: '',
})

function tasksForMilestone(milestoneId){
  return taskStore.tasks.filter(t => t.milestone_id === milestoneId)
}

function milestoneProgress(milestoneId){
  const tasks = tasksForMilestone(milestoneId)
  console.log('milestone tasks: ', tasks)
  console.log('activities: ', taskStore.activities)
  if(!tasks.length) return []
  const completed = tasks.filter(t => t.status === 'completed').length
  console.log('completed: ', completed, 'total: ', tasks.length)
  return { completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) }
}


const activeModule = computed(() => {
  if (moduleStore.activeModuleDetail?.code === props.moduleCode) {
    return moduleStore.activeModuleDetail
  }

  return moduleStore.modules.find((mod) => mod.code === props.moduleCode) || null
})

const moduleAssessments = computed(() => {
  return activeModule.value?.assessments || []
})

function milestonesByAssessment(assessmentId) {
  return taskStore.milestonesByAssessment(assessmentId)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}

function resetForm() {
  form.assessment_id = null
  form.title = ''
  form.target_date = ''
  formError.value = ''
  isEditing.value = false
  editingMilestoneId.value = null
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

function openEditModal(milestone) {
  resetForm()
  isEditing.value = true
  editingMilestoneId.value = milestone.id
  form.assessment_id = milestone.assessment_id
  form.title = milestone.title || ''
  form.target_date = milestone.target_date ? String(milestone.target_date).slice(0, 10) : ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  resetForm()
}

function buildPayload() {
  return {
    assessment_id: form.assessment_id,
    title: form.title.trim(),
    target_date: form.target_date || null,
  }
}

async function saveMilestone() {
  formError.value = ''

  if (!form.assessment_id) {
    formError.value = 'Assessment is required.'
    return
  }

  if (!form.title.trim()) {
    formError.value = 'Milestone title is required.'
    return
  }

  saving.value = true

  try {
    const payload = buildPayload()

    if (isEditing.value && editingMilestoneId.value) {
      await taskStore.updateMilestone(editingMilestoneId.value, payload)
    } else {
      await taskStore.addMilestone(payload)
    }

    closeModal()
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      err.message ||
      'Failed to save milestone.'
  } finally {
    saving.value = false
  }
}

async function removeMilestone(id) {
  await taskStore.removeMilestone(id)
}
</script>
