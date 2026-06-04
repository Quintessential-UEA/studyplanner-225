<template>
  <div class="min-h-[70vh] flex items-center justify-center px-6 py-10">
    <div class="w-full max-w-2xl bg-card border border-edge rounded-2xl shadow-xl p-8">
      <h1 class="text-3xl font-bold text-body mb-3">Import your Hub data</h1>
      <p class="text-dim mb-6">
        Upload your Hub JSON file to populate your planner with modules, assessments,
        deadlines, and timetable information.
      </p>

      <div class="bg-pop border border-edge rounded-xl p-4 mb-6">
        <p class="text-sm text-body font-medium mb-2">Expected file</p>
        <p class="text-sm text-dim">
          A JSON export for the currently logged-in student account.
        </p>
      </div>

      <div class="mb-5">
        <label class="block text-sm font-medium text-body mb-2" for="hubFile">
          Hub JSON file
        </label>
        <input
          id="hubFile"
          type="file"
          accept=".json,application/json"
          @change="handleFileChange"
          class="block w-full text-sm text-body file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:opacity-90"
        />
        <p v-if="selectedFileName" class="mt-2 text-sm text-dim">
          Selected: {{ selectedFileName }}
        </p>
      </div>

      <p v-if="importStore.error" class="text-sm text-danger mb-4">
        {{ importStore.error }}
      </p>

      <div v-if="importStore.lastSummary" class="bg-pop border border-edge rounded-xl p-4 mb-5">
        <p class="text-sm font-medium text-body mb-2">Latest import summary</p>
        <div class="grid grid-cols-2 gap-3 text-sm text-dim">
          <div>Academic year: {{ importStore.lastSummary.academic_year }}</div>
          <div>Semester: {{ importStore.lastSummary.semester }}</div>
          <div>Modules: {{ importStore.lastSummary.modulesImported }}</div>
          <div>Assessments: {{ importStore.lastSummary.assessmentsImported }}</div>
          <div>Events: {{ importStore.lastSummary.eventsImported }}</div>
          <div>Resources: {{ importStore.lastSummary.resourcesImported }}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          @click="submitUpload"
          :disabled="!selectedFile || importStore.uploading"
          class="bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-lg transition"
        >
          {{ importStore.uploading ? 'Importing...' : 'Upload and import' }}
        </button>

        <button
          v-if="importStore.status.hasImportedData"
          @click="goToDashboard"
          class="bg-pop hover:bg-edge text-body font-medium py-3 px-5 rounded-lg transition"
        >
          Continue to dashboard
        </button>

        <button
          @click="logoutToLogin"
          class="bg-pop hover:bg-edge text-body font-medium py-3 px-5 rounded-lg transition"
        >
          Use a different account
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useImportStore } from '../stores/import'
import { useUserStore } from '../stores/user'
import { useModuleStore } from '../stores/modules'
import { useTaskStore } from '../stores/tasks'
import { useEventStore } from '../stores/events'

const nav = useNavigationStore()
const importStore = useImportStore()
const userStore = useUserStore()
const moduleStore = useModuleStore()
const taskStore = useTaskStore()
const eventStore = useEventStore()

const selectedFile = ref(null)

const selectedFileName = computed(() => selectedFile.value?.name || '')

onMounted(async () => {
  try {
    const status = await importStore.fetchStatus()

    if (status.hasImportedData) {
      nav.navigate('Dashboard', 'forward')
    }
  } catch (err) {
    console.error('Failed to check import status:', err)
  }
})

function handleFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
}

async function submitUpload() {
  if (!selectedFile.value) return

  try {
    await importStore.uploadHubFile(selectedFile.value)

    await Promise.allSettled([
      userStore.fetchProfile(),
      moduleStore.fetchModules(),
      taskStore.fetchTasks(),
      eventStore.fetchEvents(),
    ])

    nav.navigate('Dashboard', 'forward')
  } catch (err) {
    console.error('Hub upload failed:', err)
  }
}

function goToDashboard() {
  nav.navigate('Dashboard', 'forward')
}

function logoutToLogin() {
  userStore.logout()
  importStore.clear()
  eventStore.clear()

  moduleStore.modules = []
  moduleStore.activeModuleCode = null
  moduleStore.activeModuleDetail = null

  taskStore.tasks = []

  localStorage.removeItem('appState')
  nav.resetForLogout()
}
</script>