<template>
  <div class="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-edge overflow-hidden relative pointer-events-auto">
    <div class="p-5 border-b border-edge bg-pop flex justify-between items-center">
      <h3 class="text-lg font-extrabold text-body">New Event</h3>
      <button v-if="onClose" @click="onClose" class="text-ghost hover:text-danger transition-colors bg-card hover:bg-danger-soft rounded-full p-1 flex">
        <span class="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>

    <div class="p-5 space-y-4 overflow-y-auto flex-1">
      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Event Title</label>
        <input
          v-model="title"
          type="text"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="Gym, Study Group, etc."
        />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Location (Optional)</label>
        <input
          v-model="location"
          type="text"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="e.g. Library"
        />
      </div>

      <div class="flex items-center gap-2">
        <!--
          The checkbox `id` matches the label's `for` ; clicking
          anywhere on the label text also toggles the checkbox, not just the
          tiny checkbox itself. ALWAYS pair labels and inputs this way.
        -->
        <input
          v-model="isAllDay"
          type="checkbox"
          id="allDayCheckbox"
          class="w-4 h-4 rounded border-rim text-primary focus:ring-primary cursor-pointer"
        />
        <label for="allDayCheckbox" class="text-sm font-bold text-body cursor-pointer">All Day</label>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Start Time</label>
          <!--
            `:type` is a dynamic attribute, when `isAllDay` is true, the
            input becomes a plain date picker; otherwise it shows a full
            datetime-local picker. browser renders the appropriate
            native UI for each type.
          -->
          <input
            v-model="startTime"
            :type="isAllDay ? 'date' : 'datetime-local'"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <!-- End time doesnt make sense for all-day events, so hide it -->
        <div v-if="!isAllDay">
          <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">End Time</label>
          <input
            v-model="endTime"
            type="datetime-local"
            class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Color</label>
        <div class="flex items-center gap-3">
          <input
            v-model="color"
            type="color"
            class="w-8 h-8 rounded cursor-pointer border border-edge"
          />
          <span class="text-sm text-dim">{{ color }}</span>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Recurrence</label>
        <select
          v-model="recurrencePattern"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option :value="null">None (One-off)</option>
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <!-- ONLY show end-date picker when a recurrence is selected -->
      <div v-if="recurrencePattern">
        <label class="block text-[11px] font-bold text-ghost mb-1 uppercase tracking-wider">Recurrence End Date</label>
        <input
          v-model="recurrenceEndDate"
          type="date"
          class="w-full p-2.5 border border-edge bg-card text-body rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
    </div>

    <div class="p-5 mt-auto border-t border-edge bg-pop shrink-0">
      <!--
        `:disabled` prevents submission when required fields are empty.
        The `disabled:opacity-50` Tailwind class dims the button automatically
        so the user gets a visual cue w/o any JS needed.
      -->
      <button
        @click="saveEvent"
        :disabled="!title.trim() || !startTime"
        class="w-full py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-text disabled:opacity-50 transition-colors shadow-md hover:shadow-lg flex justify-center items-center gap-2"
      >
        <span class="material-symbols-outlined text-[20px]">check</span>
        Save Event
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useEventStore } from '../../stores/events'

// `initialDate` lets the calendar pass in a pre-filled date when the user
// clicks a specific day. `onClose` is a callback the parent provides so this
// widget can close whatever modal or panel it's inside.
const props = defineProps({
  initialDate: { type: String, default: null },
  onClose: { type: Function, default: null }
})

const eventStore = useEventStore()

const title             = ref('')
const location          = ref('')
const isAllDay          = ref(false)
const startTime         = ref('')
const endTime           = ref('')
const color             = ref('#6366f1')
const recurrencePattern = ref(null)
const recurrenceEndDate = ref('')

onMounted(() => {
  if (props.initialDate) {
    // A datetime string contains 'T' but a plain date string doesn't
    // We use that to decide whether to enable the all-day toggle automatically
    if (props.initialDate.includes('T')) {
      startTime.value = props.initialDate.slice(0, 16)
    } else {
      isAllDay.value  = true
      startTime.value = props.initialDate
    }
  }
})

// `watch` lets you react to a reactive value changing. clear the
// end time whenever the user ticks "All Day", since an all-day event has
// no end time concept. better than checking isAllDay inside saveEvent.
watch(isAllDay, (val) => {
  if (val) endTime.value = ''
})

const saveEvent = async () => {
  if (!title.value.trim() || !startTime.value) return

  let formattedStart = startTime.value
  let formattedEnd   = endTime.value || null

  // `datetime-local` inputs produce strings like "2026-05-26T14:30" (no seconds,
  // no timezone). SQLite expects ISO 8601 with seconds, so append ":00Z"
  if (!isAllDay.value) {
    if (formattedStart.length === 16) formattedStart += ':00Z'
    if (formattedEnd && formattedEnd.length === 16) formattedEnd += ':00Z'
  }

  await eventStore.createUserEvent({
    title:                title.value.trim(),
    description:          null,
    location:             location.value.trim() || null,
    is_all_day:           isAllDay.value ? 1 : 0,
    start_time:           formattedStart,
    end_time:             formattedEnd,
    color:                color.value,
    is_recurring:         recurrencePattern.value ? 1 : 0,
    recurrence_pattern:   recurrencePattern.value,
    recurrence_end_date:  recurrenceEndDate.value || null
  })

  // Reset all fields so the form is ready for the next event without a page reload
  title.value             = ''
  location.value          = ''
  isAllDay.value          = false
  startTime.value         = ''
  endTime.value           = ''
  color.value             = '#6366f1'
  recurrencePattern.value = null
  recurrenceEndDate.value = ''

  if (props.onClose) props.onClose()
}
</script>

<script>
export const widgetMeta = { name: 'New Event Form', w: 4, h: 7 }
</script>
