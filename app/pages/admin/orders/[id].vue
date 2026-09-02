<template>
  <div class="max-w-2xl">
    <NuxtLink to="/admin/orders" class="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-4">
      <ChevronLeft :size="16" /> ត្រឡប់ទៅការបញ្ជាទិញ
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-40 rounded bg-cream-dark animate-pulse" />
      <div v-for="n in 2" :key="n" class="h-20 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <template v-else-if="order">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="font-sans font-bold text-2xl mb-1">{{ order.reference }}</h1>
          <p class="text-sm text-muted">
            {{ formatDate(order.createdAt) }} ·
            <NuxtLink :to="`/admin/customers/${order.customerId}`" class="text-rust hover:underline">{{ order.phone }}</NuxtLink>
          </p>
        </div>
      </div>

      <div class="card-surface p-4 mb-4 space-y-4">
        <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-lg bg-cream-dark overflow-hidden shrink-0">
            <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ item.name }}</p>
            <p class="text-xs text-muted">{{ item.size ? `ទំហំ: ${item.size} · ` : '' }}x{{ item.quantity }}</p>
          </div>
          <p class="text-sm font-medium shrink-0">${{ (item.price * item.quantity).toFixed(2) }}</p>
        </div>
      </div>

      <div class="card-surface p-4 space-y-2 mb-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">របៀបទូទាត់</span>
          <span class="font-medium">{{ paymentLabel(order.paymentMethod) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">ស្ថានភាពទូទាត់</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="paymentStatusClass(order.paymentStatus)">{{ paymentStatusLabel(order.paymentStatus) }}</span>
            <button
              v-if="['bakong', 'ppcbank'].includes(order.paymentMethod) && order.paymentStatus !== 'paid' && hasPermission('order.manage')"
              type="button"
              class="text-xs text-rust hover:underline disabled:opacity-50"
              :disabled="verifyingPayment"
              @click="onVerifyPayment"
            >
              {{ verifyingPayment ? 'កំពុងផ្ទៀងផ្ទាត់…' : `ផ្ទៀងផ្ទាត់ជាមួយ ${paymentLabel(order.paymentMethod)}` }}
            </button>
          </div>
        </div>
        <div v-if="order.invoice" class="flex items-center justify-between text-sm">
          <span class="text-muted">លេខតម្រុយធនាគារ (Invoice)</span>
          <span class="font-medium font-mono text-xs">{{ order.invoice }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">លេខទូរស័ព្ទ</span>
          <span class="font-medium">{{ order.phone }}</span>
        </div>
        <div class="flex items-start justify-between text-sm gap-4">
          <span class="text-muted shrink-0">អាសយដ្ឋានដឹកជញ្ជូន</span>
          <span class="font-medium text-right">{{ order.address }}</span>
        </div>
        <div class="flex items-center justify-between font-semibold pt-2 border-t border-line">
          <span>សរុប</span>
          <span class="font-sans font-bold text-lg">${{ order.total.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Full Bakong transaction detail (check_transaction_by_hash) —
           richer than the plain paid/unpaid status above: which bank the
           money actually came from and landed in, plus timestamps. Only
           available once a transaction hash has actually been captured
           (i.e. the order was successfully verified paid at least once). -->
      <div v-if="order.paymentMethod === 'bakong'" class="card-surface p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold">ព័ត៌មានលម្អិតប្រតិបត្តិការ Bakong</p>
          <button
            type="button"
            class="text-xs text-rust hover:underline disabled:opacity-50"
            :disabled="loadingTxDetail"
            @click="onLoadTransactionDetail"
          >
            {{ loadingTxDetail ? 'កំពុងផ្ទុក…' : 'មើលព័ត៌មានលម្អិត' }}
          </button>
        </div>
        <p v-if="txDetailError" class="text-xs text-red-600">{{ txDetailError }}</p>
        <div v-else-if="txDetail" class="space-y-1.5 text-sm">
          <!-- Explicit, server-computed check — not something the admin
               has to eyeball themselves by comparing account IDs. -->
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-2"
            :class="txDetail.accountMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            <CheckCircle2 v-if="txDetail.accountMatch" :size="14" />
            <AlertTriangle v-else :size="14" />
            {{ txDetail.accountMatch
              ? 'ការទូទាត់នេះបានចូលទៅគណនីត្រឹមត្រូវរបស់ហាង'
              : 'ការព្រមាន៖ គណនីអ្នកទទួលមិនត្រូវគ្នានឹងគណនីដែលបានកំណត់ទេ' }}
          </div>

          <div class="flex items-center justify-between">
            <span class="text-muted">គណនីអ្នកផ្ញើ</span>
            <span class="font-medium">{{ txDetail.fromAccountId }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted">គណនីអ្នកទទួល</span>
            <span class="font-medium">{{ txDetail.toAccountId }}</span>
          </div>
          <div v-if="txDetail.trackingStatus" class="flex items-center justify-between">
            <span class="text-muted">ស្ថានភាពតាមដាន</span>
            <span class="font-medium">{{ txDetail.trackingStatus }}</span>
          </div>
          <div v-if="txDetail.receiverBank" class="flex items-center justify-between">
            <span class="text-muted">ធនាគារអ្នកទទួល</span>
            <span class="font-medium">{{ txDetail.receiverBank }}</span>
          </div>
          <div v-if="txDetail.receiverBankAccount" class="flex items-center justify-between">
            <span class="text-muted">គណនីធនាគារអ្នកទទួល</span>
            <span class="font-medium">{{ txDetail.receiverBankAccount }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted">ចំនួនទឹកប្រាក់</span>
            <span class="font-medium">{{ txDetail.amount }} {{ txDetail.currency }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted">ពេលទូទាត់</span>
            <span class="font-medium">{{ formatMs(txDetail.acknowledgedDateMs) }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-muted">ចុច "មើលព័ត៌មានលម្អិត" ដើម្បីទាញយកព័ត៌មានប្រតិបត្តិការពេញលេញពី Bakong។</p>
      </div>

      <div v-if="hasPermission('order.manage')" class="card-surface p-4">
        <p class="text-sm font-semibold mb-3">ស្ថានភាព</p>
        <SearchableSelect
          v-model="statusValue"
          :options="statusOptions"
          :clearable="false"
          :searchable="false"
          class="sm:w-56"
          @update:model-value="onStatusChange"
        />
      </div>
    </template>

    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">រកមិនឃើញការបញ្ជាទិញនេះទេ។</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'order.view' })

import { ref, onMounted } from 'vue'
import { ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import { useAdminOrders } from '~/composables/useAdminOrders'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'

const route = useRoute()
const { getOrder, updateOrderStatus, verifyPayment, getTransactionDetail } = useAdminOrders()
const { hasPermission } = useAuth()
const { showToast } = useStore()

const order = ref(null)
const loading = ref(true)
const statusValue = ref('')
const verifyingPayment = ref(false)
const txDetail = ref(null)
const txDetailError = ref('')
const loadingTxDetail = ref(false)

const statusOptions = [
  { value: 'pending', label: 'កំពុងរង់ចាំ' },
  { value: 'confirmed', label: 'បានបញ្ជាក់' },
  { value: 'shipped', label: 'កំពុងដឹកជញ្ជូន' },
  { value: 'completed', label: 'បានបញ្ចប់' },
  { value: 'cancelled', label: 'បានលុបចោល' },
]

onMounted(async () => {
  try {
    const res = await getOrder(route.params.id)
    order.value = res.data
    statusValue.value = res.data.status
  } catch (e) {
    order.value = null
  } finally {
    loading.value = false
  }
})

async function onStatusChange(newStatus) {
  const previous = order.value.status
  try {
    await updateOrderStatus(route.params.id, newStatus)
    order.value.status = newStatus
    showToast('បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពរួចរាល់')
  } catch (e) {
    statusValue.value = previous
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

async function onVerifyPayment() {
  verifyingPayment.value = true
  try {
    const res = await verifyPayment(route.params.id)
    order.value.paymentStatus = res.data.paymentStatus
    order.value.invoice = res.data.invoice
    const methodLabel = paymentLabel(order.value.paymentMethod)
    showToast(
      res.data.paymentStatus === 'paid'
        ? `${methodLabel} បញ្ជាក់ថាបានទទួលការទូទាត់ហើយ`
        : `${methodLabel} មិនទាន់បញ្ជាក់ការទូទាត់នេះនៅឡើយទេ`
    )
  } catch (e) {
    showToast(e.message || 'មិនអាចផ្ទៀងផ្ទាត់ការទូទាត់បានទេ')
  } finally {
    verifyingPayment.value = false
  }
}

async function onLoadTransactionDetail() {
  txDetailError.value = ''
  loadingTxDetail.value = true
  try {
    const res = await getTransactionDetail(route.params.id)
    txDetail.value = res.data
  } catch (e) {
    txDetailError.value = e.message || 'មិនអាចទាញយកព័ត៌មានលម្អិតបានទេ'
  } finally {
    loadingTxDetail.value = false
  }
}

function formatMs(ms) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
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
