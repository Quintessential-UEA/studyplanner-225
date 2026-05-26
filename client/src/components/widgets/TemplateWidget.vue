<!--
  ─── WIDGET TEMPLATE ──────────────────────────────────────────────────────────
  Use this file as a starting point when creating new widgets for the dashboard!!!
-->

<template>
  <!--
    The root div should typically use `h-full flex flex-col` so it fills the
    GridStack container properly. Use `pointer-events-auto` if your widget
    has interactive elements so they don't get blocked by the dashboard grid layout.
  -->
  <div class="h-full flex flex-col pointer-events-auto">
    <!-- Header / Title area -->
    <h3 class="text-lg font-semibold text-body mb-2 shrink-0">Template Widget</h3>

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
// ─── COMPONENT LOGIC ───────────────────────────────────────────────────────
// Import your stores, refs, computed properties, etc. here.
// import { ref } from 'vue'
</script>

<script>
// ─── WIDGET METADATA ───────────────────────────────────────────────────────
// metadata tells the Dashboard how to render this widget in the tray
// and what default size it should be when dropped onto the grid.
export const widgetMeta = {
  name: 'Template Widget', // Human-readable name shown in the tray
  w: 4,                    // Default width (1 to 12 columns)
  h: 3                     // Default height in grid units
}
</script>
