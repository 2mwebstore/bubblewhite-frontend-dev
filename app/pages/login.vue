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
      <TelegramSignInButton @error="onSocialError" />
    </div>

    <p class="text-sm text-muted text-center mt-6">
      មិនទាន់មានគណនីទេ?
      <NuxtLink :to="{ path: '/register', query: route.query }" class="text-rust font-medium hover:underline">បង្កើតគណនី</NuxtLink>
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
import { useSocialAuth } from '~/composables/useSocialAuth'

useSeoMeta({ title: 'ចូលគណនី | Bubble White' })

const route = useRoute()
const router = useRouter()
const api = useCustomerApi()
const { setSession } = useCustomerAuth()
const { fetchCart } = useCart()
const { fieldErrors, setFromError, clear: clearFieldError } = useFieldErrors()
const { exchangeTelegramAuth } = useSocialAuth()

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

// Telegram's widget uses the data-auth-url redirect mode (see
// TelegramSignInButton's own comment for why — avoids the widget's
// internal eval() usage, which would otherwise require weakening the CSP
// with 'unsafe-eval'). That means the auth result arrives as query
// parameters on THIS page after a full redirect, not as a JS callback —
// checked once on mount, same idea as PPCBank's return-from-redirect
// checkout flow.
onMounted(async () => {
  if (!route.query.hash) return

  try {
    const result = await exchangeTelegramAuth({
      id: Number(route.query.id),
      first_name: route.query.first_name || '',
      last_name: route.query.last_name || '',
      username: route.query.username || '',
      photo_url: route.query.photo_url || '',
      auth_date: Number(route.query.auth_date),
      hash: route.query.hash,
    })
    await onSocialSuccess(result)
  } catch (e) {
    error.value = e.message || 'មិនអាចចូលគណនីតាម Telegram បានទេ'
    // Strip the auth data out of the URL even on failure — it's already
    // been used (or rejected) once and shouldn't linger visibly in the
    // address bar or be re-submitted on a page refresh.
    router.replace({ path: route.path, query: {} })
  }
})

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
