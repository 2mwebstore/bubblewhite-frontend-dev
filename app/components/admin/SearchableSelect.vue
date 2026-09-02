<!-- src/components/admin/SearchableSelect.vue -->
<template>
  <div ref="wrapper" class="relative">
    <span v-if="label" class="mb-1 block text-xs font-medium text-ink">
      {{ label }} <span v-if="required" class="text-rust">*</span>
    </span>

    <!-- Trigger -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm outline-none transition-colors hover:border-rust/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-line"
      :class="open ? 'border-rust ring-1 ring-rust/20' : ''"
      :disabled="disabled"
      @click="toggle"
    >
      <span :class="hasValue ? 'text-ink' : 'text-muted'" class="flex items-center gap-2 min-w-0">
        <template v-if="hasValue && iconOf(modelValue)">
          <img v-if="typeof iconOf(modelValue) === 'string'" :src="iconOf(modelValue)" class="w-4 h-4 object-contain shrink-0" alt="" />
          <component :is="iconOf(modelValue)" v-else :size="14" class="shrink-0" />
        </template>
        <span class="truncate">{{ hasValue ? labelOf(modelValue) : placeholder }}</span>
      </span>
      <span class="flex shrink-0 items-center gap-1">
        <button
          v-if="hasValue && clearable"
          type="button"
          class="p-0.5 text-muted hover:text-ink"
          @click.stop="clear"
        >
          <X class="h-3 w-3" />
        </button>
        <ChevronDown class="h-3.5 w-3.5 text-muted transition-transform" :class="open ? 'rotate-180' : ''" />
      </span>
    </button>

    <!-- Dropdown (teleported to body to avoid overflow clipping) -->
    <Teleport to="body">
      <Transition name="searchable-select">
        <div
          v-if="open"
          :style="dropStyle"
          data-searchable-drop
          class="fixed z-[9000] overflow-hidden rounded-xl border border-line bg-white shadow-xl"
          style="min-width: 200px"
        >
          <!-- Search -->
          <div v-if="searchable" class="border-b border-line px-2.5 pb-1.5 pt-2.5">
            <div class="flex items-center gap-2 rounded-lg border border-line bg-cream-dark px-2.5 py-1.5">
              <Search class="h-3.5 w-3.5 flex-shrink-0 text-muted" />
              <input
                ref="searchRef"
                v-model="query"
                class="flex-1 bg-transparent text-sm text-ink outline-none"
                placeholder="ស្វែងរក…"
              />
              <button v-if="query" type="button" class="text-muted hover:text-ink" @click="query = ''">
                <X class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="overflow-y-auto" style="max-height: 220px">
            <div v-if="!filtered.length" class="px-3 py-4 text-center text-sm text-muted">មិនមានលទ្ធផលទេ</div>

            <button
              v-if="showAll"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-cream-dark"
              :class="!hasValue ? 'bg-rust/10 font-medium text-rust' : 'text-ink/70'"
              @mousedown.prevent="pick(null)"
            >
              <Check class="h-3 w-3 flex-shrink-0" :class="!hasValue ? 'text-rust opacity-100' : 'opacity-0'" />
              {{ allLabel }}
            </button>

            <button
              v-for="item in filtered"
              :key="item[valueKey]"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-cream-dark"
              :class="isSelected(item[valueKey]) ? 'bg-rust/10 font-medium text-rust' : 'text-ink'"
              @mousedown.prevent="pick(item[valueKey])"
            >
              <Check class="h-3 w-3 flex-shrink-0" :class="isSelected(item[valueKey]) ? 'opacity-100' : 'opacity-0'" />
              <img v-if="typeof item[iconKey] === 'string'" :src="item[iconKey]" class="w-4 h-4 object-contain shrink-0" alt="" />
              <component :is="item[iconKey]" v-else-if="item[iconKey]" :size="14" class="shrink-0" />
              <span class="truncate">{{ item[labelKey] }}</span>
              <span v-if="item.sub" class="ml-auto truncate text-xs text-muted">{{ item.sub }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { X, ChevronDown, Search, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, default: () => [] },
  valueKey: { type: String, default: 'value' },
  labelKey: { type: String, default: 'label' },
  // Optional — the field name on each option holding either an image URL
  // (string, rendered as <img>) or a component reference (e.g. a
  // lucide-vue-next icon, rendered via <component :is>). Options without
  // this field render exactly as before — fully backward compatible with
  // every existing use of this component.
  iconKey: { type: String, default: 'icon' },
  label: { type: String, default: '' },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: 'ជ្រើសរើស…' },
  allLabel: { type: String, default: '— ជ្រើសរើស —' },
  showAll: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  // Hides the search box for short lists (e.g. a handful of roles) where
  // typing to filter is more friction than it's worth.
  searchable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const query = ref('')
const wrapper = ref(null)
const searchRef = ref(null)
const dropStyle = ref({})

const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '')

function isSelected(val) {
  return String(props.modelValue) === String(val)
}

function labelOf(val) {
  if (val === null || val === undefined || val === '') return props.placeholder
  // Compared as strings deliberately — a caller may pass '5' where options
  // use the number 5 (or vice versa); without this, a type mismatch here
  // silently fails to find the option and falls back to showing the raw
  // id/value instead of its label.
  const item = props.options.find((o) => String(o[props.valueKey]) === String(val))
  return item ? item[props.labelKey] : String(val)
}

function iconOf(val) {
  const item = props.options.find((o) => String(o[props.valueKey]) === String(val))
  return item ? item[props.iconKey] : null
}

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(
    (o) =>
      String(o[props.labelKey] || '').toLowerCase().includes(q) ||
      String(o.sub || '').toLowerCase().includes(q)
  )
})

function calcDropStyle() {
  if (!wrapper.value) return
  const r = wrapper.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - r.bottom
  const above = spaceBelow < 280

  dropStyle.value = {
    width: Math.max(r.width, 220) + 'px',
    left: r.left + 'px',
    ...(above
      ? { bottom: window.innerHeight - r.top + 4 + 'px', top: 'auto' }
      : { top: r.bottom + 4 + 'px', bottom: 'auto' }),
  }
}

async function toggle() {
  if (props.disabled) return
  if (open.value) {
    open.value = false
    return
  }
  calcDropStyle()
  open.value = true
  query.value = ''
  await nextTick()
  searchRef.value?.focus()
}

function pick(val) {
  emit('update:modelValue', val)
  open.value = false
  query.value = ''
}

function clear() {
  emit('update:modelValue', null)
}

function onOutside(e) {
  if (!open.value) return
  if (wrapper.value?.contains(e.target)) return
  const drop = document.querySelector('[data-searchable-drop]')
  if (drop?.contains(e.target)) return
  open.value = false
}

function onResize() {
  if (open.value) calcDropStyle()
}

onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onResize, true)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutside)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onResize, true)
})
</script>

<style scoped>
.searchable-select-enter-active,
.searchable-select-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.searchable-select-enter-from,
.searchable-select-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
