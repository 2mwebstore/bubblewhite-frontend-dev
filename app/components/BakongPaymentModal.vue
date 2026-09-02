<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4">
        <div class="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-xl">
          <!-- KHQR banner — using the real KHQR wordmark asset, not a
               hand-recreated CSS text/border approximation. -->
          <div class="relative bg-[#E22C2C] px-6 py-6 flex justify-center" style="clip-path: polygon(0 0, 100% 0, 100% 78%, 85% 100%, 0 100%)">
            <img src="/khqr-logo.png" alt="KHQR" class="h-8 w-auto" />
          </div>

          <div class="px-6 pt-4">
            <p class="text-sm text-ink/60">{{ merchantName || 'Bubble White' }}</p>
            <p class="text-2xl font-sans font-bold">${{ amount.toFixed(2) }}</p>
          </div>

          <div class="mx-6 mt-4 border-t border-line" />

          <div class="px-6 py-5 text-center">
            <div v-if="loading" class="w-52 h-52 mx-auto rounded-card bg-cream-dark animate-pulse flex items-center justify-center">
              <Loader2 :size="24" class="animate-spin text-muted" />
            </div>
            <div v-else-if="expired" class="w-52 h-52 mx-auto rounded-card bg-cream-dark flex flex-col items-center justify-center gap-2 text-muted">
              <Clock :size="28" />
              <p class="text-sm font-medium">QR បានផុតកំណត់ពេល</p>
            </div>
            <!-- The KHQR icon is already composited into the center of this
                 image server-side (see server/api/khqr.post.js) — nothing
                 to overlay on the frontend. -->
            <img v-else-if="image" :src="image" alt="KHQR ដើម្បីទូទាត់តាម Bakong" class="w-52 h-52 mx-auto" />
            <p v-else class="text-sm text-red-600">មិនអាចបង្កើតកូដ KHQR បានទេ — សូមព្យាយាមម្តងទៀត ឬជ្រើសរើសទូទាត់ជាសាច់ប្រាក់។</p>

            <p class="text-sm text-muted mt-3">ស្កេនតាមកម្មវិធីធនាគារណាមួយ</p>

            <p v-if="!paid && !expired && image" class="text-xs mt-2" :class="secondsLeft <= 30 ? 'text-rust font-semibold' : 'text-muted'">
              នៅសល់ពេល {{ formattedTime }}
            </p>
          </div>

          <div class="border-t border-line" />

          <!-- Status / actions — deliberately NOT a clickable "already
               paid" bypass; only a real, server-verified payment ever
               enables proceeding (see the emit('paid') call in poll()
               below, the only place this ever fires from). -->
          <div class="px-6 py-4">
            <div v-if="paid" class="flex items-center justify-center gap-2 text-green-700 font-medium text-sm mb-3">
              <CheckCircle2 :size="18" /> ទទួលបានការទូទាត់ដោយជោគជ័យ!
            </div>
            <div v-else-if="expired" class="text-center text-sm text-red-600 mb-3">
              មិនអាចដាក់ការបញ្ជាទិញបានទេ លុះត្រាតែការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យ។
            </div>
            <div v-else-if="verified" class="flex items-center justify-center gap-2 text-muted text-sm mb-3">
              <Loader2 :size="14" class="animate-spin" /> កំពុងផ្ទៀងផ្ទាត់ការទូទាត់ស្វ័យប្រវត្តិ…
            </div>
            <p v-else class="text-xs text-red-600 text-center mb-3">
              មិនអាចផ្ទៀងផ្ទាត់ការទូទាត់ស្វ័យប្រវត្តិបានទេ — សូមទាក់ទងមកយើងដើម្បីបញ្ជាក់ការទូទាត់។
            </p>

            <div class="flex gap-3">
              <button type="button" class="btn-secondary flex-1" :disabled="paid" @click="onClose">
                បោះបង់
              </button>
              <button v-if="expired" type="button" class="btn-primary flex-1" @click="start">
                បង្កើត QR ថ្មី
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Loader2, CheckCircle2, Clock } from 'lucide-vue-next'
import { useKhqr } from '~/composables/useKhqr'

// A generic "scan to pay" modal — generates a real KHQR code and polls
// Bakong's Open API for real payment confirmation. 'paid' only ever fires
// from a genuine server-verified successful transaction check — there is
// no manual override, matching the requirement that an order can never be
// submitted without a confirmed successful payment.
const SCAN_SECONDS = 5 * 60 // must match server/api/khqr.post.js's expirationTimestamp

const props = defineProps({
  open: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  billNumber: { type: String, default: '' },
})
const emit = defineEmits(['close', 'paid'])

const { generateKhqr, checkKhqrStatus } = useKhqr()

const loading = ref(false)
const image = ref('')
const md5 = ref('')
// Who the customer is paying TO, not who they are — comes from the QR
// generation response (server-side BAKONG_MERCHANT_NAME), not a prop, so
// it's always accurate to whatever the current QR was actually generated
// for.
const merchantName = ref('')
const paid = ref(false)
const expired = ref(false)
// Whether the backend can actually verify payment status (Bakong Open API
// configured with BAKONG_API_EMAIL). If this is false, there is still no
// way to submit — see the template's "cannot verify" message — since
// allowing a bypass here would defeat the entire point of requiring
// verified payment.
const verified = ref(true)

const secondsLeft = ref(SCAN_SECONDS)
const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

let pollTimer = null
let countdownTimer = null
let elapsedSeconds = 0

// Bakong's Open API enforces a hard daily request cap (observed: 100
// requests/day, shared across this entire account — not per session). A
// fixed 3-second poll would burn through 100 requests in a SINGLE unpaid
// 5-minute session alone, leaving zero quota for anything else that day.
// This schedule stays responsive early on (most real customers pay within
// the first 30-60 seconds after scanning) while backing off aggressively
// for anyone who leaves the QR open without paying — a full unpaid
// 5-minute session now costs at most 18 requests, not 100.
function nextPollDelaySeconds(elapsed) {
  if (elapsed < 30) return 10 // first 30s: every 10s — catch fast payers quickly
  if (elapsed < 120) return 20 // 30s–2min: every 20s
  return 30 // 2min–5min: every 30s
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) start()
    else stop()
  }
)

async function start() {
  loading.value = true
  image.value = ''
  md5.value = ''
  paid.value = false
  expired.value = false
  verified.value = true
  secondsLeft.value = SCAN_SECONDS
  elapsedSeconds = 0
  stop()

  try {
    const res = await generateKhqr(props.amount, props.billNumber)
    image.value = res.image
    md5.value = res.md5
    merchantName.value = res.merchantName
    schedulePoll()
    countdownTimer = setInterval(tickCountdown, 1000)
  } catch {
    image.value = ''
  } finally {
    loading.value = false
  }
}

function schedulePoll() {
  const delayMs = nextPollDelaySeconds(elapsedSeconds) * 1000
  pollTimer = setTimeout(async () => {
    elapsedSeconds += delayMs / 1000
    await poll()
    // poll() itself checks paid/expired before doing anything, but this
    // guards against scheduling yet another round after either state hit
    // while the request above was in flight.
    if (!paid.value && !expired.value) schedulePoll()
  }, delayMs)
}

async function poll() {
  if (!md5.value || paid.value || expired.value) return
  try {
    const res = await checkKhqrStatus(md5.value)
    verified.value = res.verified
    if (res.paid) {
      paid.value = true
      stop()
      // Emit the MD5, not the billNumber — this is what the backend's
      // independent re-verification actually checks against (see the Go
      // backend's CheckBakongPaymentByMD5), matching the same reliable
      // mechanism this component's own polling already uses successfully.
      emit('paid', md5.value)
    }
  } catch {
    // Transient network hiccup — just try again on the next scheduled poll
    // rather than treating one failed check as a hard error.
  }
}

function tickCountdown() {
  if (secondsLeft.value <= 1) {
    secondsLeft.value = 0
    expired.value = true
    stop()
    return
  }
  secondsLeft.value -= 1
}

function stop() {
  clearTimeout(pollTimer)
  clearInterval(countdownTimer)
  pollTimer = null
  countdownTimer = null
}

function onClose() {
  if (paid.value) return
  stop()
  emit('close')
}

onUnmounted(() => stop())
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
