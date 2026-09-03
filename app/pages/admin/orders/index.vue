<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">ការបញ្ជាទិញ</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div class="flex-1 min-w-[180px]">
        <FormLabel text="ស្វែងរក" for-id="order-search" />
        <input
          id="order-search"
          v-model="search"
          type="search"
          placeholder="លេខការបញ្ជាទិញ ឬលេខទូរស័ព្ទ…"
          class="input-field text-sm"
        />
      </div>
      <div class="sm:w-36">
        <FormLabel text="អតិថិជន" for-id="order-customer" />
        <input id="order-customer" v-model="customerId" type="number" min="0" placeholder="លេខសម្គាល់" class="input-field text-sm" />
      </div>
      <div class="sm:w-36">
        <FormLabel text="ស្ថានភាព" />
        <SearchableSelect v-model="statusFilter" :options="filterStatusOptions" :clearable="false" :searchable="false" class="sm:w-36" />
      </div>
      <div class="sm:w-36">
        <FormLabel text="ការទូទាត់" />
        <SearchableSelect v-model="paymentFilter" :options="filterPaymentOptions" :clearable="false" :searchable="false" class="sm:w-36" />
      </div>
      <div class="sm:w-36">
        <FormLabel text="ចំនួន/ទំព័រ" />
        <SearchableSelect v-model="pageSize" :options="pageSizeOptions" :clearable="false" :searchable="false" class="sm:w-36" />
      </div>
      <button v-if="hasActiveFilters" type="button" class="text-xs text-rust hover:underline mb-2" @click="resetFilters">សម្អាតតម្រង</button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 6" :key="n" class="h-14 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="orders.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3">លេខការបញ្ជាទិញ</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">ថ្ងៃ ម៉ោង</th>
            <th class="text-left px-4 py-3 hidden lg:table-cell">អតិថិជន</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ការទូទាត់</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ស្ថានភាពទូទាត់</th>
            <th class="text-right px-4 py-3">សរុប</th>
            <th class="text-left px-4 py-3 w-44">ស្ថានភាព</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-cream-dark/50">
            <td class="px-4 py-3 font-medium cursor-pointer" @click="$router.push(`/admin/orders/${order.id}`)">{{ order.reference }}</td>
            <td class="px-4 py-3 hidden sm:table-cell text-muted cursor-pointer" @click="$router.push(`/admin/orders/${order.id}`)">{{ formatDateTime(order.createdAt) }}</td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <NuxtLink :to="`/admin/customers/${order.customerId}`" class="text-rust hover:underline" @click.stop>{{ order.phone }}</NuxtLink>
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-muted cursor-pointer" @click="$router.push(`/admin/orders/${order.id}`)">{{ paymentLabel(order.paymentMethod) }}</td>
            <td class="px-4 py-3 hidden md:table-cell cursor-pointer" @click="$router.push(`/admin/orders/${order.id}`)">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="paymentStatusClass(order.paymentStatus)">{{ paymentStatusLabel(order.paymentStatus) }}</span>
            </td>
            <td class="px-4 py-3 text-right font-medium cursor-pointer" @click="$router.push(`/admin/orders/${order.id}`)">${{ order.total.toFixed(2) }}</td>
            <td class="px-4 py-3" @click.stop>
              <SearchableSelect
                :model-value="order.status"
                :options="statusOptions"
                :clearable="false"
                :searchable="false"
                :disabled="!hasPermission('order.manage') || savingStatusFor === order.id"
                class="w-full"
                @update:model-value="(val) => onStatusChange(order, val)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :meta="meta" @change="(p) => (page = p)" />
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">{{ hasActiveFilters ? 'មិនមានការបញ្ជាទិញត្រូវនឹងតម្រងរបស់អ្នកទេ។' : 'មិនមានការបញ្ជាទិញនៅឡើយទេ។' }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'order.view' })

import { ref, computed, watch, onMounted } from 'vue'
import { useAdminOrders } from '~/composables/useAdminOrders'
import { useAdminPaymentMethods } from '~/composables/useAdminPaymentMethods'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'

const { listOrders, updateOrderStatus } = useAdminOrders()
const { hasPermission } = useAuth()
const { showToast } = useStore()

const orders = ref([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ page: 1, pageSize: 10, total: 0, totalPage: 1 })

const search = ref('')
const customerId = ref('')
const statusFilter = ref('')
const paymentFilter = ref('')
const pageSize = ref(10)

// Admin list — fetches ALL payment methods regardless of enabled status
// (unlike the storefront's public list), since an admin filtering orders
// needs to find historical orders placed with a method that's since been
// disabled, not just currently-active ones.
const { listPaymentMethods } = useAdminPaymentMethods()
const paymentMethodList = ref([])

const statusOptions = [
  { value: 'pending', label: 'កំពុងរង់ចាំ' },
  { value: 'confirmed', label: 'បានបញ្ជាក់' },
  { value: 'shipped', label: 'កំពុងដឹកជញ្ជូន' },
  { value: 'completed', label: 'បានបញ្ចប់' },
  { value: 'cancelled', label: 'បានលុបចោល' },
]
const filterStatusOptions = [{ value: '', label: 'ស្ថានភាពទាំងអស់' }, ...statusOptions]
// Dynamic — built from the real, admin-managed payment methods table
// (see /admin/payment_method) instead of a hardcoded list, so this never
// silently falls out of sync with whatever payment methods actually
// exist (this used to hardcode only cash/bakong, missing PPCBank entirely
// once it was added, and would have kept listing bakong even after that
// integration was removed).
const filterPaymentOptions = computed(() => [
  { value: '', label: 'ការទូទាត់ទាំងអស់' },
  ...paymentMethodList.value.map((pm) => ({ value: pm.code, label: pm.name })),
])
const pageSizeOptions = [
  { value: 10, label: '10 / ទំព័រ' },
  { value: 20, label: '20 / ទំព័រ' },
  { value: 50, label: '50 / ទំព័រ' },
]

const hasActiveFilters = computed(() => !!(search.value || customerId.value || statusFilter.value || paymentFilter.value))

async function load() {
  loading.value = true
  try {
    const res = await listOrders({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim(),
      customerId: customerId.value,
      status: statusFilter.value,
      paymentMethod: paymentFilter.value,
    })
    orders.value = res.data || []
    meta.value = res.meta || meta.value
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកការបញ្ជាទិញបានទេ')
  } finally {
    loading.value = false
  }
}

watch(page, load)
// Any filter change (except page itself) jumps back to page 1 — staying on
// page 3 of an unfiltered list while filtering down to a handful of
// results would just show an empty page.
watch([customerId, statusFilter, paymentFilter, pageSize], () => {
  page.value = 1
  load()
})

// Search gets its own debounced watcher (same 350ms pattern as the
// storefront Shop page) so it doesn't fire a request per keystroke.
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
  customerId.value = ''
  statusFilter.value = ''
  paymentFilter.value = ''
}

onMounted(() => {
  load()
  listPaymentMethods({ page: 1, pageSize: 50 })
    .then((res) => { paymentMethodList.value = res.data || [] })
    .catch(() => {})
})

const savingStatusFor = ref(null)
async function onStatusChange(order, newStatus) {
  const previous = order.status
  savingStatusFor.value = order.id
  order.status = newStatus
  try {
    await updateOrderStatus(order.id, newStatus)
    showToast(`បានធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ #${order.id}`)
  } catch (e) {
    order.status = previous
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  } finally {
    savingStatusFor.value = null
  }
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function paymentLabel(method) {
  if (method === 'bakong') return 'Bakong KHQR'
  if (method === 'ppcbank') return 'PPCBank KHQR'
  return 'សាច់ប្រាក់'
}

const PAYMENT_STATUS_LABELS = { unpaid: 'មិនទាន់ទូទាត់', paid: 'បានទូទាត់', failed: 'បរាជ័យ' }
function paymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status
}
const PAYMENT_STATUS_CLASSES = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}
function paymentStatusClass(status) {
  return PAYMENT_STATUS_CLASSES[status] || 'bg-cream-dark text-muted'
}
</script>
