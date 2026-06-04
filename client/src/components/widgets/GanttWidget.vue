<!--
  Static visual placeholder for now . the bars are hardcoded with left/right percentage
  offsets to simulate a timeline. When real data is wired up+ functionality built out these positions
  should be computed from start/end dates relative to the semester span.
-->
<template>
  <div class="h-full flex flex-col pointer-events-auto">
    <h3 class="text-lg font-semibold text-body mb-2 shrink-0">
      Assessment Timeline
    </h3>

    <div class="flex-1 flex flex-col gap-3 justify-center overflow-y-auto">
      <div
        v-if="timelineItems.length === 0"
        class="text-sm text-dim text-center"
      >
        No assessment timeline data
      </div>

      <div
        v-for="item in timelineItems"
        :key="item.id"
        class="space-y-1"
      >
        <div class="flex justify-between text-[10px] font-bold text-ghost uppercase">
          <span>{{ item.title }}</span>
          <span>Due {{ formatDate(item.end) }}</span>
        </div>

        <div class="h-4 w-full bg-pop rounded-full overflow-hidden relative shadow-inner">
          <div
            class="absolute top-0 bottom-0 bg-primary rounded-full shadow-sm"
            :style="{
              left: item.left + '%',
              width: item.width + '%'
            }"
          ></div>
        </div>

        <p class="text-[10px] text-dim">
          {{ item.module }} • {{ item.type }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const semesterStart = new Date('2026-01-26')
const semesterEnd = new Date('2026-05-29')

const timelineItems = ref([])

function authHeaders() {
  const token = localStorage.getItem('token')

  return {
    Authorization: `Bearer ${token}`
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/assessments', {
      headers: authHeaders()
    })

    if (!res.ok) {
      throw new Error('Authentication error or failed API request')
    }

    const assessments = await res.json()

    timelineItems.value = assessments
      .filter(assessment => assessment.deadline)
      .map(assessment => {
        const end = new Date(assessment.deadline)

        const start = new Date(end)
        start.setDate(start.getDate() - 21)

        const totalSemesterLength = semesterEnd - semesterStart
        const left = ((start - semesterStart) / totalSemesterLength) * 100
        const width = ((end - start) / totalSemesterLength) * 100

        return {
          id: `assessment-${assessment.id}`,
          title: assessment.title,
          module: assessment.module_code || 'No module',
          type: assessment.type || 'assessment',
          start,
          end,
          left: Math.max(0, Math.min(left, 100)),
          width: Math.max(2, Math.min(width, 100))
        }
      })
      .sort((a, b) => a.end - b.end)
      .slice(0, 5)
  } catch (err) {
    console.error('Failed to load Gantt timeline:', err)
  }
})

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}
</script>

<script>
export const widgetMeta = {
  name: 'Gantt Timeline',
  w: 8,
  h: 3
}
</script>