<template>
  <div class="bg-card rounded-2xl shadow-sm border border-edge relative p-5 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-bold text-body flex items-center gap-2">
        <span class="material-symbols-outlined text-ok text-[20px]">analytics</span>
        Task & Activity Stats
      </h3>
    </div>

    <!--
      The stat cards use semantic colour tokens (bg-ok-soft, text-warn, etc.)
      rather than raw colours like bg-green-100. tokens are defined in
      tailwind.config.js and swap automatically between light and dark mode.
    -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-pop rounded-xl p-4 flex flex-col justify-center border border-edge">
        <!-- `{{ }}` renders a reactive value. Whenever taskStore.taskStats changes, Vue updates text -->
        <span class="text-3xl font-extrabold text-body mb-1">{{ taskStore.taskStats.total }}</span>
        <span class="text-xs font-bold text-ghost uppercase tracking-wider">Total Tasks</span>
      </div>
      <div class="bg-primary-soft rounded-xl p-4 flex flex-col justify-center border border-primary-border">
        <span class="text-3xl font-extrabold text-primary-text mb-1">{{ taskStore.taskStats.pending }}</span>
        <span class="text-xs font-bold text-primary uppercase tracking-wider">Pending</span>
      </div>
      <div class="bg-ok-soft rounded-xl p-4 flex flex-col justify-center border border-ok-border">
        <span class="text-3xl font-extrabold text-ok-text mb-1">{{ taskStore.taskStats.completed }}</span>
        <span class="text-xs font-bold text-ok uppercase tracking-wider">Completed</span>
      </div>
      <div class="bg-warn-soft rounded-xl p-4 flex flex-col justify-center border border-warn-border">
        <span class="text-3xl font-extrabold text-warn-text mb-1">{{ overdueCount }}</span>
        <span class="text-xs font-bold text-warn uppercase tracking-wider">Overdue</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
// Pinia stores (defined in src/stores/) are the shared state layer. any
// component that calls useTaskStore() gets the same instance:task data
// is never duplicated across widgets.
import { useTaskStore } from '../../stores/tasks'

const taskStore = useTaskStore()

// Guard: ONLY fetch if the store is empty. If another widget already loaded
// tasks this session the data is already there, so skip network call.
onMounted(async () => {
  if (!taskStore.tasks.length) await taskStore.fetchTasks()
})


const overdueCount = computed(() => {
  const now = new Date()
  return taskStore.tasks.filter(t =>
    t.satus !== 'completed' &&
    t.due_date &&
    new Date(t.due_date) < now
  ).length
})

</script>

<script>
export const widgetMeta = { name: 'Task Stats', w: 4, h: 3 }
</script>
