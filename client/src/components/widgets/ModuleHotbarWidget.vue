<template>
  <div class="h-full flex flex-col pointer-events-auto w-full">
    <div class="h-full flex flex-wrap gap-6 justify-between items-center relative overflow-hidden">

      <!-- Organiser -->
      <div class="flex items-center gap-4 flex-1 min-w-[200px] z-10">
        <div class="w-12 h-12 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {{ organiser.initials }}
        </div>
        <div>
          <p class="text-[11px] font-bold text-ghost uppercase tracking-wider">Module Organiser</p>
          <p class="font-bold text-body">{{ organiser.name }}</p>
        </div>
      </div>

      <!-- Vertical divider. hidden on small screens to avoid crowding -->
      <div class="w-px h-12 bg-edge hidden lg:block z-10"></div>

      <!-- Task Progress Ring -->
      <div class="flex items-center gap-4 flex-1 min-w-[200px] z-10">
        <div class="relative w-12 h-12 flex items-center justify-center">
          <!--
            SVG progress ring: the path traces a full circle.
          -->
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path class="text-edge" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="text-ok" :stroke-dasharray="`${tasks.total ? (tasks.completed / tasks.total) * 100 : 0}, 100`" stroke-width="3" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span class="absolute text-[10px] font-extrabold text-body">{{ tasks.completed }}/{{ tasks.total }}</span>
        </div>
        <div>
          <p class="text-[11px] font-bold text-ghost uppercase tracking-wider">Task Progress</p>
          <p class="font-bold text-body">{{ tasks.outstanding }} Outstanding</p>
        </div>
      </div>

      <div class="w-px h-12 bg-edge hidden lg:block z-10"></div>

      <!-- Upcoming Event -->
      <div class="flex items-center gap-4 flex-1 min-w-[200px] z-10">
        <!--
          `:class` here conditionally switches the icon background between
          amber (when there's an upcoming event) and grey (when
          there isn't)
        -->
        <div class="p-3 rounded-xl" :class="upcomingEvent.title !== 'None scheduled' ? 'bg-warn-soft text-warn' : 'bg-pop text-ghost'">
          <span class="material-symbols-outlined text-[24px]">{{ upcomingEvent.icon }}</span>
        </div>
        <div>
          <p class="text-[11px] font-bold text-ghost uppercase tracking-wider">
            Next Event <span v-if="upcomingEvent.date">• {{ upcomingEvent.date }}</span>
          </p>
          <p class="font-bold text-body truncate" :title="upcomingEvent.title">{{ upcomingEvent.title }}</p>
        </div>
      </div>

      <div class="w-px h-12 bg-edge hidden lg:block z-10"></div>

      <!-- This Week's Focus -->
      <div class="flex items-center gap-4 flex-1 min-w-[200px] z-10">
        <div class="p-3 bg-pop text-ghost rounded-xl">
          <span class="material-symbols-outlined text-[24px]">flag</span>
        </div>
        <div>
          <p class="text-[11px] font-bold text-ghost uppercase tracking-wider">Week {{ academicWeek }} Focus</p>
          <p class="font-bold text-body truncate" :title="weeklyFocus">{{ weeklyFocus }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// This widget is purely display( no stores or API calls of its own.)
// The parent ( ModuleView) fetches the data and passes it in via `data`.
// (remove from widgets to make it component?)
const props = defineProps({
  data: { type: Object, default: () => ({}) }
})

// Fallback defaults ensure every field has a safe value even if the parent
// hasn't loaded yet or passes partial data.
const organiser    = computed(() => props.data.organiser    || { name: 'TBD', initials: '?' })
const tasks        = computed(() => props.data.tasks        || { total: 0, completed: 0, outstanding: 0 })
const upcomingEvent= computed(() => props.data.upcomingEvent|| { title: 'None scheduled', type: '', date: '', icon: 'event_busy' })
const academicWeek = computed(() => props.data.academicWeek || 1)
const weeklyFocus  = computed(() => props.data.weeklyFocus  || 'No topic set')
</script>

<script>
export const widgetMeta = { name: 'Module Status Hotbar', w: 12, h: 2 }
</script>
