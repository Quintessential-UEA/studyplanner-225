<template>
  <div class="p-6 max-w-7xl mx-auto h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8 shrink-0">
      <button
        @click="nav.navigate('Dashboard', 'backward')"
        class="p-2 rounded-full hover:bg-pop transition-colors text-dim"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <h1 class="text-4xl font-extrabold text-body tracking-tight">Semester Overview</h1>
    </div>

    <!-- Semester Data Bar -->
    <div class="bg-primary rounded-2xl shadow-md p-6 mb-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
          <span class="material-symbols-outlined text-[32px]">school</span>
        </div>
        <div>
          <p class="text-primary-text text-xs font-bold uppercase tracking-wider mb-0.5">Current Term</p>
          <p class="text-2xl font-extrabold tracking-tight">Spring Semester</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-6 md:gap-10">
        <div>
          <p class="text-primary-border text-xs font-bold uppercase tracking-wider mb-1">Academic Year</p>
          <p class="font-semibold text-lg">{{ userStore.profile?.programme_code ? '2025/2026' : '—' }}</p>
        </div>
        <div>
          <p class="text-primary-border text-xs font-bold uppercase tracking-wider mb-1">Modules</p>
          <p class="font-semibold text-lg">{{ moduleStore.moduleCount }} enrolled</p>
        </div>
        <div>
          <p class="text-primary-border text-xs font-bold uppercase tracking-wider mb-1">Current Date</p>
          <p class="font-semibold text-lg">{{ currentDate }}</p>
        </div>
      </div>
    </div>

    <!-- Semester Timeline -->
    <h2 class="text-2xl font-extrabold text-body mb-6 flex items-center gap-2">
      <span class="material-symbols-outlined text-info">view_timeline</span>
      Semester Timeline
    </h2>
    <div class="bg-card rounded-2xl shadow-sm border border-edge p-6 mb-10 overflow-hidden flex-shrink-0">
      <!-- Gantt Header -->
      <div class="flex border-b border-edge pb-2 mb-4">
        <div class="w-1/4 font-bold text-sm text-dim uppercase tracking-wider">Task / Assessment</div>
        <div class="w-3/4 flex justify-between text-xs font-bold text-ghost uppercase tracking-wider">
          <div v-for="week in 12" :key="week" class="flex-1 text-center border-l border-edge first:border-none relative">
            W{{week}}
            <div class="absolute top-6 bottom-[-200px] left-0 w-px bg-pop -z-10"></div>
          </div>
        </div>
      </div>

      <!-- Gantt Rows (prototype) -->
      <div class="space-y-4 relative z-0">
        <div class="flex items-center group">
          <div class="w-1/4 pr-4">
            <h4 class="text-sm font-bold text-body transition-colors truncate">SE Project Phase 1</h4>
            <p class="text-[10px] font-bold text-ghost uppercase tracking-wider">Software Engineering</p>
          </div>
          <div class="w-3/4 relative h-8 bg-pop rounded-lg">
            <div class="absolute top-1 bottom-1 left-[0%] right-[75%] bg-primary rounded-md shadow-sm flex items-center px-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
              <span class="text-white text-[10px] font-bold truncate">Weeks 1-3</span>
            </div>
          </div>
        </div>

        <div class="flex items-center group">
          <div class="w-1/4 pr-4">
            <h4 class="text-sm font-bold text-body transition-colors truncate">Foobar</h4>
            <p class="text-[10px] font-bold text-ghost uppercase tracking-wider">Foobar</p>
          </div>
          <div class="w-3/4 relative h-8 bg-pop rounded-lg">
            <div class="absolute top-1 bottom-1 left-[25%] right-[41.6%] bg-primary rounded-md shadow-sm flex items-center px-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
              <span class="text-white text-[10px] font-bold truncate">Weeks 4-7</span>
            </div>
          </div>
        </div>

        <div class="flex items-center group">
          <div class="w-1/4 pr-4">
            <h4 class="text-sm font-bold text-body transition-colors truncate">SE Project Phase 2</h4>
            <p class="text-[10px] font-bold text-ghost uppercase tracking-wider">Software Engineering</p>
          </div>
          <div class="w-3/4 relative h-8 bg-pop rounded-lg">
            <div class="absolute top-1 bottom-1 left-[50%] right-[0%] bg-primary rounded-md shadow-sm flex items-center px-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
              <span class="text-white text-[10px] font-bold truncate">Weeks 7-12</span>
            </div>
          </div>
        </div>

        <div class="flex items-center group">
          <div class="w-1/4 pr-4">
            <h4 class="text-sm font-bold text-body transition-colors truncate">Foobar</h4>
            <p class="text-[10px] font-bold text-ghost uppercase tracking-wider">Foobar</p>
          </div>
          <div class="w-3/4 relative h-8 bg-pop rounded-lg">
            <div class="absolute top-1 bottom-1 left-[75%] right-[0%] bg-primary rounded-md shadow-sm flex items-center px-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
              <span class="text-white text-[10px] font-bold truncate">Weeks 10-12</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enrolled Modules -->
    <div class="flex-shrink-0 mb-10">
      <h2 class="text-2xl font-extrabold text-body mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined text-info">auto_stories</span>
        Enrolled Modules
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="mod in moduleStore.modules" :key="mod.code"
          class="bg-card rounded-2xl shadow-sm border border-edge p-6 flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden"
        >

          <div class="flex justify-between items-start mb-5 relative z-10">
            <div class="p-3 bg-info-soft rounded-xl text-info shadow-sm">
              <span class="material-symbols-outlined">menu_book</span>
            </div>
            <span class="bg-pop text-dim text-xs font-bold px-3 py-1.5 rounded-full border border-edge">{{ mod.credits }} credits</span>
          </div>
          
          <div class="relative z-10">
            <h3 class="text-xl font-extrabold text-body mb-1">{{ mod.title }}</h3>
            <p class="text-sm font-medium text-dim mb-6">{{ mod.code }} • Semester {{ mod.semester }}</p>
          </div>

          <p class="text-[10px] ml-2 font-bold text-ghost uppercase tracking-wider">Module Organiser</p>
          <div class="space-y-4 mb-8 flex-1 relative z-10">
            <div v-if="mod.organiser_name" class="flex items-center gap-2 text-sm text-dim font-medium bg-pop p-2.5 rounded-lg border border-edge">
              <span class="material-symbols-outlined text-[18px] text-info">person</span>
              {{ mod.organiser_name }}
            </div>
            <div v-if="mod.teaching_staff?.length" class="bg-pop p-2.5 rounded-lg border border-edge space-y-1.5">
              <div v-for="staff in mod.teaching_staff" :key="staff.name" class="flex items-center gap-2 text-sm text-dim font-medium">
                <span class="material-symbols-outlined text-[18px] text-info shrink-0">person</span>
                <span>{{ staff.name }}<span v-if="staff.role" class="text-xs text-dim/60 ml-1">({{ staff.role }})</span></span>
              </div>
            </div>
          </div>

          <button
            @click="goToModule(mod.code)"
            class="relative z-10 w-full py-3 bg-card hover:bg-info-soft text-info font-bold rounded-xl border-2 border-edge hover:border-info-border transition-all flex justify-center items-center gap-2 shadow-sm"
          >
            View Module
            <span class="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<!-- IMPORTS -->


<script setup>
import { computed, onMounted } from 'vue'
import { useNavigationStore } from '../stores/navigation'
import { useModuleStore } from '../stores/modules'
import { useUserStore } from '../stores/user'

const nav         = useNavigationStore()
const moduleStore = useModuleStore()
const userStore   = useUserStore()

onMounted(async () => {
  if (!moduleStore.modules.length) await moduleStore.fetchModules()
  if (!userStore.profile) await userStore.fetchProfile()
})

const currentDate = computed(() =>
  new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
)

const goToModule = (code) => {
  moduleStore.setActiveModule(code)
  nav.navigate('Module', 'forward')
}
</script>
