// client/src/stores/import.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

function defaultStatus() {
  return {
    hasImportedData: false,
    moduleCount: 0,
    hasProfile: false,
  }
}

function getErrorMessage(err) {
  const details = err.response?.data?.details

  if (Array.isArray(details) && details.length > 0) {
    return details.join(' ')
  }

  return (
    err.response?.data?.error ||
    err.message ||
    'Import request failed.'
  )
}

export const useImportStore = defineStore('import', () => {
  const status = ref(defaultStatus())
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref('')
  const lastSummary = ref(null)

  async function fetchStatus() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await api.get('/import/status')

      status.value = {
        hasImportedData: Boolean(data?.hasImportedData),
        moduleCount: Number(data?.moduleCount ?? 0),
        hasProfile: Boolean(data?.hasProfile),
      }

      return status.value
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadHubFile(file) {
    if (!(file instanceof File)) {
      throw new Error('Please choose a Hub JSON file.')
    }

    uploading.value = true
    error.value = ''
    lastSummary.value = null

    try {
      const formData = new FormData()
      formData.append('hubFile', file)

      const { data } = await api.post('/import/hub', formData)
      lastSummary.value = data?.summary ?? null

      await fetchStatus()

      return data
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      uploading.value = false
    }
  }

  function clear() {
    status.value = defaultStatus()
    loading.value = false
    uploading.value = false
    error.value = ''
    lastSummary.value = null
  }

  return {
    status,
    loading,
    uploading,
    error,
    lastSummary,
    fetchStatus,
    uploadHubFile,
    clear,
  }
})