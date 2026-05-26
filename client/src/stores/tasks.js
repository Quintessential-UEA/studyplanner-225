// ─── src/stores/tasks.js ─────────────────────────────────────────────────────
// Pinia store for tasks and activities.
//
// CRUD operations for tasks, status toggling, and computed stats for
// widgets like TaskStatsWidget, TaskManager, and NavBar badge counts.
// ──────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useTaskStore = defineStore('tasks', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const tasks = ref([])
  const loading = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending'))
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress'))
  const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed'))

  // Counts for TaskStatsWidget
  const taskStats = computed(() => ({
    total: tasks.value.length,
    pending: pendingTasks.value.length,
    inProgress: inProgressTasks.value.length,
    completed: completedTasks.value.length,
  }))

  // Filter tasks by module code
  const tasksByModule = (code) => tasks.value.filter(t => t.module_code === code)

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Fetch all tasks for the current user */
  async function fetchTasks() {
    loading.value = true
    try {
      const { data } = await api.get('/tasks')
      tasks.value = data
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      loading.value = false
    }
  }

  /** Create a new task and add it to the local list */
  async function addTask(taskData) {
    try {
      const { data } = await api.post('/tasks', taskData)
      // Re-fetch to get the full task row (with module_title etc.)
      await fetchTasks()
      return data
    } catch (err) {
      console.error('Failed to create task:', err)
      throw err
    }
  }

  /** Toggle a task's status */
  async function updateTaskStatus(id, status) {
    try {
      await api.patch(`/tasks/${id}/status`, { status })
      // Update locally for instant UI feedback
      const task = tasks.value.find(t => t.id === id)
      if (task) task.status = status
    } catch (err) {
      console.error('Failed to update task status:', err)
    }
  }

  /** Delete a task */
  async function removeTask(id) {
    try {
      await api.delete(`/tasks/${id}`)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  return {
    tasks, loading,
    pendingTasks, inProgressTasks, completedTasks, taskStats, tasksByModule,
    fetchTasks, addTask, updateTaskStatus, removeTask,
  }
})
