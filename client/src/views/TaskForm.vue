<script setup>
import { ref } from 'vue'
import { useTaskStore } from '../stores/tasks'

const taskStore = useTaskStore()

const title = ref('')
const dueDate = ref('')

function addTask() {
  taskStore.addTask({
    title: title.value,
    dueDate: dueDate.value,
    moduleCode: '',
    priority: 'medium'
  })

  title.value = ''
  dueDate.value = ''
}
</script>

<template>
  <form @submit.prevent="addTask" class="mb-4">
    <input v-model="title" placeholder="Task title" required />
    <input v-model="dueDate" type="date" required />
    <button type="submit">Add Task</button>
  </form>
</template>