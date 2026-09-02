<template>
  <div class="max-w-2xl">
    <NuxtLink to="/admin/customers" class="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-4">
      <ChevronLeft :size="16" /> ត្រឡប់ទៅអតិថិជន
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-40 rounded bg-cream-dark animate-pulse" />
      <div v-for="n in 2" :key="n" class="h-20 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <template v-else-if="customer">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="font-sans font-bold text-2xl mb-1">{{ customer.name }}</h1>
          <p class="text-sm text-muted">អតិថិជន #{{ customer.id }} · ចូលរួមតាំងពី {{ formatDate(customer.createdAt) }}</p>
        </div>
        <span class="text-xs font-semibold px-3 py-1 rounded-full" :class="customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ customer.isActive ? 'សកម្ម' : 'ផ្អាក' }}
        </span>
      </div>

      <div class="card-surface p-4 space-y-2 mb-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">លេខទូរស័ព្ទ</span>
          <span class="font-medium">{{ customer.phone }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">អ៊ីមែល</span>
          <span class="font-medium">{{ customer.email || '—' }}</span>
        </div>
      </div>

      <div v-if="hasPermission('customer.manage')" class="card-surface p-4 mb-6 flex flex-wrap items-center gap-3">
        <button type="button" class="btn-secondary" @click="openResetPassword">
          <KeyRound :size="16" :stroke-width="1.8" /> កំណត់ពាក្យសម្ងាត់ថ្មី
        </button>
        <button type="button" class="btn-secondary" @click="onToggleActive">
          {{ customer.isActive ? 'ផ្អាកគណនី' : 'បើកគណនីវិញ' }}
        </button>
      </div>

      <h2 class="font-sans font-bold text-lg mb-4">ប្រវត្តិការបញ្ជាទិញ</h2>
      <div v-if="loadingOrders" class="space-y-3">
        <div v-for="n in 2" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
      </div>
      <div v-else-if="!orders.length" class="text-center py-10 border border-dashed border-line rounded-card">
        <p class="text-sm text-muted">អតិថិជននេះមិនទាន់មានការបញ្ជាទិញនៅឡើយទេ។</p>
      </div>
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="`/admin/orders/${order.id}`"
          class="card-surface p-4 flex items-center justify-between hover:border-ink border border-transparent transition-colors"
        >
          <div>
            <p class="font-medium">លេខការបញ្ជាទិញ #{{ order.id }}</p>
            <p class="text-xs text-muted">{{ formatDateTime(order.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="font-sans font-bold">${{ order.total.toFixed(2) }}</p>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
          </div>
        </NuxtLink>
      </div>
    </template>

    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">រកមិនឃើញអតិថិជននេះទេ។</p>
    </div>

    <!-- Reset password modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="resetOpen" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="resetOpen = false">
          <form class="bg-white rounded-card p-6 w-full max-w-sm space-y-4" @submit.prevent="submitReset">
            <p class="font-semibold">កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ {{ customer?.name }}</p>
            <p class="text-xs text-muted">មិនចាំបាច់ដឹងពាក្យសម្ងាត់ចាស់ទេ — នេះជាសកម្មភាពរបស់អ្នកគ្រប់គ្រង។</p>
            <div>
              <FormLabel text="ពាក្យសម្ងាត់ថ្មី" required for-id="reset-password" />
              <input id="reset-password" v-model="resetPasswordValue" type="password" required minlength="6" class="input-field text-sm" />
            </div>
            <p v-if="resetError" class="text-sm text-red-600">{{ resetError }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="resetOpen = false">បោះបង់</button>
              <button type="submit" class="btn-primary" :disabled="resetSaving">{{ resetSaving ? 'កំពុងរក្សាទុក…' : 'កំណត់ពាក្យសម្ងាត់' }}</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'customer.view' })

import { ref, onMounted } from 'vue'
import { ChevronLeft, KeyRound } from 'lucide-vue-next'
import { useAdminCustomers } from '~/composables/useAdminCustomers'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'

const route = useRoute()
const { getCustomer, getCustomerOrders, resetCustomerPassword, setCustomerActive } = useAdminCustomers()
const { hasPermission } = useAuth()
const { showToast } = useStore()

const customer = ref(null)
const loading = ref(true)
const orders = ref([])
const loadingOrders = ref(true)

onMounted(async () => {
  try {
    const res = await getCustomer(route.params.id)
    customer.value = res.data
  } catch {
    customer.value = null
  } finally {
    loading.value = false
  }

  try {
    const res = await getCustomerOrders(route.params.id)
    orders.value = res.data || []
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកប្រវត្តិការបញ្ជាទិញបានទេ')
  } finally {
    loadingOrders.value = false
  }
})

async function onToggleActive() {
  const next = !customer.value.isActive
  try {
    await setCustomerActive(customer.value.id, next)
    customer.value.isActive = next
    showToast(next ? 'បានបើកគណនីវិញ' : 'បានផ្អាកគណនី')
  } catch (e) {
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

const resetOpen = ref(false)
const resetPasswordValue = ref('')
const resetSaving = ref(false)
const resetError = ref('')

function openResetPassword() {
  resetOpen.value = true
  resetPasswordValue.value = ''
  resetError.value = ''
}

async function submitReset() {
  resetError.value = ''
  resetSaving.value = true
  try {
    await resetCustomerPassword(customer.value.id, resetPasswordValue.value)
    showToast(`បានកំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ "${customer.value.name}"`)
    resetOpen.value = false
  } catch (e) {
    resetError.value = e.message || 'មិនអាចកំណត់ពាក្យសម្ងាត់បានទេ'
  } finally {
    resetSaving.value = false
  }
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABELS = { pending: 'កំពុងរង់ចាំ', confirmed: 'បានបញ្ជាក់', shipped: 'កំពុងដឹកជញ្ជូន', completed: 'បានបញ្ចប់', cancelled: 'បានលុបចោល' }
function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

const STATUS_CLASSES = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}
function statusClass(status) {
  return STATUS_CLASSES[status] || 'bg-cream-dark text-muted'
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
