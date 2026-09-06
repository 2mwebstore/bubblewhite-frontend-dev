<template>
  <div class="max-w-lg mx-auto text-center py-12 px-4">
    <div v-if="loading" class="space-y-4">
      <Loader2 :size="32" class="animate-spin mx-auto text-muted" />
      <p class="text-sm text-muted">កំពុងផ្ទៀងផ្ទាត់ការទូទាត់របស់អ្នក…</p>
    </div>

    <template v-else-if="order">
      <div v-if="order.paymentStatus === 'paid'" class="space-y-4">
        <div class="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
          <CheckCircle2 :size="32" />
        </div>
        <h1 class="font-sans font-bold text-2xl">ការទូទាត់បានជោគជ័យ!</h1>
        <p class="text-sm text-muted">{{ order.reference }} — អរគុណសម្រាប់ការបញ្ជាទិញ។</p>
        <NuxtLink :to="`/orders/${order.reference}`" class="btn-primary inline-block">
          មើលការបញ្ជាទិញ
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Clock :size="32" />
        </div>
        <h1 class="font-sans font-bold text-2xl">មិនទាន់ទទួលបានការទូទាត់ទេ</h1>
        <p class="text-sm text-muted">
          {{ order.reference }} — ប្រសិនបើអ្នកបានទូទាត់រួចហើយ សូមចាំបន្តិច ហើយចុច "ពិនិត្យម្តងទៀត" ខាងក្រោម។
          ការបញ្ជាទិញនេះនឹងមិនត្រូវបានបញ្ជូនទេ រហូតដល់ការទូទាត់ត្រូវបានបញ្ជាក់។
        </p>
        <div class="flex items-center justify-center gap-3">
          <button type="button" class="btn-secondary" :disabled="rechecking" @click="onRecheck">
            {{ rechecking ? 'កំពុងពិនិត្យ…' : 'ពិនិត្យម្តងទៀត' }}
          </button>
          <NuxtLink to="/cart" class="btn-primary">
            ត្រឡប់ទៅរទេះទំនិញ
          </NuxtLink>
        </div>
      </div>
    </template>

    <div v-else class="space-y-4">
      <div class="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" />
      </div>
      <h1 class="font-sans font-bold text-2xl">រកមិនឃើញការបញ្ជាទិញនេះទេ</h1>
      <p class="text-sm text-muted">{{ error || 'សូមព្យាយាមម្តងទៀត ឬទាក់ទងមកយើង។' }}</p>
      <NuxtLink to="/cart" class="btn-primary inline-block">ត្រឡប់ទៅរទេះទំនិញ</NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

import { ref, onMounted } from 'vue'
import { Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-vue-next'
import { useOrders } from '~/composables/useOrders'

useSeoMeta({ title: 'ស្ថានភាពការទូទាត់ | Bubble White' })

const route = useRoute()
const { getPPCBankReturnStatus } = useOrders()

const loading = ref(true)
const rechecking = ref(false)
const order = ref(null)
const error = ref('')

async function loadStatus() {
  const billNumber = route.query.billNumber
  if (!billNumber) {
    error.value = 'លេខយោងការបញ្ជាទិញមិនត្រឹមត្រូវទេ'
    loading.value = false
    return
  }
  try {
    const res = await getPPCBankReturnStatus(billNumber)
    order.value = res.data
  } catch (e) {
    error.value = e.message || ''
    order.value = null
  } finally {
    loading.value = false
  }
}

async function onRecheck() {
  rechecking.value = true
  await loadStatus()
  rechecking.value = false
}

// customer auth can't be verified during SSR — same reasoning as the
// rest of the account/orders pages (this route is already ssr:false via
// nuxt.config.ts's /orders/** rule).
onMounted(loadStatus)
</script>
