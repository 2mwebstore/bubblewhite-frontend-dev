<template>
  <div class="max-w-sm mx-auto px-6 py-16 md:py-24">
    <h1 class="font-sans font-bold text-2xl mb-1 text-center">ចូលគណនី</h1>
    <p class="text-sm text-muted text-center mb-8">សូមស្វាគមន៍មកកាន់ Bubble White វិញ</p>

    <form class="card-surface p-6 space-y-4" @submit.prevent="submit">
      <div>
        <FormLabel text="លេខទូរស័ព្ទ ឬអ៊ីមែល" required for-id="login-identifier" />
        <input
          id="login-identifier"
          v-model="form.identifier"
          type="text"
          required
          autocomplete="username"
          class="input-field text-sm"
          :class="fieldErrors.identifier ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.identifier" />
      </div>
      <div>
        <FormLabel text="ពាក្យសម្ងាត់" required for-id="login-password" />
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="input-field text-sm"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងចូល…' : 'ចូលគណនី' }}
      </button>
    </form>

    <div v-if="showSocialLogin" class="flex items-center gap-3 my-6">
      <div class="flex-1 h-px bg-line" />
      <span class="text-xs text-muted">ឬ</span>
      <div class="flex-1 h-px bg-line" />
    </div>

    <div v-if="showSocialLogin" class="space-y-3">
      <GoogleSignInButton @success="onSocialSuccess" @error="onSocialError" />
      <FacebookSignInButton @success="onSocialSuccess" @error="onSocialError" />
      <TelegramSignInButton @success="onSocialSuccess" @error="onSocialError" />
    </div>

    <p class="text-sm text-muted text-center mt-6">
      មិនទាន់មានគណនីទេ?
      <NuxtLink :to="{ path: '/register', query: route.query }" class="text-rust font-medium hover:underline">បង្កើតគណនី</NuxtLink>
    </p>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useCustomerApi } from '~/composables/useCustomerApi'
import { useCustomerAuth } from '~/composables/useCustomerAuth'
import { useCart } from '~/composables/useCart'
import { useFieldErrors } from '~/composables/useFieldErrors'

useSeoMeta({ title: 'ចូលគណនី | Bubble White' })

const route = useRoute()
const router = useRouter()
const api = useCustomerApi()
const { setSession } = useCustomerAuth()
const { fetchCart } = useCart()
const { fieldErrors, setFromError, clear: clearFieldError } = useFieldErrors()

// Only shown when at least one provider is actually configured — an admin
// who hasn't set up Google/Facebook yet sees a normal phone/password form
// with no dead-end buttons.
const config = useRuntimeConfig()
const showSocialLogin = computed(() => !!(config.public.googleClientId || config.public.facebookAppId || config.public.telegramBotUsername))

const form = reactive({ identifier: '', password: '' })
const loading = ref(false)
const error = ref('')

// Shared by both social buttons — same post-login steps as the regular
// phone/password submit() below (pull in the customer's saved cart, then
// redirect), since the backend already returns the identical {token,
// customer} shape regardless of how they signed in.
async function onSocialSuccess({ token, customer }) {
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
    const res = await api.post('/customer/login', form)
    setSession(res.data.token, res.data.customer)
    await fetchCart() // pull in whatever this customer already has saved
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    router.push(redirect)
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចចូលគណនីបានទេ'
    }
  } finally {
    loading.value = false
  }
}
</script>
