<template>
  <div class="max-w-3xl mx-auto px-6 py-12 md:py-16">
    <h1 class="font-sans font-bold text-2xl mb-6">រទេះទំនិញ</h1>

    <div v-if="!isLoggedIn" class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="font-medium mb-1">សូមចូលគណនីជាមុនសិន</p>
      <p class="text-sm text-muted mb-4">ដើម្បីមើលរទេះទំនិញរបស់អ្នក សូមចូលគណនីសិន។</p>
      <NuxtLink :to="{ path: '/login', query: { redirect: '/cart' } }" class="btn-primary">ចូលគណនី</NuxtLink>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-line">
        <button
          type="button"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="tab === 'cart' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'"
          @click="tab = 'cart'"
        >
          រទេះទំនិញ
        </button>
        <button
          type="button"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="tab === 'history' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'"
          @click="onOpenHistory"
        >
          ប្រវត្តិការបញ្ជាទិញ
        </button>
      </div>

      <!-- Cart tab -->
      <div v-if="tab === 'cart'">
        <div v-if="loading" class="space-y-4">
          <div v-for="n in 3" :key="n" class="h-20 rounded-card bg-cream-dark animate-pulse" />
        </div>

        <div v-else-if="!items.length" class="text-center py-16 border border-dashed border-line rounded-card">
          <p class="font-medium mb-1">រទេះទំនិញរបស់អ្នកនៅទទេ</p>
          <p class="text-sm text-muted mb-4">ចាប់ផ្តើមទិញទំនិញឥឡូវនេះ។</p>
          <NuxtLink to="/shop" class="btn-primary">ទៅកាន់ទំនិញ</NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <div v-for="item in items" :key="item.id" class="card-surface p-4 flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-cream-dark overflow-hidden shrink-0">
              <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ item.name }}</p>
              <p v-if="item.size" class="text-xs text-muted">ទំហំ: {{ item.size }}</p>
              <p class="text-sm text-rust">${{ item.price.toFixed(2) }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="w-8 h-8 rounded-full border border-line hover:bg-cream-dark" aria-label="បន្ថយចំនួន" @click="onUpdateQuantity(item, item.quantity - 1)">−</button>
              <span class="w-6 text-center text-sm">{{ item.quantity }}</span>
              <button type="button" class="w-8 h-8 rounded-full border border-line hover:bg-cream-dark" aria-label="បន្ថែមចំនួន" @click="onUpdateQuantity(item, item.quantity + 1)">+</button>
            </div>
            <button type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600 shrink-0" aria-label="លុប" @click="onRemove(item)">
              <Trash2 :size="16" :stroke-width="1.8" />
            </button>
          </div>

          <div class="card-surface p-4 space-y-2">
            <div class="flex items-center justify-between text-sm text-muted">
              <p>មធ្យម</p>
              <p>${{ subtotal.toFixed(2) }}</p>
            </div>
            <div v-if="shippingFee > 0" class="flex items-center justify-between text-sm text-muted">
              <p>ថ្លៃដឹកជញ្ជូន</p>
              <p>${{ shippingFee.toFixed(2) }}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-line">
              <p class="font-semibold">សរុប</p>
              <p class="font-sans font-bold text-xl">${{ grandTotal.toFixed(2) }}</p>
            </div>
          </div>

          <!-- Payment method -->
          <div class="card-surface p-4">
            <FormLabel text="របៀបទូទាត់" for-id="checkout-payment" />
            <p v-if="paymentMethodList && !paymentOptions.length" class="text-sm text-red-600">
              សុំទោស មិនមានវិធីទូទាត់ណាមួយអាចប្រើប្រាស់បានទេនាពេលនេះ សូមទាក់ទងមកយើង។
            </p>
            <SearchableSelect
              v-else
              v-model="paymentMethod"
              :options="paymentOptions"
              placeholder="សូមជ្រើសរើសវិធីទូទាត់"
              :clearable="false"
              :searchable="false"
            />
            <p v-if="paymentMethod" class="text-xs text-muted mt-3">
              {{ paymentMethod === 'ppcbank'
                ? 'អ្នកនឹងត្រូវបានបញ្ជូនទៅកាន់គេហទំព័រ PPCBank ដើម្បីបញ្ចប់ការទូទាត់។'
                : 'ទូទាត់ជាសាច់ប្រាក់នៅពេលទទួលទំនិញ ឬមកយកដោយផ្ទាល់។' }}
            </p>
          </div>

          <!-- Contact phone + delivery address -->
          <div class="card-surface p-4 space-y-4">
            <div>
              <FormLabel text="លេខទូរស័ព្ទទំនាក់ទំនង" required for-id="checkout-phone" />
              <input
                id="checkout-phone"
                v-model="phone"
                type="tel"
                required
                class="input-field text-sm"
                :class="fieldErrors.phone ? 'border-red-400' : ''"
              />
              <p class="text-xs text-muted mt-1">លំនាំដើមគឺលេខទូរស័ព្ទគណនីរបស់អ្នក — អាចប្តូរបានសម្រាប់ការបញ្ជាទិញនេះ។</p>
              <FieldError :message="fieldErrors.phone" />
            </div>
            <div>
              <FormLabel text="អាសយដ្ឋានដឹកជញ្ជូន" required for-id="checkout-address" />
              <textarea
                id="checkout-address"
                v-model="address"
                rows="3"
                required
                placeholder="ផ្ទះលេខ, ផ្លូវ, ភូមិ/សង្កាត់, ខណ្ឌ/ស្រុក, ខេត្ត/ក្រុង"
                class="input-field text-sm rounded-2xl"
                :class="fieldErrors.address ? 'border-red-400' : ''"
              ></textarea>
              <FieldError :message="fieldErrors.address" />
            </div>
          </div>

          <button type="button" class="btn-primary w-full" :disabled="(paymentMethodList && !paymentOptions.length) || !paymentMethod" @click="onOpenConfirm">
            ដាក់ការបញ្ជាទិញ →
          </button>
        </div>
      </div>

      <!-- Order history tab -->
      <div v-else>
        <div v-if="loadingOrders" class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
        </div>

        <div v-else-if="!orders.length" class="text-center py-16 border border-dashed border-line rounded-card">
          <p class="font-medium mb-1">អ្នកមិនទាន់មានការបញ្ជាទិញនៅឡើយទេ</p>
          <p class="text-sm text-muted">ការបញ្ជាទិញរបស់អ្នកនឹងបង្ហាញនៅទីនេះ។</p>
        </div>

        <div v-else class="space-y-3">
          <NuxtLink
            v-for="order in orders"
            :key="order.id"
            :to="`/orders/${order.reference}`"
            class="card-surface p-4 flex items-center justify-between hover:border-ink border border-transparent transition-colors"
          >
            <div>
              <p class="font-medium">{{ order.reference }}</p>
              <p class="text-xs text-muted">{{ formatDate(order.createdAt) }} · {{ paymentLabel(order.paymentMethod) }}</p>
            </div>
            <div class="text-right">
              <p class="font-sans font-bold">${{ order.total.toFixed(2) }}</p>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
            </div>
          </NuxtLink>

          <!-- Sentinel — an IntersectionObserver on this element triggers
               loading the next page as it scrolls into view, rather than
               a raw scroll listener firing on every pixel of scroll. Only
               rendered while there's genuinely more to load. -->
          <div v-if="ordersHasMore" ref="ordersSentinel" class="py-4 flex justify-center">
            <Loader2 v-if="loadingMoreOrders" :size="18" class="animate-spin text-muted" />
          </div>
        </div>
      </div>

      <!-- Order confirmation modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="confirmOpen" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="confirmOpen = false">
            <div class="bg-white rounded-card p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4">
              <p class="font-sans font-bold text-lg">សូមពិនិត្យការបញ្ជាទិញរបស់អ្នក</p>

              <div class="space-y-3">
                <div v-for="item in items" :key="item.id" class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg bg-cream-dark overflow-hidden shrink-0">
                    <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ item.name }}</p>
                    <p class="text-xs text-muted">{{ item.size ? `ទំហំ: ${item.size} · ` : '' }}x{{ item.quantity }}</p>
                  </div>
                  <p class="text-sm font-medium shrink-0">${{ (item.price * item.quantity).toFixed(2) }}</p>
                </div>
              </div>

              <div class="border-t border-line pt-3 space-y-1.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted">លេខទូរស័ព្ទ</span>
                  <span class="font-medium">{{ phone }}</span>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <span class="text-muted shrink-0">អាសយដ្ឋាន</span>
                  <span class="font-medium text-right">{{ address }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted">របៀបទូទាត់</span>
                  <span class="font-medium">{{ paymentLabel(paymentMethod) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted">មធ្យម</span>
                  <span class="font-medium">${{ subtotal.toFixed(2) }}</span>
                </div>
                <div v-if="shippingFee > 0" class="flex items-center justify-between">
                  <span class="text-muted">ថ្លៃដឹកជញ្ជូន</span>
                  <span class="font-medium">${{ shippingFee.toFixed(2) }}</span>
                </div>
                <div class="flex items-center justify-between font-semibold pt-1.5 border-t border-line">
                  <span>សរុប</span>
                  <span class="font-sans font-bold text-lg">${{ grandTotal.toFixed(2) }}</span>
                </div>
              </div>

              <p v-if="checkoutError" class="text-sm text-red-600">{{ checkoutError }}</p>

              <div class="flex gap-3 pt-1">
                <button type="button" class="btn-secondary flex-1" :disabled="checkingOut" @click="confirmOpen = false">
                  កែប្រែ
                </button>
                <button type="button" class="btn-primary flex-1" :disabled="checkingOut" @click="onConfirmSummary">
                  <Loader2 v-if="checkingOut" :size="16" class="animate-spin" />
                  {{ checkingOut
                    ? 'កំពុងដាក់ការបញ្ជាទិញ…'
                    : paymentMethod === 'ppcbank'
                    ? 'បន្ទាប់ →'
                    : 'បញ្ជាក់ការបញ្ជាទិញ' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Trash2, Loader2, Landmark, Banknote } from 'lucide-vue-next'
import { useCart } from '~/composables/useCart'
import { useOrders } from '~/composables/useOrders'
import { useCustomerAuth } from '~/composables/useCustomerAuth'
import { useStore } from '~/composables/useStore'
import { useFieldErrors } from '~/composables/useFieldErrors'
import { useSiteSettings } from '~/composables/useSiteSettings'
import { usePaymentMethods } from '~/composables/usePaymentMethods'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'

useSeoMeta({ title: 'រទេះទំនិញ | Bubble White' })

const router = useRouter()
const route = useRoute()
const { state, isLoggedIn } = useCustomerAuth()
const { items, subtotal, loading, fetchCart, updateQuantity, removeItem } = useCart()
// Same module-level caching pattern as usePaymentMethods — shared across
// every page that needs settings, not re-fetched per component.
const { settings: siteSettings, ensureLoaded: ensureSiteSettingsLoaded } = useSiteSettings()
const shippingFee = computed(() => siteSettings.value?.shippingFee || 0)
const grandTotal = computed(() => subtotal.value + shippingFee.value)
const { checkout, initiatePPCBankCheckout, getPPCBankReturnStatus, listOrders } = useOrders()
const { showToast } = useStore()
const { fieldErrors, setFromError, clear: clearFieldError, watchField } = useFieldErrors()

const tab = ref('cart')
// Fallback icons for any payment method without an admin-uploaded logo
// yet (see /admin/payment_method) — generic, not brand-specific, since no
// official PPCBank logo files are available to this codebase.
const FALLBACK_ICONS = { ppcbank: Landmark, cash: Banknote }

// Payment options now come from the real, admin-managed payment methods
// table (see /admin/payment_method), not hardcoded booleans — this is a
// UI convenience only; the backend independently re-checks at checkout
// (see OrderService.Checkout / InitiatePPCBankCheckout), so a stale
// cached value here can never actually let a disabled method through.
const { methods: paymentMethodList, ensureLoaded: ensurePaymentMethodsLoaded } = usePaymentMethods()
const paymentOptions = computed(() => {
  const list = paymentMethodList.value
  // No static fallback — while the real list hasn't loaded yet (or if
  // the fetch fails), this is genuinely empty rather than showing
  // hardcoded options that might not reflect what's actually enabled.
  if (!list) return []
  return list.map((pm) => ({
    value: pm.code,
    label: pm.name,
    icon: pm.imageUrl || FALLBACK_ICONS[pm.code],
  }))
})
// Empty by default — the customer must explicitly choose a payment
// method (see the SearchableSelect's placeholder below), rather than one
// being silently pre-selected for them.
const paymentMethod = ref('')
const address = ref('')
// Defaults to the customer's account phone, but stays fully editable per
// order — e.g. ordering for delivery to someone else's number.
const phone = ref('')
const checkingOut = ref(false)
const checkoutError = ref('')
const confirmOpen = ref(false)

watchField(address, 'address')
watchField(phone, 'phone')

// Client-only page (see nuxt.config.ts) — fetch happens after mount, same
// reasoning as account.vue: customer auth can't be verified during SSR.
onMounted(async () => {
  // A ?billNumber= here means PPCBank redirected the customer to THIS
  // page after payment (e.g. if PPCBANK_SUCCESS_URL/ERROR_URL on the
  // backend is configured to point at /cart rather than the dedicated
  // /orders/ppcbank-return page). The cart page itself isn't built to
  // display order/payment status, so this actively re-verifies with
  // PPCBank, then redirects to the actual order detail page — a single
  // consistent place customers see their payment result, regardless of
  // which URL PPCBank happens to be configured to send them back to.
  const billNumber = route.query.billNumber
  if (billNumber) {
    try {
      const res = await getPPCBankReturnStatus(billNumber)
      if (res?.data?.reference) {
        router.replace(`/orders/${res.data.reference}`)
        return
      }
    } catch {
      // Fall through to the normal cart view — the dedicated return page
      // remains the more complete way to see this same status if this
      // lookup fails for some reason.
    }
  }

  if (isLoggedIn.value) {
    fetchCart()
    phone.value = state.customer?.phone || ''
  }
  ensurePaymentMethodsLoaded()
  ensureSiteSettingsLoaded()
})

// If the currently-selected method becomes unavailable (e.g. an admin
// disables it while the customer is mid-checkout), reset to empty rather
// than silently auto-picking a different one — the customer should
// always be the one to explicitly choose, never have it chosen for them.
watch(paymentOptions, (opts) => {
  if (paymentMethod.value && !opts.some((o) => o.value === paymentMethod.value)) {
    paymentMethod.value = ''
  }
})

async function onUpdateQuantity(item, quantity) {
  try {
    await updateQuantity(item.id, quantity)
  } catch (e) {
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

async function onRemove(item) {
  try {
    await removeItem(item.id)
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបបានទេ')
  }
}

// The phone/address inputs aren't inside a real <form>, so their `required`
// attributes are purely decorative — this is the actual validation gate
// before the confirmation modal (showing blank/incomplete order details in
// a "please confirm" modal would be worse than not opening it at all).
function onOpenConfirm() {
  clearFieldError()
  const errors = {}
  if (!phone.value.trim()) errors.phone = 'សូមបញ្ចូលលេខទូរស័ព្ទ'
  if (!address.value.trim()) errors.address = 'សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូន'
  if (Object.keys(errors).length) {
    fieldErrors.value = errors
    return
  }
  checkoutError.value = ''
  confirmOpen.value = true
}

// Cash: this button places the order directly. PPCBank: it instead
// redirects to PPCBank's hosted payment page (see onPPCBankCheckout).
function onConfirmSummary() {
  if (paymentMethod.value === 'ppcbank') {
    onPPCBankCheckout()
    return
  }
  onCheckout()
}

// PPCBank's flow redirects the customer away from this site entirely —
// unlike cash, there's no "come back and see it worked" moment
// on this page; the order is created (pending) server-side BEFORE the
// redirect, then PPCBank sends the customer to /orders/ppcbank-return
// once they've paid (or bailed), which is what actually confirms status.
async function onPPCBankCheckout() {
  checkoutError.value = ''
  clearFieldError()
  checkingOut.value = true
  try {
    const res = await initiatePPCBankCheckout(address.value, phone.value)
    window.location.href = res.data.paymentURL
    // Deliberately no further code here — the browser is navigating away.
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      checkoutError.value = e.message || 'មិនអាចបញ្ជូនទៅ PPCBank បានទេ'
    }
    checkingOut.value = false
    // confirmOpen deliberately stays true — checkoutError displays inside
    // this same modal, same as the direct cash checkout path. Only the
    // SUCCESS path leaves the modal state behind, since the browser is
    // navigating away entirely at that point.
  }
}

// Cash-only now — Bakong (the only other caller of this function) was
// removed; PPCBank has its own separate flow (onPPCBankCheckout) since it
// redirects away from the site entirely rather than confirming in-page.
async function onCheckout() {
  checkoutError.value = ''
  clearFieldError()
  checkingOut.value = true
  try {
    const res = await checkout(paymentMethod.value, address.value, phone.value)
    showToast('បានដាក់ការបញ្ជាទិញដោយជោគជ័យ')
    router.push(`/orders/${res.data.reference}`)
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      checkoutError.value = e.message || 'មិនអាចដាក់ការបញ្ជាទិញបានទេ'
    }
  } finally {
    checkingOut.value = false
  }
}

// --- Order history — paginated, with infinite scroll loading further
// pages as the sentinel element scrolls into view. ---
const orders = ref([])
const loadingOrders = ref(false)
const loadingMoreOrders = ref(false)
const ordersPage = ref(1)
const ordersHasMore = ref(true)
const ordersSentinel = ref(null)
let ordersLoaded = false
let ordersObserver = null

async function onOpenHistory() {
  tab.value = 'history'
  if (ordersLoaded) return
  loadingOrders.value = true
  try {
    const res = await listOrders({ page: 1, pageSize: 10 })
    orders.value = res.data || []
    ordersPage.value = 1
    ordersHasMore.value = res.meta ? res.meta.page < res.meta.totalPage : false
    ordersLoaded = true
    await nextTick()
    setupOrdersObserver()
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកប្រវត្តិការបញ្ជាទិញបានទេ')
  } finally {
    loadingOrders.value = false
  }
}

// IntersectionObserver on the sentinel div — fires loadMoreOrders() once
// it scrolls into view, rather than a raw window scroll listener firing
// on every pixel scrolled. Watches ordersSentinel directly since it only
// exists in the DOM once the history tab is open and has results.
function setupOrdersObserver() {
  if (ordersObserver) ordersObserver.disconnect()
  if (!ordersSentinel.value) return
  ordersObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMoreOrders()
  })
  ordersObserver.observe(ordersSentinel.value)
}

async function loadMoreOrders() {
  if (loadingMoreOrders.value || !ordersHasMore.value) return
  loadingMoreOrders.value = true
  try {
    const nextPage = ordersPage.value + 1
    const res = await listOrders({ page: nextPage, pageSize: 10 })
    orders.value = [...orders.value, ...(res.data || [])]
    ordersPage.value = nextPage
    ordersHasMore.value = res.meta ? res.meta.page < res.meta.totalPage : false
    // Re-observe the sentinel — it moved further down the DOM now that
    // more results were appended above it, but the observer still needs
    // to watch the same element reference for the NEXT page too.
    await nextTick()
    setupOrdersObserver()
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកទំព័របន្ថែមបានទេ')
  } finally {
    loadingMoreOrders.value = false
  }
}

onBeforeUnmount(() => {
  if (ordersObserver) ordersObserver.disconnect()
})

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function paymentLabel(method) {
  if (method === 'bakong') return 'Bakong KHQR'
  if (method === 'ppcbank') return 'PPCBank KHQR'
  return 'សាច់ប្រាក់'
}

const STATUS_LABELS = {
  pending: 'កំពុងរង់ចាំ',
  confirmed: 'បានបញ្ជាក់',
  shipped: 'កំពុងដឹកជញ្ជូន',
  completed: 'បានបញ្ចប់',
  cancelled: 'បានលុបចោល',
}
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