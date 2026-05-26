<!--
  Static visual placeholder for now . the bars are hardcoded with left/right percentage
  offsets to simulate a timeline. When real data is wired up+ functionality built out these positions
  should be computed from start/end dates relative to the semester span.
-->
<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <h3 class="text-lg font-semibold text-body mb-2 shrink-0">Gantt Timeline (PLACEHOLDER)</h3>
    <div class="flex-1 flex flex-col gap-3 justify-center">
      <div class="space-y-1">
        <div class="flex justify-between text-[10px] font-bold text-ghost uppercase">
          <span class="ml-[10%]">Proposal</span><span class="mr-[40%]">Due</span>
        </div>
        <div class="h-4 w-full bg-pop rounded-full overflow-hidden relative shadow-inner">
          <div class="absolute top-0 bottom-0 left-[10%] right-[40%] bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
        </div>
      </div>
      <div class="space-y-1">
        <div class="flex justify-between text-[10px] font-bold text-ghost uppercase">
          <span class="ml-[30%]">Prototyping</span><span class="mr-[10%]">Due</span>
        </div>
        <div class="h-4 w-full bg-pop rounded-full overflow-hidden relative shadow-inner">
          <div class="absolute top-0 bottom-0 left-[30%] right-[10%] bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export const widgetMeta = { name: 'Gantt Timeline', w: 8, h: 3 }
</script>
