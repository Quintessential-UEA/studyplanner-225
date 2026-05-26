<template>
  <div class="h-full flex flex-col pointer-events-auto relative overflow-hidden">

    <h3 class="text-sm font-extrabold text-body mb-4 flex items-center justify-between gap-2 relative z-10 shrink-0">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[20px]">military_tech</span>
        {{ title }}
      </div>

      <!--
        Custom radio button group: the real `<input type="radio">` is hidden
        with `sr-only` (visible only to screen readers) and replaced by a
        styled `<div>`.
        Clicking `<label>` triggers its associated input
        via the `for` / `id` relationship built into HTML, so keyboard and
        assistive tech still work correctly
      -->
      <div v-if="showSwitcher" class="flex bg-pop p-0.5 rounded-lg border border-edge">
        <label class="cursor-pointer">
          <input type="radio" v-model="internalMode" value="semester" class="sr-only" />
          <div class="px-2 py-1 rounded-md text-[10px] font-bold transition-colors" :class="internalMode === 'semester' ? 'bg-card text-purple-600 dark:text-purple-400 shadow-sm' : 'text-dim hover:text-body'">
            Semester
          </div>
        </label>
        <label v-for="(mod, idx) in semesterModules" :key="idx" class="cursor-pointer">
          <input type="radio" v-model="internalMode" :value="mod.code" class="sr-only" />
          <div class="px-2 py-1 rounded-md text-[10px] font-bold transition-colors" :class="internalMode === mod.code ? 'bg-card text-purple-600 dark:text-purple-400 shadow-sm' : 'text-dim hover:text-body'">
            {{ mod.code }}
          </div>
        </label>
      </div>
    </h3>

    <div class="space-y-2 mb-4 relative z-10 flex-1 overflow-y-auto pr-1">
      <!-- Module View: Assessment List -->
      <template v-if="!isSemesterView">
        <div
          v-for="(exam, idx) in activeExams" :key="idx"
          class="bg-pop border-y border-r border-edge rounded-r-lg rounded-l-sm px-3 py-2 flex items-center justify-between"
          :class="[{'cursor-pointer hover:bg-edge transition-colors': interactive}]"
          :style="{ borderLeftColor: getModuleThemeColor(exam.moduleCode), borderLeftWidth: '4px' }"
        >
          <div class="flex items-center gap-2 overflow-hidden flex-1 pr-2">
            <span class="font-bold text-body text-xs truncate" :title="exam.title">{{ exam.title }}</span>
            <span class="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded-md uppercase shrink-0">{{ exam.weight }}%</span>
          </div>
          <div class="text-xs shrink-0 flex flex-col items-end">
            <span class="text-[9px] text-ghost font-bold uppercase leading-tight">Score</span>
            <span class="font-bold leading-tight" :class="exam.score ? 'text-body' : 'text-ghost'">{{ exam.score || 'TBD' }}</span>
          </div>
        </div>
        <div v-if="activeExams.length === 0" class="text-center py-4 text-xs font-medium text-ghost">
          No assessments scheduled.
        </div>
      </template>

      <!-- Semester View: Module List with expandable accordion rows -->
      <template v-else>
        <div v-for="(mod, idx) in moduleStats" :key="idx" class="mb-2">
          <div
            class="bg-pop border border-edge rounded-r-lg rounded-l-sm px-3 py-2 flex items-center justify-between relative"
            :class="[{'cursor-pointer hover:bg-edge transition-colors': interactive}]"
            :style="{ borderLeftColor: getModuleThemeColor(mod.code), borderLeftWidth: '4px' }"
            @click="interactive && toggleAccordion(mod.code)"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="font-bold text-body text-xs truncate">{{ mod.code }}</span>
              <span class="material-symbols-outlined text-[14px] text-ghost transition-transform duration-200" :class="{'rotate-180': expandedAccordion === mod.code}">expand_more</span>
            </div>
            <div class="flex items-center gap-4 shrink-0 text-right">
              <div class="flex flex-col items-end">
                <span class="text-[9px] text-ghost font-bold uppercase leading-tight">To Date</span>
                <span class="font-bold text-body text-xs leading-tight">{{ mod.stats.achievedMark }}<span class="text-[9px] text-ghost">/{{ mod.stats.assessedWeight }}</span></span>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[9px] text-ghost font-bold uppercase leading-tight">Max</span>
                <span class="font-bold text-ghost text-xs leading-tight">{{ mod.stats.attainableFinalMark }}%</span>
              </div>
            </div>
          </div>

          <!-- Accordion detail panel (only rendered for the currently-open row) -->
          <div v-if="expandedAccordion === mod.code" class="pl-2 mt-1 space-y-1">
            <div
              v-for="(exam, eIdx) in mod.exams" :key="eIdx"
              class="bg-card border border-edge rounded px-3 py-1.5 flex items-center justify-between"
            >
              <div class="flex items-center gap-2 overflow-hidden flex-1 pr-2">
                <span class="font-bold text-body text-[11px] truncate" :title="exam.title">{{ exam.title }}</span>
                <span class="text-[8px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1 py-0.5 rounded-md uppercase shrink-0">{{ exam.weight }}%</span>
              </div>
              <div class="text-[11px] shrink-0 flex flex-col items-end">
                <span class="font-bold leading-tight" :class="exam.score ? 'text-body' : 'text-ghost'">{{ exam.score || 'TBD' }}</span>
              </div>
            </div>
            <div v-if="!mod.exams || mod.exams.length === 0" class="text-center py-2 text-[10px] font-medium text-ghost">
              No assessments scheduled.
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Final Mark footer -->
    <div class="mt-auto pt-4 border-t border-edge relative z-10 shrink-0">
      <div class="flex justify-between items-center">
        <div class="flex items-end gap-4">
          <div>
            <p class="text-[11px] font-bold text-ghost uppercase tracking-wider">{{ isSemesterView ? 'Avg Mark So Far' : 'Mark So Far' }}</p>
            <p class="text-2xl font-extrabold text-body leading-none mt-1 flex items-baseline gap-1">
              {{ isSemesterView ? semesterStats.achievedMark : activeModuleStats.achievedMark }}
              <span class="text-sm font-bold text-ghost">/ {{ isSemesterView ? semesterStats.assessedWeight : activeModuleStats.assessedWeight }}%</span>
            </p>
          </div>
          <div class="pb-[2px]">
            <p class="text-[10px] font-bold text-ghost uppercase tracking-wider">Max Possible</p>
            <p class="text-lg font-bold text-ghost leading-none mt-1 opacity-80">
              {{ isSemesterView ? semesterStats.attainableFinalMark : activeModuleStats.attainableFinalMark }}<span class="text-sm text-rim">%</span>
            </p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
          <span class="material-symbols-outlined">trending_up</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useModuleStore } from '../../stores/modules'
import api from '../../api'

/*
  This widget works in two contexts:
  - Dashboard: no `data` prop is passed, so fetches its own assessments
    and reads modules from the store.
  - Module page: parent passes `data` directly, so the widget is purely
    presentational (no fetching needed).

  `isDashboard` detects which context we're in by checking whether `data`
  is empty and lets the component serve both use cases without
  needing two separate widget files
*/
const props = defineProps({
  title:         { type: String,  default: 'Gradebook' },
  mode:          { type: String,  default: 'semester'  },
  interactive:   { type: Boolean, default: true        },
  enableSwitcher:{ type: Boolean, default: false       },
  data:          { type: Object,  default: () => ({})  }
})

const isDashboard = computed(() => Object.keys(props.data).length === 0)
const showSwitcher = computed(() => props.enableSwitcher || isDashboard.value)

// `internalMode` tracks which tab is selected. starts from the prop but
// can change independently (controlled -> uncontrolled pattern)
const internalMode = ref(props.mode)
const moduleStore  = useModuleStore()

const localAssessments = ref([])

onMounted(async () => {
  if (isDashboard.value) {
    try {
      const { data } = await api.get('/assessments')
      localAssessments.value = data
    } catch (e) {
      console.error(e)
    }
  }
})

// Accordion: only one row can be open at a time. Storing just active
// code (or null) is simpler than a set/Map of booleans for each row
const expandedAccordion = ref(null)
const toggleAccordion = (code) => {
  expandedAccordion.value = expandedAccordion.value === code ? null : code
}

const semesterModules = computed(() => {
  if (props.data.modules) return props.data.modules

  return moduleStore.modules.map(mod => {
    return {
      ...mod,
      exams: localAssessments.value
        .filter(a => a.module_code === mod.code)
        .map(a => ({ title: a.title, weight: a.weighting, score: null }))
    }
  })
})

// Calculates marks from an array of exam objects.
// Exams with no score yet contribute to `unassessedWeight`, which is added
// to `achievedMark` to give our best-case ""attainable"" final mark
const processExams = (exams) => {
  let assessedWeight = 0, achievedMark = 0, unassessedWeight = 0
  ;(exams || []).forEach(exam => {
    if (exam.score !== null && exam.score !== undefined && exam.score !== 'TBD') {
      const scoreVal = typeof exam.score === 'string' ? parseFloat(exam.score.replace('%', '')) : exam.score
      if (!isNaN(scoreVal)) { assessedWeight += exam.weight; achievedMark += (exam.weight * scoreVal) / 100 }
      else unassessedWeight += exam.weight
    } else {
      unassessedWeight += exam.weight
    }
  })
  return {
    assessedWeight:      Number(assessedWeight.toFixed(1)),
    achievedMark:        Number(achievedMark.toFixed(1)),
    attainableFinalMark: Number((achievedMark + unassessedWeight).toFixed(1))
  }
}

const moduleStats        = computed(() => semesterModules.value.map(mod => ({ ...mod, stats: processExams(mod.exams) })))
const singleModuleExams  = computed(() => props.data.exams || [])

// Per-module left border colour (inline style, not theme token). each
// module has its own `theme_color` stored in DB. Falls back to blue.
const getModuleThemeColor = (code) => {
  const mod = moduleStore.getModule(code)
  return mod?.theme_color || '#3B82F6'
}

const isSemesterView = computed(() => internalMode.value === 'semester')

const activeModule = computed(() => {
  if (showSwitcher.value && internalMode.value !== 'semester') {
    return semesterModules.value.find(m => m.code === internalMode.value) || semesterModules.value[0]
  }
  return null
})

const activeExams = computed(() => {
  if (isSemesterView.value) return []
  const exams = activeModule.value ? activeModule.value.exams : singleModuleExams.value
  const code  = activeModule.value ? activeModule.value.code  : (props.data.code || 'DEFAULT')
  return (exams || []).map(ex => ({ ...ex, moduleCode: code }))
})

const activeModuleStats = computed(() => processExams(activeExams.value))

// Semester-level stats are averaged across modules rather than summed
// since each module has different total weightings. NEED TO REVIEW LATER
const semesterStats = computed(() => {
  const mods = moduleStats.value
  if (!mods.length) return { achievedMark: 0, assessedWeight: 0, attainableFinalMark: 0 }
  return {
    achievedMark:        (mods.reduce((s, m) => s + m.stats.achievedMark, 0) / mods.length).toFixed(1),
    assessedWeight:      (mods.reduce((s, m) => s + m.stats.assessedWeight, 0) / mods.length).toFixed(1),
    attainableFinalMark: (mods.reduce((s, m) => s + m.stats.attainableFinalMark, 0) / mods.length).toFixed(1),
  }
})
</script>

<script>
export const widgetMeta = { name: 'Grades & Weightings', w: 12, h: 4 }
</script>
