<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-6">
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
      <div class="sm:w-36">
        <FormLabel text="ចាប់ពីថ្ងៃ" for-id="audit-date-from" />
        <input id="audit-date-from" v-model="dateFrom" type="date" class="input-field text-sm" />
      </div>
      <div class="sm:w-36">
        <FormLabel text="ដល់ថ្ងៃ" for-id="audit-date-to" />
        <input id="audit-date-to" v-model="dateTo" type="date" class="input-field text-sm" />
      </div>
      <div class="sm:w-32">
        <FormLabel text="ចំនួន/ទំព័រ" />
        <SearchableSelect v-model="pageSize" :options="pageSizeOptions" :clearable="false" :searchable="false" class="sm:w-32" />
      </div>
      <button v-if="hasActiveFilters" type="button" class="text-xs text-rust hover:underline mb-2" @click="resetFilters">សម្អាតតម្រង</button>
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
import { formatOrderDateTime as formatDateTime } from '~/composables/useOrderDisplay'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'

// listFn/filterOptionsFn are the two calls this table needs — passed in
// rather than hardcoded, so this one component serves both the staff and
// customer log views without duplicating the table/filter markup twice.
const props = defineProps({
  listFn: { type: Function, required: true },
  filterOptionsFn: { type: Function, required: true },
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
