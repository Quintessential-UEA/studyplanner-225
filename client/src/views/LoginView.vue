<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <div class="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full border border-edge">
      <h2 class="text-3xl font-bold mb-6 text-center text-body">Welcome Back</h2>
      <p class="text-center text-dim mb-8">Login to continue.</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <input
          id="email"
          v-model="email"
          type="email"
          class="w-full mb-2 px-4 py-3 rounded-lg border border-edge bg-card text-body"
          placeholder="name@example.com"
          required
        />

        <p v-if="errorMessage" class="text-sm text-danger">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-primary hover:bg-primary-text disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md flex justify-center items-center gap-2"
        >
          <span>{{ submitting ? 'Signing in...' : 'Login / Continue' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useUserStore } from '../stores/user'
import { useImportStore } from '../stores/import'

const nav = useNavigationStore()
const userStore = useUserStore()
const importStore = useImportStore()

const email = ref('')
const submitting = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!email.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await userStore.login(email.value.trim().toLowerCase())

    const status = await importStore.fetchStatus()

    if (status.hasImportedData) {
      nav.navigate('Dashboard', 'forward')
    } else {
      nav.navigate('ImportHub', 'forward')
    }
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error ||
      err.message ||
      'Login failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>