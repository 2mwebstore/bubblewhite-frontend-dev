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
      <div class="sm:w-48">
        <FormLabel text="ចាប់ពី" for-id="audit-date-from" />
        <input id="audit-date-from" v-model="dateFrom" type="datetime-local" class="input-field text-sm" />
      </div>
      <div class="sm:w-48">
        <FormLabel text="ដល់" for-id="audit-date-to" />
        <input id="audit-date-to" v-model="dateTo" type="datetime-local" class="input-field text-sm" />
      </div>
      <div class="sm:w-32">
        <FormLabel text="ចំនួន/ទំព័រ" />
        <SearchableSelect v-model="pageSize" :options="pageSizeOptions" :clearable="false" :searchable="false" class="sm:w-32" />
      </div>
      <button v-if="hasActiveFilters" type="button" class="text-xs text-rust hover:underline mb-2" @click="resetFilters">សម្អាតតម្រង</button>
    </div>

    <!-- Cleanup: keep only the last N months, delete everything older.
         A destructive, irreversible action — confirmed via a native
         confirm() dialog before actually running, rather than a single
         click doing it immediately. -->
    <div class="flex flex-wrap items-end gap-3 mb-6 p-3 rounded-card bg-cream-dark/50 border border-line">
      <div class="sm:w-48">
        <FormLabel text="សម្អាតកំណត់ហេតុចាស់" />
        <SearchableSelect v-model="retentionPreset" :options="retentionOptions" :clearable="false" :searchable="false" class="sm:w-48" />
      </div>
      <button
        type="button"
        class="text-sm text-red-600 border border-red-300 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-2"
        :disabled="cleaningUp"
        @click="runCleanup"
      >
        <Loader2 v-if="cleaningUp" :size="14" class="animate-spin" />
        {{ cleaningUp ? 'កំពុងលុប…' : 'លុបកំណត់ហេតុចាស់' }}
      </button>
      <p v-if="cleanupMessage" class="text-xs" :class="cleanupError ? 'text-red-600' : 'text-rust'">{{ cleanupMessage }}</p>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 6" :key="n" class="h-14 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="logs.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3">ថ្ងៃ ម៉ោង</th>
            <th class="text-left px-4 py-3">អ្នកធ្វើសកម្មភាព</th>
            <th class="text-left px-4 py-3">សកម្មភាព</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ធនធាន</th>
            <th class="text-left px-4 py-3 hidden lg:table-cell">ការពិពណ៌នា</th>
            <th class="text-left px-4 py-3 hidden xl:table-cell">IP</th>
            <th class="text-left px-4 py-3 hidden 2xl:table-cell">ឧបករណ៍</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-cream-dark/50">
            <td class="px-4 py-3 text-muted whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
            <td class="px-4 py-3 font-medium">{{ log.actorName || `#${log.actorId}` }}</td>
            <td class="px-4 py-3">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="actionClass(log.action)">{{ log.action }}</span>
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-muted">
              {{ log.resource }}<span v-if="log.resourceLabel"> — {{ log.resourceLabel }}</span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell text-muted">{{ log.description }}</td>
            <td class="px-4 py-3 hidden xl:table-cell text-muted whitespace-nowrap">{{ log.ipAddress }}</td>
            <td class="px-4 py-3 hidden 2xl:table-cell text-muted whitespace-nowrap" :title="log.userAgent">{{ parseUserAgent(log.userAgent) }}</td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :meta="meta" @change="(p) => (page = p)" />
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">{{ hasActiveFilters ? 'មិនមានកំណត់ហេតុត្រូវនឹងតម្រងរបស់អ្នកទេ។' : 'មិនមានកំណត់ហេតុនៅឡើយទេ។' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { formatOrderDateTime as formatDateTime } from '~/composables/useOrderDisplay'
import { parseUserAgent } from '~/composables/useUserAgentLabel'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'

// listFn/filterOptionsFn/cleanupFn are the three calls this table needs —
// passed in rather than hardcoded, so this one component serves both the
// staff and customer log views without duplicating the table/filter/
// cleanup markup twice.
const props = defineProps({
  listFn: { type: Function, required: true },
  filterOptionsFn: { type: Function, required: true },
  cleanupFn: { type: Function, required: true },
})

const logs = ref([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPage: 1 })

const search = ref('')
const actionFilter = ref('')
const resourceFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
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
const cleaningUp = ref(false)
const cleanupMessage = ref('')
const cleanupError = ref(false)

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

watch(page, load)
watch([actionFilter, resourceFilter, dateFrom, dateTo, pageSize], () => {
  page.value = 1
  load()
})

let searchDebounce = null
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})

function resetFilters() {
  search.value = ''
  actionFilter.value = ''
  resourceFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

async function runCleanup() {
  const label = retentionOptions.find((o) => o.value === retentionPreset.value)?.label || retentionPreset.value
  if (!confirm(`តើអ្នកប្រាកដទេ? សកម្មភាពនេះលុបជាអចិន្ត្រៃយ៍ គ្មានលទ្ធភាពត្រឡប់វិញ។\n\n"${label}"`)) {
    return
  }
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
