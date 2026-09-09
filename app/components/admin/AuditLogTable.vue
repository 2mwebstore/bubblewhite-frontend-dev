<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex-1 min-w-[200px]">
        <FormLabel text="ស្វែងរក" for-id="audit-search" />
        <input
          id="audit-search"
          v-model="search"
          type="search"
          placeholder="ឈ្មោះ, ការពិពណ៌នា…"
          class="input-field text-sm"
        />
      </div>
      <div class="sm:w-40">
        <FormLabel text="សកម្មភាព" />
        <SearchableSelect v-model="actionFilter" :options="actionOptions" :clearable="false" :searchable="false" class="sm:w-40" />
      </div>
      <div class="sm:w-40">
        <FormLabel text="ធនធាន" />
        <SearchableSelect v-model="resourceFilter" :options="resourceOptions" :clearable="false" :searchable="false" class="sm:w-40" />
      </div>
      <div>
        <FormLabel text="កាលបរិច្ឆេទ" />
        <DateRangePicker v-model="dateRange" placeholder="ជ្រើសរើសចន្លោះកាលបរិច្ឆេទ…" />
      </div>
      <div class="sm:w-32">
        <FormLabel text="ចំនួន/ទំព័រ" />
        <SearchableSelect v-model="pageSize" :options="pageSizeOptions" :clearable="false" :searchable="false" class="sm:w-32" />
      </div>
      <button v-if="hasActiveFilters" type="button" class="text-xs text-rust hover:underline mb-2" @click="resetFilters">សម្អាតតម្រង</button>
    </div>

    <!-- Cleanup: keep only the last N months, delete everything older.
         A destructive, irreversible action — confirmed via ConfirmDialog
         before actually running, rather than a single click doing it
         immediately. -->
    <div class="flex flex-wrap items-end gap-3 mb-6 p-3 rounded-card bg-cream-dark/50 border border-line">
      <div class="sm:w-48">
        <FormLabel text="សម្អាតកំណត់ហេតុចាស់" />
        <SearchableSelect v-model="retentionPreset" :options="retentionOptions" :clearable="false" :searchable="false" class="sm:w-48" />
      </div>
      <button
        type="button"
        class="text-sm text-red-600 border border-red-300 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-2"
        :disabled="cleaningUp"
        @click="confirmingCleanup = true"
      >
        <Loader2 v-if="cleaningUp" :size="14" class="animate-spin" />
        {{ cleaningUp ? 'កំពុងលុប…' : 'លុបកំណត់ហេតុចាស់' }}
      </button>
      <p v-if="cleanupMessage" class="text-xs" :class="cleanupError ? 'text-red-600' : 'text-rust'">{{ cleanupMessage }}</p>
    </div>

    <!-- Selection toolbar — only shown once at least one row is checked. -->
    <div v-if="selectedIds.size" class="flex items-center gap-3 mb-3 p-3 rounded-card bg-red-50 border border-red-200">
      <p class="text-sm text-red-700">បានជ្រើសរើស {{ selectedIds.size }} កំណត់ហេតុ</p>
      <button
        type="button"
        class="text-sm text-white bg-red-600 rounded-lg px-3 py-1.5 hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2"
        :disabled="deletingSelected"
        @click="confirmingDeleteSelected = true"
      >
        <Loader2 v-if="deletingSelected" :size="14" class="animate-spin" />
        {{ deletingSelected ? 'កំពុងលុប…' : 'លុបដែលបានជ្រើសរើស' }}
      </button>
      <button type="button" class="text-sm text-muted hover:underline" @click="selectedIds.clear()">លុបការជ្រើសរើស</button>
      <p v-if="deleteSelectedMessage" class="text-xs" :class="deleteSelectedError ? 'text-red-600' : 'text-rust'">{{ deleteSelectedMessage }}</p>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 6" :key="n" class="h-14 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="logs.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 w-10">
              <input type="checkbox" :checked="allOnPageSelected" @change="toggleSelectAll" />
            </th>
            <th class="text-left px-4 py-3">ថ្ងៃ ម៉ោង</th>
            <th class="text-left px-4 py-3">អ្នកធ្វើសកម្មភាព</th>
            <th class="text-left px-4 py-3">សកម្មភាព</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ធនធាន</th>
            <th class="text-left px-4 py-3 hidden lg:table-cell">ការពិពណ៌នា</th>
            <th class="text-left px-4 py-3 hidden xl:table-cell">IP / ប្រទេស</th>
            <th class="text-left px-4 py-3 hidden 2xl:table-cell">ឧបករណ៍</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-cream-dark/50" :class="selectedIds.has(log.id) ? 'bg-red-50/50' : ''">
            <td class="px-4 py-3">
              <input type="checkbox" :checked="selectedIds.has(log.id)" @change="toggleOne(log.id)" />
            </td>
            <td class="px-4 py-3 text-muted whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
            <td class="px-4 py-3 font-medium">{{ log.actorName || `#${log.actorId}` }}</td>
            <td class="px-4 py-3">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="actionClass(log.action)">{{ log.action }}</span>
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-muted">
              {{ log.resource }}<span v-if="log.resourceLabel"> — {{ log.resourceLabel }}</span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell text-muted">{{ log.description }}</td>
            <td class="px-4 py-3 hidden xl:table-cell text-muted whitespace-nowrap">
              <div>{{ log.ipAddress }}</div>
              <div v-if="log.country" class="mt-0.5">
                <span class="text-[10px] text-muted">{{ log.country }}</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden 2xl:table-cell text-muted whitespace-nowrap" :title="log.userAgent">{{ parseUserAgent(log.userAgent) }}</td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :meta="meta" @change="(p) => (page = p)" />
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">{{ hasActiveFilters ? 'មិនមានកំណត់ហេតុត្រូវនឹងតម្រងរបស់អ្នកទេ។' : 'មិនមានកំណត់ហេតុនៅឡើយទេ។' }}</p>
    </div>

    <ConfirmDialog
      :open="confirmingCleanup"
      title="លុបកំណត់ហេតុចាស់?"
      :message="`សកម្មភាពនេះលុបជាអចិន្ត្រៃយ៍ គ្មានលទ្ធភាពត្រឡប់វិញ។ (${retentionLabel})`"
      @cancel="confirmingCleanup = false"
      @confirm="runCleanup"
    />
    <ConfirmDialog
      :open="confirmingDeleteSelected"
      title="លុបកំណត់ហេតុដែលបានជ្រើសរើស?"
      :message="`នេះនឹងលុប ${selectedIds.size} កំណត់ហេតុជាអចិន្ត្រៃយ៍។`"
      @cancel="confirmingDeleteSelected = false"
      @confirm="runDeleteSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { formatOrderDateTime as formatDateTime } from '~/composables/useOrderDisplay'
import { parseUserAgent } from '~/composables/useUserAgentLabel'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'
import DateRangePicker from '~/components/admin/DateRangePicker.vue'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'

// listFn/filterOptionsFn/cleanupFn/deleteSelectedFn are the four calls
// this table needs — passed in rather than hardcoded, so this one
// component serves both the staff and customer log views without
// duplicating the table/filter/cleanup/delete markup twice.
const props = defineProps({
  listFn: { type: Function, required: true },
  filterOptionsFn: { type: Function, required: true },
  cleanupFn: { type: Function, required: true },
  deleteSelectedFn: { type: Function, required: true },
})

const logs = ref([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPage: 1 })

const search = ref('')
const actionFilter = ref('')
const resourceFilter = ref('')
// [from, to] as plain "YYYY-MM-DD" strings — see DateRangePicker.vue.
// dateFrom/dateTo below are derived from this for the actual API calls,
// since the backend filter still takes them as two separate values.
const dateRange = ref(['', ''])
const dateFrom = computed(() => dateRange.value[0] || '')
const dateTo = computed(() => dateRange.value[1] || '')
const pageSize = ref(20)

const availableActions = ref([])
const availableResources = ref([])
const actionOptions = computed(() => [{ value: '', label: 'សកម្មភាពទាំងអស់' }, ...availableActions.value.map((a) => ({ value: a, label: a }))])
const resourceOptions = computed(() => [{ value: '', label: 'ធនធានទាំងអស់' }, ...availableResources.value.map((r) => ({ value: r, label: r }))])
const pageSizeOptions = [
  { value: 20, label: '20 / ទំព័រ' },
  { value: 50, label: '50 / ទំព័រ' },
  { value: 100, label: '100 / ទំព័រ' },
]

const retentionPreset = ref('3_months')
const retentionOptions = [
  { value: 'this_month', label: 'រក្សាតែខែនេះ' },
  { value: 'last_month', label: 'រក្សា ២ ខែចុងក្រោយ' },
  { value: '3_months', label: 'រក្សា ៣ ខែចុងក្រោយ' },
  { value: '5_months', label: 'រក្សា ៥ ខែចុងក្រោយ' },
]
const retentionLabel = computed(() => retentionOptions.find((o) => o.value === retentionPreset.value)?.label || retentionPreset.value)
const confirmingCleanup = ref(false)
const cleaningUp = ref(false)
const cleanupMessage = ref('')
const cleanupError = ref(false)

// Checkbox-based multi-select — a plain Set of log IDs, cleared whenever
// the page/filters change (a selection made on a since-replaced page of
// results wouldn't mean anything once the underlying rows are gone).
const selectedIds = ref(new Set())
const confirmingDeleteSelected = ref(false)
const deletingSelected = ref(false)
const deleteSelectedMessage = ref('')
const deleteSelectedError = ref(false)
const allOnPageSelected = computed(() => logs.value.length > 0 && logs.value.every((l) => selectedIds.value.has(l.id)))

function toggleOne(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  if (allOnPageSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(logs.value.map((l) => l.id))
  }
}

const hasActiveFilters = computed(() => !!(search.value || actionFilter.value || resourceFilter.value || dateFrom.value || dateTo.value))

// A handful of recognizable colors for the most common action verbs —
// falls back to a neutral style for anything else (e.g. custom actions
// added later) rather than needing this list kept exhaustively in sync.
function actionClass(action) {
  if (action.includes('delete')) return 'bg-red-100 text-red-700'
  if (action.includes('create') || action === 'register') return 'bg-green-100 text-green-700'
  if (action.includes('login') && action.includes('failed')) return 'bg-red-100 text-red-700'
  if (action.includes('login') || action === 'update' || action.includes('update')) return 'bg-blue-100 text-blue-700'
  return 'bg-cream-dark text-ink'
}

async function load() {
  loading.value = true
  try {
    const res = await props.listFn({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim(),
      action: actionFilter.value,
      resource: resourceFilter.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
    })
    logs.value = res.data || []
    meta.value = res.meta || meta.value
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
}

watch(page, () => {
  selectedIds.value = new Set()
  load()
})
watch([actionFilter, resourceFilter, dateRange, pageSize], () => {
  selectedIds.value = new Set()
  page.value = 1
  load()
}, { deep: true })

let searchDebounce = null
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    selectedIds.value = new Set()
    page.value = 1
    load()
  }, 350)
})

function resetFilters() {
  search.value = ''
  actionFilter.value = ''
  resourceFilter.value = ''
  dateRange.value = ['', '']
}

async function runCleanup() {
  confirmingCleanup.value = false
  cleanupMessage.value = ''
  cleanupError.value = false
  cleaningUp.value = true
  try {
    const res = await props.cleanupFn(retentionPreset.value)
    cleanupMessage.value = `បានលុប ${res.data?.deleted ?? 0} កំណត់ហេតុ`
    page.value = 1
    await load()
  } catch (e) {
    cleanupError.value = true
    cleanupMessage.value = e.message || 'មិនអាចលុបបានទេ'
  } finally {
    cleaningUp.value = false
  }
}

async function runDeleteSelected() {
  confirmingDeleteSelected.value = false
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  deleteSelectedMessage.value = ''
  deleteSelectedError.value = false
  deletingSelected.value = true
  try {
    await props.deleteSelectedFn(ids)
    selectedIds.value = new Set()
    await load()
  } catch (e) {
    deleteSelectedError.value = true
    deleteSelectedMessage.value = e.message || 'មិនអាចលុបបានទេ'
  } finally {
    deletingSelected.value = false
  }
}

onMounted(() => {
  load()
  props.filterOptionsFn()
    .then((res) => {
      availableActions.value = res.data?.actions || []
      availableResources.value = res.data?.resources || []
    })
    .catch(() => {})
})
</script>
