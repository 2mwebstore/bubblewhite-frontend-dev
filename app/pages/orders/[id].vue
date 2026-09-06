<template>
  <div class="max-w-2xl mx-auto px-6 py-12 md:py-16">
    <NuxtLink to="/cart" class="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-6">
      <ChevronLeft :size="16" /> ត្រឡប់ទៅរទេះទំនិញ
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-40 rounded bg-cream-dark animate-pulse" />
      <div v-for="n in 2" :key="n" class="h-20 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="!order" class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="font-medium mb-1">រកមិនឃើញការបញ្ជាទិញនេះទេ</p>
      <NuxtLink to="/cart" class="btn-primary mt-4">ត្រឡប់ទៅរទេះទំនិញ</NuxtLink>
    </div>

    <template v-else>
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="font-sans font-bold text-2xl mb-1">{{ order.reference }}</h1>
          <p class="text-sm text-muted">{{ formatDate(order.createdAt) }}</p>
        </div>
        <span class="text-xs font-semibold px-3 py-1 rounded-full" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
      </div>

      <div class="card-surface p-4 mb-4 space-y-4">
        <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-lg bg-cream-dark overflow-hidden shrink-0">
            <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ item.name }}</p>
            <p v-if="item.size" class="text-xs text-muted">ទំហំ: {{ item.size }} · x{{ item.quantity }}</p>
            <p v-else class="text-xs text-muted">x{{ item.quantity }}</p>
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
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="paymentStatusClass(order.paymentStatus)">{{ paymentStatusLabel(order.paymentStatus) }}</span>
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

      <p class="text-xs text-muted text-center">
        មានសំណួរអំពីការបញ្ជាទិញនេះ? <NuxtLink to="/contact" class="text-rust hover:underline">ទាក់ទងមកយើង</NuxtLink>
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useOrders } from '~/composables/useOrders'
import { useCustomerAuth } from '~/composables/useCustomerAuth'
import {
  paymentLabel,
  paymentStatusLabel,
  paymentStatusClass,
  statusLabel,
  statusClass,
  formatOrderDateTime as formatDate,
} from '~/composables/useOrderDisplay'

useSeoMeta({ title: 'ព័ត៌មានលម្អិតការបញ្ជាទិញ | Bubble White' })

const route = useRoute()
const router = useRouter()
const { getOrder, getPPCBankReturnStatus } = useOrders()
const { isLoggedIn } = useCustomerAuth()

const order = ref(null)
const loading = ref(true)

// Client-only page (see nuxt.config.ts) — same reasoning as /cart and
// /account: customer auth is localStorage-only, can't be verified at SSR.
onMounted(async () => {
  if (!isLoggedIn.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  // A ?billNumber= query param means PPCBank just redirected the customer
  // HERE after payment (if their configured successURL/errorURL points at
  // an order detail page directly, rather than the dedicated
  // /orders/ppcbank-return page) — actively re-verify with PPCBank rather
  // than showing a possibly-stale "unpaid" status from before they paid.
  const billNumber = route.query.billNumber
  if (billNumber) {
    try {
      const res = await getPPCBankReturnStatus(billNumber)
      order.value = res.data
    } catch {
      order.value = null
    } finally {
      loading.value = false
    }
    return
  }

  try {
    const res = await getOrder(parseOrderIdParam(route.params.id))
    order.value = res.data
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
})

// Accepts either the raw numeric ID ("36") or the customer-facing
// reference ("BW-000036") — the page URL now uses the reference format by
// default (matching what the customer sees everywhere else: order
// history, confirmations, the page itself), but this keeps any
// old/bookmarked numeric links working too.
function parseOrderIdParam(param) {
  const match = String(param).match(/^BW-(\d+)$/i)
  return match ? String(Number(match[1])) : param
}
</script>
