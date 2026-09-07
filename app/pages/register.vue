<template>
  <div class="max-w-sm mx-auto px-6 py-16 md:py-24">
    <h1 class="font-sans font-bold text-2xl mb-1 text-center">បង្កើតគណនី</h1>
    <p class="text-sm text-muted text-center mb-8">ចូលរួមជាមួយ BubbleWhite</p>

    <form class="card-surface p-6 space-y-4" @submit.prevent="submit">
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
      <GoogleSignInButton @success="onSocialSuccess" @error="onSocialError" />
      <FacebookSignInButton @success="onSocialSuccess" @error="onSocialError" />
    </div>

    <p class="text-sm text-muted text-center mt-6">
      មានគណនីរួចហើយ?
      <NuxtLink :to="{ path: '/login', query: route.query }" class="text-rust font-medium hover:underline">ចូលគណនី</NuxtLink>
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

useSeoMeta({ title: 'បង្កើតគណនី | BubbleWhite' })

const route = useRoute()
const router = useRouter()
const api = useCustomerApi()
const { setSession } = useCustomerAuth()
const { fetchCart } = useCart()
const { fieldErrors, setFromError, clear: clearFieldError } = useFieldErrors()

// Same reasoning as login.vue: only shown when a provider is actually
// configured.
const config = useRuntimeConfig()
const showSocialLogin = computed(() => !!(config.public.googleClientId || config.public.facebookAppId))

const form = reactive({ name: '', phone: '', password: '' })
const loading = ref(false)
const error = ref('')

// A Google/Facebook signup on this page does the exact same "find or
// create" the backend already does for a returning customer — there's
// nothing register-specific about the social flow, so this is identical
// to login.vue's own onSocialSuccess.
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
    const res = await api.post('/customer/register', form)
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
