<!-- REQUIREMENTS -->
<!-- 
- DEFAULT: Shows the next 5 upcoming events (lectures, tutorials, workshops, etc.) and tasks (assignments, exams, etc.).
- Must be able to filter by module, or type [show next five tasks, show next five events, show next five deadlines, show next 5 exams]
-->



<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <!-- Header / Title area -->
    <h3 class="text-lg font-semibold text-body mb-2 shrink-0">Upcoming Events</h3>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto flex flex-col items-center justify-center border-2 border-dashed border-edge rounded-xl bg-pop p-4 transition-colors hover:bg-canvas hover:border-rim">
      <span class="material-symbols-outlined text-ghost text-[32px] mb-2">extension</span>
      <p class="text-dim text-sm font-medium text-center">
        New widget content goes here
      </p>
    </div>
  </div>
</template>

<script setup>

</script>

<script>

export const widgetMeta = {
  name: 'Template Widget', // Human-readable name shown in the tray
  w: 4,                    // Default width (1 to 12 columns)
  h: 3                     // Default height in grid units
}
</script>
