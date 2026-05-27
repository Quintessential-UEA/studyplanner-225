<script setup>
import { useTaskStore } from '../stores/tasks'
import TaskForm from '../components/TaskForm.vue'

const taskStore = useTaskStore()
</script>

<template>
  <div class="p-4">
    <TaskForm />

    <ul>
      <li v-for="task in taskStore.tasks" :key="task.id">
        {{ task.title }} — {{ task.dueDate }}
      </li>
    </ul>
  </div>
</template>