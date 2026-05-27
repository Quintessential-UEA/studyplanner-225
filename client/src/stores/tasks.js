// create pinia store for tasks list and actions
import { defineStore } from 'pinia'

// Store for managing tasks (to-dos) in the app
export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [
      {
        id: 1,
        title: 'Finish software engineering coursework',
        moduleCode: 'CMP-5012B',
        dueDate: '2026-05-20',
        completed: false,
        priority: 'high',
      },
    ],
  }),
// Getters to compute derived state based on the tasks list
  getters: {
    completedTasks: (state) => state.tasks.filter(task => task.completed),
    incompleteTasks: (state) => state.tasks.filter(task => !task.completed),
    upcomingTasks: (state) =>
      state.tasks
        .filter(task => !task.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
  },

  // Actions to modify the tasks list (add, toggle completion, delete)
  actions: {
    addTask(task) {
      this.tasks.push({
        id: Date.now(),
        completed: false,
        ...task,
      })
    },

    toggleTask(id) {
      const task = this.tasks.find(task => task.id === id)
      if (task) task.completed = !task.completed
    },

    deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id)
    },
  },
})