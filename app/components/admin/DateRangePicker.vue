<template>
  <div ref="root" class="relative inline-block">
    <!-- Trigger -->
    <div
      class="input-field flex items-center gap-2 cursor-pointer min-w-[220px] select-none"
      @click="toggle"
    >
      <Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span class="text-sm flex-1" :class="display ? 'text-gray-700' : 'text-gray-400'">
        {{ display || placeholder }}
      </span>
      <X v-if="display" class="w-4 h-4 text-gray-400 hover:text-gray-600" @click.stop="clearAll" />
    </div>

    <!-- Panel -->
    <div
      v-if="open"
      class="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 flex"
      :style="pos"
      @mousedown.stop
    >
      <!-- Shortcuts -->
      <div class="flex flex-col gap-0.5 p-4 border-r border-gray-100 w-36">
        <button
          v-for="s in shortcuts" :key="s.label"
          class="text-left text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
          :class="activeShortcut === s.label ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600 hover:bg-gray-50'"
          @click="pickShortcut(s)"
        >{{ s.label }}</button>
      </div>

      <!-- Calendars -->
      <div class="flex flex-col">
        <div class="flex divide-x divide-gray-100">
          <CalendarMonth
            :year="ly" :month="lm"
            :start="start" :end="end" :hover="hov"
            @pick="pick" @hover="hov = $event"
          >
            <template #nav-left><button @click="prev" class="p-1 rounded hover:bg-gray-100"><ChevronLeft class="w-4 h-4 text-gray-500"/></button></template>
            <template #nav-right><span class="w-6"/></template>
          </CalendarMonth>
          <CalendarMonth
            :year="ry" :month="rm"
            :start="start" :end="end" :hover="hov"
            @pick="pick" @hover="hov = $event"
          >
            <template #nav-left><span class="w-6"/></template>
            <template #nav-right><button @click="next" class="p-1 rounded hover:bg-gray-100"><ChevronRight class="w-4 h-4 text-gray-500"/></button></template>
          </CalendarMonth>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-4 py-3 border-t border-gray-100">
          <button class="btn-secondary text-sm px-4 py-1.5" @click="open = false">Cancel</button>
          <button
            class="text-sm px-5 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
            :disabled="!start || !end"
            @click="applyRange"
          >Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, defineComponent, h } from 'vue'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Array, default: () => ['', ''] },
  placeholder: { type: String, default: 'Select date range…' },
})
const emit = defineEmits(['update:modelValue'])

// ── state ────────────────────────────────────────────────────────────────────
const root  = ref(null)
const open  = ref(false)
const pos   = ref({})
const hov   = ref(null)
const activeShortcut = ref('')

const now = new Date()
const viewY = ref(now.getFullYear())
const viewM = ref(now.getMonth()) // right month (0-indexed)

const ly = computed(() => viewM.value === 0 ? viewY.value - 1 : viewY.value)
const lm = computed(() => viewM.value === 0 ? 11 : viewM.value - 1)
const ry = computed(() => viewY.value)
const rm = computed(() => viewM.value)

function prev() {
  if (viewM.value === 0) { viewM.value = 11; viewY.value-- }
  else viewM.value--
}
function next() {
  if (viewM.value === 11) { viewM.value = 0; viewY.value++ }
  else viewM.value++
}

// Selection — dates stored as YYYY-MM-DD strings
const start    = ref(props.modelValue?.[0] || '')
const end      = ref(props.modelValue?.[1] || '')
const picking  = ref(false) // true = waiting for second click

function pick(dateStr) {
  activeShortcut.value = ''
  if (!picking.value) {
    start.value   = dateStr
    end.value     = ''
    picking.value = true
  } else {
    if (dateStr < start.value) {
      end.value   = start.value
      start.value = dateStr
    } else {
      end.value = dateStr
    }
    picking.value = false
  }
}

const display = computed(() => {
  if (!start.value && !end.value) return ''
  const fmt = s => {
    const [y, m, d] = s.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d} ${months[+m-1]} ${y}`
  }
  if (start.value && end.value) return `${fmt(start.value)} ~ ${fmt(end.value)}`
  return fmt(start.value)
})

// ── shortcuts ────────────────────────────────────────────────────────────────
function toStr(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
const today = toStr(new Date())
const shortcuts = [
  { label: 'Today',       s: today, e: today },
  { label: 'Yesterday',   s: toStr((() => { const d=new Date(); d.setDate(d.getDate()-1); return d })()), e: toStr((() => { const d=new Date(); d.setDate(d.getDate()-1); return d })()) },
  { label: 'Last 7 Days', s: toStr((() => { const d=new Date(); d.setDate(d.getDate()-6); return d })()), e: today },
  { label: 'Last 30 Days',s: toStr((() => { const d=new Date(); d.setDate(d.getDate()-29); return d })()), e: today },
  { label: 'This Month',  s: toStr(new Date(now.getFullYear(), now.getMonth(), 1)), e: toStr(new Date(now.getFullYear(), now.getMonth()+1, 0)) },
  { label: 'Last Month',  s: toStr(new Date(now.getFullYear(), now.getMonth()-1, 1)), e: toStr(new Date(now.getFullYear(), now.getMonth(), 0)) },
]

function pickShortcut(s) {
  start.value = s.s; end.value = s.e; picking.value = false
  activeShortcut.value = s.label
}

// ── apply / clear ────────────────────────────────────────────────────────────
function applyRange() {
  emit('update:modelValue', [start.value, end.value])
  open.value = false
}
function clearAll() {
  start.value = ''; end.value = ''; picking.value = false; activeShortcut.value = ''
  emit('update:modelValue', ['', ''])
}

// ── open / close ─────────────────────────────────────────────────────────────
async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const rect = root.value.getBoundingClientRect()
  pos.value = {
    top:  `${rect.bottom + 6}px`,
    left: `${Math.min(rect.left, window.innerWidth - 660)}px`,
  }
}

function onMousedown(e) {
  if (open.value && root.value && !root.value.contains(e.target)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onMousedown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onMousedown))

// ── CalendarMonth sub-component ───────────────────────────────────────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

const CalendarMonth = defineComponent({
  props: { year: Number, month: Number, start: String, end: String, hover: String },
  emits: ['pick', 'hover'],
  setup(p, { emit, slots }) {
    function buildDays() {
      const firstDow = new Date(p.year, p.month, 1).getDay()
      const lastDate = new Date(p.year, p.month + 1, 0).getDate()
      const prevLast = new Date(p.year, p.month, 0).getDate()
      const days = []
      for (let i = firstDow - 1; i >= 0; i--) {
        const d = new Date(p.year, p.month - 1, prevLast - i)
        days.push({ str: toStr(d), label: prevLast - i, cur: false })
      }
      for (let i = 1; i <= lastDate; i++) {
        const d = new Date(p.year, p.month, i)
        days.push({ str: toStr(d), label: i, cur: true })
      }
      while (days.length < 42) {
        const i = days.length - firstDow - lastDate + 1
        const d = new Date(p.year, p.month + 1, i)
        days.push({ str: toStr(d), label: i, cur: false })
      }
      return days
    }

    return () => {
      const days = buildDays()
      const todayStr = toStr(new Date())
      const eStr = p.end || p.hover || ''

      return h('div', { class: 'p-4 w-64' }, [
        // Header
        h('div', { class: 'flex items-center justify-between mb-3' }, [
          slots['nav-left']?.(),
          h('span', { class: 'text-sm font-semibold text-gray-700' }, `${MONTHS[p.month]}  ${p.year}`),
          slots['nav-right']?.(),
        ]),
        // Day names
        h('div', { class: 'grid grid-cols-7 mb-1' },
          DAYS.map(d => h('div', { class: 'text-xs text-center text-gray-400 font-medium py-1' }, d))
        ),
        // Day cells
        h('div', { class: 'grid grid-cols-7' },
          days.map(day => {
            const isStart = day.str === p.start
            const isEnd   = day.str === eStr && p.end
            const inRange = p.start && eStr && day.str > p.start && day.str < eStr
            const isToday = day.str === todayStr

            let cls = 'h-8 w-full text-xs flex items-center justify-center transition-colors '
            if (!day.cur) { cls += 'text-gray-300 cursor-default' }
            else if (isStart || isEnd) { cls += 'bg-indigo-600 text-white font-bold rounded-full cursor-pointer' }
            else if (inRange) { cls += 'bg-indigo-50 text-indigo-700 cursor-pointer' }
            else if (isToday) { cls += 'text-indigo-600 font-semibold cursor-pointer hover:bg-gray-100 rounded-full' }
            else { cls += 'text-gray-700 cursor-pointer hover:bg-gray-100 rounded-full' }

            return h('button', {
              class: cls,
              disabled: !day.cur,
              onClick: () => day.cur && emit('pick', day.str),
              onMouseenter: () => day.cur && emit('hover', day.str),
            }, day.label)
          })
        ),
      ])
    }
  }
})
</script>
