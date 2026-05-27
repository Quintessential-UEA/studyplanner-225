// create pinia store for modules list and actions
import { defineStore } from 'pinia'

// Store for managing modules (courses) in the app
export const useModuleStore = defineStore('modules', {
  state: () => ({
    modules: [
      {
        id: 1,
        code: 'CMP-5012B',
        name: 'Software Engineering',
        credits: 20,
        colour: '#f72a94',
      },
    ],
  }),
// Actions to modify the modules list (add, delete)
  actions: {
    addModule(module) {
      this.modules.push({
        id: Date.now(),
        ...module,
      })
    },

    deleteModule(id) {
      this.modules = this.modules.filter(module => module.id !== id)
    },
  },
})