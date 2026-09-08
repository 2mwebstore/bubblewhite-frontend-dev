<template>
  <div class="max-w-sm mx-auto px-6 py-16 md:py-24">
    <h1 class="font-sans font-bold text-2xl mb-1 text-center">បង្កើតគណនី</h1>
    <p class="text-sm text-muted text-center mb-8">ចូលរួមជាមួយ BubbleWhite</p>

    <!-- Step 1: phone must be verified before anything else — OTP
         verification is required for every new account now, not
         optional (see the backend's own registerInput.VerificationToken,
         which Register rejects the request without). -->
    <div v-if="!verified" class="card-surface p-6">
      <p class="text-sm text-muted mb-4">សូមផ្ទៀងផ្ទាត់លេខទូរស័ព្ទរបស់អ្នកជាមុនសិន</p>
      <PhoneOtpVerification @login-success="onAlreadyRegistered" @needs-registration="onVerified" />
    </div>

    <!-- Step 2: phone confirmed, collect the rest -->
    <form v-else class="card-surface p-6 space-y-4" @submit.prevent="submit">
      <div>
        <FormLabel text="លេខទូរស័ព្ទ" for-id="reg-phone-confirmed" />
        <input id="reg-phone-confirmed" type="tel" disabled :value="verifiedPhone" class="input-field text-sm bg-cream-dark" />
      </div>
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
        {{ loading ? 'កំពុងបង្កើត…' : 'បង្កើតគណនី' }}
      </button>
    </form>

    <div v-if="showSocialLogin" class="flex items-center gap-3 my-6">
      <div class="flex-1 h-px bg-line" />
      <span class="text-xs text-muted">ឬ</span>
      <div class="flex-1 h-px bg-line" />
    </div>

    <div v-if="showSocialLogin" class="flex items-center justify-center gap-4">
      <GoogleSignInButton @success="onAlreadyRegistered" @error="onSocialError" />
      <FacebookSignInButton @success="onAlreadyRegistered" @error="onSocialError" />
    </div>

    <p class="text-sm text-muted text-center mt-6">
      មានគណនីរួចហើយ?
      <NuxtLink :to="{ path: '/login', query: route.query }" class="text-rust font-medium hover:underline">ចូលគណនី</NuxtLink>
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useCustomerApi } from '~/composables/useCustomerApi'
import { useCustomerAuth } from '~/composables/useCustomerAuth'
import { useCart } from '~/composables/useCart'
import { useFieldErrors } from '~/composables/useFieldErrors'
import { usePendingPhoneVerification } from '~/composables/usePendingPhoneVerification'

useSeoMeta({ title: 'បង្កើតគណនី | BubbleWhite' })

const route = useRoute()
const router = useRouter()
const api = useCustomerApi()
const { setSession } = useCustomerAuth()
const { fetchCart } = useCart()
const { fieldErrors, setFromError, clear: clearFieldError } = useFieldErrors()
const pendingVerification = usePendingPhoneVerification()

// Same reasoning as login.vue: only shown when a provider is actually
// configured.
const config = useRuntimeConfig()
const showSocialLogin = computed(() => !!(config.public.googleClientId || config.public.facebookAppId))

const verified = ref(false)
const verifiedPhone = ref('')
const verificationToken = ref('')

const form = reactive({ name: '', email: '', password: '' })
const loading = ref(false)
const error = ref('')

// A customer who already verified their phone on the LOGIN page (and
// turned out to have no account) arrives here with that work already
// done — skip straight to step 2 instead of asking them to verify twice.
onMounted(() => {
  if (pendingVerification.value) {
    onVerified(pendingVerification.value)
    pendingVerification.value = null
  }
})

function onVerified({ phone, verificationToken: token }) {
  verifiedPhone.value = phone
  verificationToken.value = token
  verified.value = true
}

// The phone they just verified already has an account (Google/Facebook
// signups land here too) — nothing left to register, just log them in.
// Same {token, customer} shape as every other login path.
async function onAlreadyRegistered({ token, customer }) {
  error.value = ''
  setSession(token, customer)
  await fetchCart()
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
  router.push(redirect)
}

function onSocialError(message) {
  error.value = message
}

async function submit() {
  error.value = ''
  clearFieldError()
  loading.value = true
  try {
    const res = await api.post('/customer/register', {
      name: form.name,
      phone: verifiedPhone.value,
      email: form.email,
      password: form.password,
      verificationToken: verificationToken.value,
    })
    setSession(res.data.token, res.data.customer)
    await fetchCart()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    router.push(redirect)
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចបង្កើតគណនីបានទេ'
    }
  } finally {
    loading.value = false
  }
}
</script>
