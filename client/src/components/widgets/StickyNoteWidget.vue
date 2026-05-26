<template>
  <div class="h-full flex flex-col pointer-events-auto bg-[#fef08a] shadow-md rounded-xl overflow-hidden border border-[#fde047] relative group">
    <!-- Header -->
    <div class="px-4 py-2.5 bg-gradient-to-r from-[#fde047]/50 to-transparent border-b border-[#fde047] flex items-center gap-2 shrink-0">
      <!--
        Again: `group` class on the root div lets child elements react to the parent
        being hovered.
      -->
      <span class="material-symbols-outlined text-[#854d0e] text-lg transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">push_pin</span>
      <h3 class="text-sm font-bold text-[#854d0e] tracking-wide">Sticky Note</h3>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 p-1 relative">
      <!--
        `v-model="noteContent"` is two-way binding: changes in the textarea
        update the ref, and changes to the ref update the textarea
        shorthand for `:value="noteContent" @input="noteContent = $event.target.value"`.

        fires `saveNote` on every keystroke via `@input` so the note
        persists to localStorage without needing a save button.
      -->
      <textarea
        v-model="noteContent"
        @input="saveNote"
        class="w-full h-full p-3 bg-transparent border-none outline-none resize-none focus:ring-0 text-[#713f12] placeholder-[#a16207]/60 text-base leading-relaxed"
        placeholder="Jot something down..."
        spellcheck="false"
      ></textarea>

      <!-- Decorative fold corner for funsies -->
      <div class="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-tl from-[#facc15] to-[#fef08a] rounded-tl-xl shadow-[-2px_-2px_4px_rgba(0,0,0,0.05)] opacity-50 pointer-events-none"></div>
    </div>
  </div>
</template>

<script setup>
// `ref` creates a reactive variable. when `.value` changes, Vue
// automatically re-renders any template that reads it.
import { ref, onMounted } from 'vue'

const noteContent = ref('')

// `onMounted` runs once after the component appears in the DOM.
// used it here to restore the saved note from localStorage so the user's
// content survives page refreshes. (but not cache+cookie flushes)
onMounted(() => {
  const saved = localStorage.getItem('dashboardStickyNote')
  if (saved) {
    noteContent.value = saved
  }
})

const saveNote = () => {
  localStorage.setItem('dashboardStickyNote', noteContent.value)
}
</script>

<script>
export const widgetMeta = {
  name: 'Sticky Note',
  w: 3,
  h: 4
}
</script>
