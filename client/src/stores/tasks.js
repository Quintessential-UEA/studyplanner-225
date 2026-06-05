// client/src/stores/tasks.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

function getErrorMessage(err, fallback) {
  return (
    err.response?.data?.error ||
    err.message ||
    fallback
  )
}

function ratio(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0
  }

  return Math.max(0, Math.min(1, numerator / denominator))
}

function minutesToHours(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0
  }

  return Math.round((minutes / 60) * 10) / 10
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const milestones = ref([])
  const dependencies = ref([])
  const activities = ref([])

  const loading = ref(false)
  const milestoneLoading = ref(false)
  const dependencyLoading = ref(false)
  const activityLoading = ref(false)

  const error = ref('')
  const milestoneError = ref('')
  const dependencyError = ref('')
  const activityError = ref('')

  const pendingTasks = computed(() =>
    tasks.value.filter((task) => task.status === 'pending')
  )

  const inProgressTasks = computed(() =>
    tasks.value.filter((task) => task.status === 'in_progress')
  )

  const completedTasks = computed(() =>
    tasks.value.filter((task) => task.status === 'completed')
  )

  const overdueTasks = computed(() => {
    const now = new Date()

    return tasks.value.filter((task) => {
      if (task.status === 'completed' || !task.due_date) return false
      return new Date(task.due_date) < now
    })
  })

  const taskStats = computed(() => ({
    total: tasks.value.length,
    pending: pendingTasks.value.length,
    inProgress: inProgressTasks.value.length,
    completed: completedTasks.value.length,
    overdue: overdueTasks.value.length,
  }))

  const scheduledTasks = computed(() =>
    tasks.value.filter((task) => Boolean(task.scheduled_date))
  )

  const totalActivityTimeSpentMinutes = computed(() =>
   activities.value.reduce((sum, activity) => {
     return sum + Number(activity.time_spent_minutes || 0)
   }, 0)
  )

  const totalActivityTimeSpentHours = computed(() =>
   minutesToHours(totalActivityTimeSpentMinutes.value)
  )

  const tasksByModule = computed(() => {
    return (moduleCode) =>
      tasks.value.filter((task) => task.module_code === moduleCode)
  })

  const tasksByAssessment = computed(() => {
    return (assessmentId) =>
      tasks.value.filter((task) => task.assessment_id === assessmentId)
  })

  const tasksByMilestone = computed(() => {
    return (milestoneId) =>
      tasks.value.filter((task) => task.milestone_id === milestoneId)
  })

  const milestonesByAssessment = computed(() => {
    return (assessmentId) =>
      milestones.value.filter((milestone) => milestone.assessment_id === assessmentId)
  })

  const dependenciesForTask = computed(() => {
    return (taskId) =>
      dependencies.value.filter((dependency) => dependency.task_id === taskId)
  })

  const dependentsForTask = computed(() => {
    return (taskId) =>
      dependencies.value.filter((dependency) => dependency.depends_on_task_id === taskId)
  })

  const activitiesForTask = computed(() => {
    return (taskId) =>
      activities.value.filter((activity) => activity.task_id === taskId)
  })

  const activitySummaryForTask = computed(() => {
    return (taskId) => {
      const taskActivities = activities.value.filter(
        (activity) => activity.task_id === taskId
      )

      const totalAmount = taskActivities.reduce((sum, activity) => {
        return sum + Number(activity.amount || 0)
      }, 0)

      const totalTimeSpentMinutes = taskActivities.reduce((sum, activity) => {
        return sum + Number(activity.time_spent_minutes || 0)
      }, 0)

      return {
        count: taskActivities.length,
        totalAmount,
        totalTimeSpentMinutes,
        totalTimeSpentHours: minutesToHours(totalTimeSpentMinutes),
      }
    }
  })

  const taskProgress = computed(() => {
   return (task) => {
     const loggedAmount = Number(task?.logged_amount ?? 0)
     const targetAmount = Number(task?.target_amount ?? 0)
     const loggedTimeSpentMinutes = Number(task?.logged_time_spent_minutes ?? 0)

     return {
       loggedAmount,
       targetAmount,
       loggedTimeSpentMinutes,
       loggedTimeSpentHours: minutesToHours(loggedTimeSpentMinutes),
       progressRatio: ratio(loggedAmount, targetAmount),
       progressPercent: Math.round(ratio(loggedAmount, targetAmount) * 100),
     }
   }
 })

  async function fetchTasks(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await api.get('/tasks', { params })
      tasks.value = Array.isArray(data) ? data : []
      return tasks.value
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to fetch tasks')
      console.error('Failed to fetch tasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMilestones(params = {}) {
    milestoneLoading.value = true
    milestoneError.value = ''

    try {
      const { data } = await api.get('/tasks/milestones', { params })
      milestones.value = Array.isArray(data) ? data : []
      return milestones.value
    } catch (err) {
      milestoneError.value = getErrorMessage(err, 'Failed to fetch milestones')
      console.error('Failed to fetch milestones:', err)
      throw err
    } finally {
      milestoneLoading.value = false
    }
  }

  async function fetchDependencies(params = {}) {
    dependencyLoading.value = true
    dependencyError.value = ''

    try {
      const { data } = await api.get('/tasks/dependencies', { params })
      dependencies.value = Array.isArray(data) ? data : []
      return dependencies.value
    } catch (err) {
      dependencyError.value = getErrorMessage(err, 'Failed to fetch dependencies')
      console.error('Failed to fetch dependencies:', err)
      throw err
    } finally {
      dependencyLoading.value = false
    }
  }

  async function fetchActivities(params = {}) {
    activityLoading.value = true
    activityError.value = ''

    try {
      const { data } = await api.get('/activities', { params })
      activities.value = Array.isArray(data) ? data : []
      return activities.value
    } catch (err) {
      activityError.value = getErrorMessage(err, 'Failed to fetch activities')
      console.error('Failed to fetch activities:', err)
      throw err
    } finally {
      activityLoading.value = false
    }
  }

  async function fetchPlannerData() {
    await Promise.allSettled([
      fetchTasks(),
      fetchMilestones(),
      fetchDependencies(),
      fetchActivities(),
    ])
  }

  async function addTask(taskData) {
    try {
      const { data } = await api.post('/tasks', taskData)
      await fetchTasks()
      return data
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to create task')
      console.error('Failed to create task:', err)
      throw err
    }
  }

  async function updateTask(id, taskData) {
    try {
      const { data } = await api.put(`/tasks/${id}`, taskData)
      await fetchTasks()
      return data
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to update task')
      console.error('Failed to update task:', err)
      throw err
    }
  }

  async function updateTaskStatus(id, status) {
  try {
    const { data } = await api.patch(`/tasks/${id}/status`, { status })

    const index = tasks.value.findIndex((task) => task.id === id)
    if (index !== -1) {
      tasks.value[index] = data
    }

    await fetchDependencies()

    return data
  } catch (err) {
    error.value = getErrorMessage(err, 'Failed to update task status')
    console.error('Failed to update task status:', err)
    throw err
  }
}

  async function removeTask(id) {
    try {
      await api.delete(`/tasks/${id}`)

      tasks.value = tasks.value.filter((task) => task.id !== id)
      dependencies.value = dependencies.value.filter(
        (dependency) =>
          dependency.task_id !== id && dependency.depends_on_task_id !== id
      )
      activities.value = activities.value.filter((activity) => activity.task_id !== id)
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to delete task')
      console.error('Failed to delete task:', err)
      throw err
    }
  }

  async function scheduleTask(id, scheduleData) {
    try {
      const { data } = await api.patch(`/tasks/${id}/schedule`, scheduleData)

      const index = tasks.value.findIndex((task) => task.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }

      return data
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to schedule task')
      console.error('Failed to schedule task:', err)
      throw err
    }
  }

  async function unscheduleTask(id) {
    try {
      await api.delete(`/tasks/${id}/schedule`)

      const task = tasks.value.find((item) => item.id === id)
      if (task) {
        task.scheduled_date = null
        task.scheduled_start_time = null
        task.scheduled_duration = 60
      }
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to unschedule task')
      console.error('Failed to unschedule task:', err)
      throw err
    }
  }

  async function addMilestone(payload) {
    try {
      const { data } = await api.post('/tasks/milestones', payload)
      await fetchMilestones()
      return data
    } catch (err) {
      milestoneError.value = getErrorMessage(err, 'Failed to create milestone')
      console.error('Failed to create milestone:', err)
      throw err
    }
  }

  async function updateMilestone(id, payload) {
    try {
      const { data } = await api.put(`/tasks/milestones/${id}`, payload)
      await fetchMilestones()
      return data
    } catch (err) {
      milestoneError.value = getErrorMessage(err, 'Failed to update milestone')
      console.error('Failed to update milestone:', err)
      throw err
    }
  }

  async function removeMilestone(id) {
    try {
      await api.delete(`/tasks/milestones/${id}`)
      milestones.value = milestones.value.filter((milestone) => milestone.id !== id)
      await fetchTasks()
    } catch (err) {
      milestoneError.value = getErrorMessage(err, 'Failed to delete milestone')
      console.error('Failed to delete milestone:', err)
      throw err
    }
  }

  async function addDependency(payload) {
    try {
      const { data } = await api.post('/tasks/dependencies', payload)
      await fetchDependencies()
      return data
    } catch (err) {
      dependencyError.value = getErrorMessage(err, 'Failed to create dependency')
      console.error('Failed to create dependency:', err)
      throw err
    }
  }

  async function removeDependency(id) {
    try {
      await api.delete(`/tasks/dependencies/${id}`)
      dependencies.value = dependencies.value.filter(
        (dependency) => dependency.id !== id
      )
    } catch (err) {
      dependencyError.value = getErrorMessage(err, 'Failed to delete dependency')
      console.error('Failed to delete dependency:', err)
      throw err
    }
  }

  async function addActivity(payload) {
   try {
     const requestBody = {
       task_id: payload.task_id,
       date: payload.date,
       metric: payload.metric,
       amount: payload.amount,
       time_spent_minutes: payload.time_spent_minutes,
       description: payload.description ?? null,
     }

     const { data } = await api.post('/activities', requestBody)
     await Promise.allSettled([fetchActivities(), fetchTasks()])
     return data
   } catch (err) {
     activityError.value = getErrorMessage(err, 'Failed to create activity')
     console.error('Failed to create activity:', err)
     throw err
   }
 }

  async function removeActivity(id) {
    try {
      await api.delete(`/activities/${id}`)
      await Promise.allSettled([fetchActivities(), fetchTasks()])
    } catch (err) {
      activityError.value = getErrorMessage(err, 'Failed to delete activity')
      console.error('Failed to delete activity:', err)
      throw err
    }
  }

  function clear() {
    tasks.value = []
    milestones.value = []
    dependencies.value = []
    activities.value = []

    loading.value = false
    milestoneLoading.value = false
    dependencyLoading.value = false
    activityLoading.value = false

    error.value = ''
    milestoneError.value = ''
    dependencyError.value = ''
    activityError.value = ''
  }

  return {
    tasks,
    milestones,
    dependencies,
    activities,
    loading,
    milestoneLoading,
    dependencyLoading,
    activityLoading,
    error,
    milestoneError,
    dependencyError,
    activityError,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    taskStats,
    scheduledTasks,
    totalActivityTimeSpentMinutes,
    totalActivityTimeSpentHours,
    activitySummaryForTask,
    tasksByModule,
    tasksByAssessment,
    tasksByMilestone,
    milestonesByAssessment,
    dependenciesForTask,
    dependentsForTask,
    activitiesForTask,
    taskProgress,
    fetchTasks,
    fetchMilestones,
    fetchDependencies,
    fetchActivities,
    fetchPlannerData,
    addTask,
    updateTask,
    updateTaskStatus,
    removeTask,
    scheduleTask,
    unscheduleTask,
    addMilestone,
    updateMilestone,
    removeMilestone,
    addDependency,
    removeDependency,
    addActivity,
    removeActivity,
    clear,
  }
})