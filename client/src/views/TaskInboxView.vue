<template>
  <div class="p-6 h-full flex flex-col max-w-6xl mx-auto">
    <div class="flex items-center gap-4 mb-6 shrink-0">
      <button 
        @click="nav.navigate('Dashboard', 'backward')" 
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <h1 class="text-3xl font-extrabold text-body tracking-tight">Task Inbox</h1>
    </div>

    <div class="flex flex-col lg:flex-row flex-1 gap-6 min-h-[500px]">
      <!-- Left: Task Inbox -->
      <div class="flex-1 w-full lg:w-2/3 h-full">
        <TaskManager :hideQuickAdd="true" class="h-full" />
      </div>

      <!-- Right: Stats & Form -->
      <div class="w-full lg:w-1/3 flex flex-col gap-6 shrink-0 h-full">
        <TaskStatsWidget />
        <TaskFormWidget class="flex-1" />
      </div>
    </div>
  </div>
</template>


<!-- IMPORTS -->

<script setup>
import { useNavigationStore } from '../stores/navigation'
import TaskManager from '../components/TaskManager.vue'
import TaskStatsWidget from '../components/widgets/TaskStatsWidget.vue'
import TaskFormWidget from '../components/widgets/TaskFormWidget.vue'

const nav = useNavigationStore()
</script>
