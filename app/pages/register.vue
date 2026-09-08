<template>
  <div class="max-w-sm mx-auto px-6 py-16 md:py-24">
    <h1 class="font-sans font-bold text-2xl mb-1 text-center">បង្កើតគណនី</h1>
    <p class="text-sm text-muted text-center mb-8">ចូលរួមជាមួយ BubbleWhite</p>

    <!-- Step 1: the full form — nothing is created yet, just validated
         and held until phone verification (step 2) confirms it. -->
    <form v-if="!otpSent" class="card-surface p-6 space-y-4" @submit.prevent="submit">
      <div>
        <FormLabel text="ឈ្មោះពេញ" required for-id="reg-name" />
        <input
          id="reg-name"
          v-model="form.name"
          type="text"
          required
          autocomplete="name"
          class="input-field text-sm"
          :class="fieldErrors.name ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.name" />
      </div>
      <div>
        <FormLabel text="លេខទូរស័ព្ទ" required for-id="reg-phone" />
        <input
          id="reg-phone"
          v-model="form.phone"
          type="tel"
          required
          autocomplete="tel"
          class="input-field text-sm"
          :class="fieldErrors.phone ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.phone" />
      </div>
      <div>
        <FormLabel text="អ៊ីមែល (ស្រេចចិត្ត)" for-id="reg-email" />
        <input
          id="reg-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          class="input-field text-sm"
          :class="fieldErrors.email ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.email" />
      </div>
      <div>
        <FormLabel text="ពាក្យសម្ងាត់" required for-id="reg-password" />
        <input
          id="reg-password"
          v-model="form.password"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          class="input-field text-sm"
          :class="fieldErrors.password ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.password" />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងផ្ញើលេខកូដ…' : 'បន្ត' }}
      </button>
    </form>

    <!-- Step 2: phone verification — the final step. Verifying here
         actually creates the account (see the backend's own VerifyOTP,
         which does this the instant the code is confirmed), not a
         separate submission the customer has to make afterward. -->
    <div v-else class="card-surface p-6">
      <p class="text-sm text-muted mb-4">សូមផ្ទៀងផ្ទាត់លេខទូរស័ព្ទរបស់អ្នកដើម្បីបញ្ចប់ការចុះឈ្មោះ</p>
      <OtpCodeEntry
        :phone="form.phone"
        :channel="channel"
        :telegram-link-url="telegramLinkUrl"
        @verified="onVerified"
        @change-phone="otpSent = false"
      />
    </div>

    <div v-if="!otpSent && showSocialLogin" class="flex items-center gap-3 my-6">
      <div class="flex-1 h-px bg-line" />
      <span class="text-xs text-muted">ឬ</span>
      <div class="flex-1 h-px bg-line" />
    </div>

    <div v-if="!otpSent && showSocialLogin" class="flex items-center justify-center gap-4">
      <GoogleSignInButton @success="onSocialSuccess" @error="onSocialError" />
      <FacebookSignInButton @success="onSocialSuccess" @error="onSocialError" />
    </div>

    <p v-if="!otpSent" class="text-sm text-muted text-center mt-6">
      មានគណនីរួចហើយ?
      <NuxtLink :to="{ path: '/login', query: route.query }" class="text-rust font-medium hover:underline">ចូលគណនី</NuxtLink>
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useCustomerAuth } from '~/composables/useCustomerAuth'
import { useCart } from '~/composables/useCart'
import { useFieldErrors } from '~/composables/useFieldErrors'
import { useOtpAuth } from '~/composables/useOtpAuth'
import { usePendingPhoneVerification } from '~/composables/usePendingPhoneVerification'

useSeoMeta({ title: 'បង្កើតគណនី | BubbleWhite' })

const route = useRoute()
const router = useRouter()
const { setSession } = useCustomerAuth()
const { fetchCart } = useCart()
const { fieldErrors, setFromError, clear: clearFieldError } = useFieldErrors()
const { registerRequestOTP } = useOtpAuth()
const pendingPhone = usePendingPhoneVerification()

// Same reasoning as login.vue: only shown when a provider is actually
// configured.
const config = useRuntimeConfig()
const showSocialLogin = computed(() => !!(config.public.googleClientId || config.public.facebookAppId))

const form = reactive({ name: '', phone: '', email: '', password: '' })
const otpSent = ref(false)
const channel = ref('')
const telegramLinkUrl = ref('')
const loading = ref(false)
const error = ref('')

// A phone verified (but not registered) on the LOGIN page's OTP flow
// arrives here pre-filled — see usePendingPhoneVerification's own
// comment for why this is a convenience prefill, not a trusted result;
// the form below still runs its own full verification from scratch.
onMounted(() => {
  if (pendingPhone.value) {
    form.phone = pendingPhone.value
    pendingPhone.value = ''
  }
})

// The phone they entered already has an account (Google/Facebook signups
// land here too) — nothing left to register, just log them in. Same
// {token, customer} shape as every other login path.
async function onAlreadyRegistered({ token, customer }) {
  error.value = ''
  setSession(token, customer)
  await fetchCart()
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
  router.push(redirect)
}
const onSocialSuccess = onAlreadyRegistered

function onSocialError(message) {
  error.value = message
}

async function submit() {
  error.value = ''
  clearFieldError()
  loading.value = true
  try {
    const res = await registerRequestOTP(form.name, form.phone, form.email, form.password)
    channel.value = res.data.channel
    telegramLinkUrl.value = res.data.telegramLinkUrl || ''
    otpSent.value = true
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចផ្ញើលេខកូដបានទេ'
    }
  } finally {
    loading.value = false
  }
}

// Verification succeeded — the account was just created (or, in the rare
// case this phone got registered by some other route in the meantime,
// this logs into the existing one instead). Either way, same
// {token, customer} shape. needsRegistration should never actually occur
// here (this OtpRequest always carries the pending fields that make the
// backend create the account on verification — see registerRequestOTP),
// but this is checked defensively rather than assumed.
function onVerified(data) {
  if (data.needsRegistration) {
    error.value = 'មានបញ្ហាកើតឡើង សូមព្យាយាមម្តងទៀត'
    otpSent.value = false
    return
  }
  onAlreadyRegistered({ token: data.token, customer: data.customer })
}
</script>
