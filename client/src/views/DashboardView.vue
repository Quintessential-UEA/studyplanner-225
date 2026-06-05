<template>
  <div class="p-6 h-full flex flex-col relative overflow-hidden">
    <div class="flex justify-between items-center mb-8 shrink-0 relative z-50">
      <h1 class="text-4xl font-extrabold text-body tracking-tight">Dashboard</h1>
      <div class="flex items-center gap-4">
        <button
          @click="toggleEditMode"
          class="px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          :class="isEditMode
            ? 'bg-primary text-white hover:bg-primary-text'
            : 'bg-card border border-edge text-body hover:bg-pop'"
        >
          {{ isEditMode ? 'Save Layout' : 'Edit Dashboard' }}
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 relative flex min-h-0">

      <!-- GridStack Container -->
      <div
        class="grid-stack flex-1 transition-all duration-300"
        :class="{'ring-2 ring-rim border-dashed border-2 border-edge mr-80': isEditMode}"
      >
        <!-- Vue rendered layout -->
        <div v-for="item in layout" :key="item.id" class="grid-stack-item" :gs-id="item.id" :gs-x="item.x" :gs-y="item.y" :gs-w="item.w" :gs-h="item.h">
          <!-- Widget Wrapper -->
          <div
            class="grid-stack-item-content bg-card rounded-2xl p-6 border border-edge shadow-sm flex flex-col relative transition-all"
            :class="{'ring-4 ring-primary ring-opacity-20': isEditMode}"
          >
            <div class="relative flex-1 min-h-0" :class="{'pointer-events-none': isEditMode}">
              <component v-if="registry[item.type]" :is="registry[item.type]" />
              <div v-else class="text-sm text-ghost p-4">Widget "{{item.type}}" no longer exists.</div>
            </div>

            <!-- Drag handle -->
            <div v-show="isEditMode" class="drag-handle absolute top-4 right-4 text-primary bg-primary-soft hover:bg-primary-border rounded p-1 flex shadow-sm cursor-move z-50">
              <span class="material-symbols-outlined">drag_indicator</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Components Tray -->
      <div
        class="tray-drop-zone absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-edge shadow-2xl z-40 transform transition-transform duration-300 flex flex-col rounded-l-3xl"
        :class="isEditMode ? 'translate-x-0' : 'translate-x-[120%]'"
      >
        <div class="p-6 border-b border-edge relative">
          <h2 class="text-xl font-extrabold text-body flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">widgets</span>
            Components
          </h2>
          <p class="text-sm text-dim mt-2">Drag widgets onto the grid to add. Drag back here to delete.</p>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4 components-tray">
          <div
            v-for="widget in availableWidgets" :key="widget.type"
            class="grid-stack-item tray-item bg-pop border border-edge rounded-xl p-4 cursor-move hover:border-primary hover:shadow-md transition-all group"
            :gs-w="widget.w" :gs-h="widget.h" :data-type="widget.type"
          >
            <div class="grid-stack-item-content pointer-events-none">
              <h4 class="font-bold text-body group-hover:text-primary transition-colors">{{ widget.name }}</h4>
              <p class="text-xs text-ghost mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">grid_on</span>
                {{ widget.w }}x{{ widget.h }} slots
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<!-- IMPORTS -->


<script setup>
import { ref, onMounted, nextTick } from 'vue'
import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'

const widgetModules = import.meta.glob('../components/widgets/*.vue', { eager: true })

const registry = {}
const availableWidgets = []

for (const path in widgetModules) {
  const mod  = widgetModules[path]
  const type = path.split('/').pop().replace('.vue', '')
  registry[type] = mod.default
  if (mod.widgetMeta) availableWidgets.push({ type, ...mod.widgetMeta })
}

const isEditMode = ref(false)
let grid = null

const defaultLayout = [
  { id: 'widget-1', type: 'HeatmapWidget',   x: 0, y: 0, w: 12, h: 4 },
  { id: 'widget-2', type: 'TaskStatsWidget', x: 0, y: 4, w: 4,  h: 3 },
  { id: 'widget-3', type: 'GradesWidget',    x: 4, y: 4, w: 8,  h: 4 },
  { id: 'widget-4', type: 'GanttWidget',     x: 0, y: 8, w: 12, h: 5 },
]

const layout = ref(JSON.parse(localStorage.getItem('dashboardLayoutArray')) || defaultLayout)

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (grid) {
    if (isEditMode.value) {
      grid.setStatic(false)
    } else {
      const items = grid.getGridItems()
      layout.value = items.map(el => {
        const node    = el.gridstackNode
        const existing = layout.value.find(i => i.id === node.id)
        return { id: node.id, type: existing ? existing.type : el.getAttribute('data-type'), x: node.x, y: node.y, w: node.w, h: node.h }
      })
      localStorage.setItem('dashboardLayoutArray', JSON.stringify(layout.value))
      grid.setStatic(true)
    }
  }
}

onMounted(() => {
  nextTick(() => {
    grid = GridStack.init({
      float: true,
      staticGrid: true,
      handle: '.drag-handle',
      cellHeight: '80px',
      margin: 16,
      animate: true,
      column: 12,
      removable: '.tray-drop-zone',
      acceptWidgets: '.tray-item'
    })

    GridStack.setupDragIn('.tray-item', { revert: 'invalid', appendTo: 'body', helper: 'clone' })

    grid.on('added', function(_e, items) {
      items.forEach(item => {
        const el   = item.el
        const type = el.getAttribute('data-type')
        if (type && !el.getAttribute('gs-id')) {
          const newId = 'widget-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
          grid.removeWidget(el, false)
          el.remove()
          layout.value.push({ id: newId, type, x: item.x, y: item.y, w: item.w, h: item.h })
          nextTick(() => {
            const newEl = document.querySelector(`[gs-id="${newId}"]`)
            if (newEl) grid.makeWidget(newEl)
          })
        }
      })
    })

    grid.on('removed', function(_e, items) {
      items.forEach(item => {
        const el = item.el
        const id = el.getAttribute('gs-id') || item.id
        if (id) layout.value = layout.value.filter(i => i.id !== id)
        if (el && el.parentNode) el.remove()
      })
    })
  })
})
</script>

<style>
.grid-stack-item-content {
  inset: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  overflow-y: hidden !important;
}
.grid-stack {
  min-height: 500px;
  border-radius: 1rem;
  transition: all 0.3s ease;

  /* Pegboard dot-grid uses design tokens for darkmode compatibility */
  background-color: var(--color-canvas);
  background-image: radial-gradient(circle, var(--color-rim) 2px, transparent 2.5px);
  background-size: calc(100% / 12) 96px;
  background-position: 8px 8px;
}
.drag-handle {
  z-index: 100;
}
</style>
