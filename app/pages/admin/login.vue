<template>
  <div class="min-h-screen flex items-center justify-center bg-cream px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <p class="font-sans font-extrabold text-2xl">bubble<span class="text-rust">.</span>admin</p>
        <p class="text-sm text-muted mt-1">ចូលទៅផ្ទាំងគ្រប់គ្រង</p>
      </div>

      <form class="card-surface p-6 space-y-4" @submit.prevent="submit">
        <div>
          <FormLabel text="អ៊ីមែល" required for-id="email" />
          <input id="email" v-model="email" type="email" required autocomplete="username" class="input-field" placeholder="admin@bubblewhite.co" />
        </div>
        <div>
          <FormLabel text="ពាក្យសម្ងាត់" required for-id="password" />
          <input id="password" v-model="password" type="password" required autocomplete="current-password" class="input-field" placeholder="••••••••" />
        </div>

        <p v-if="error" class="text-sm text-red-600 flex items-center gap-2">
          <AlertCircle :size="16" :stroke-width="1.8" class="shrink-0" /> {{ error }}
        </p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          {{ loading ? 'កំពុងចូល…' : 'ចូល' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

import { ref } from 'vue'

import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login, me } = useAdmin()
const { setSession, setRolePermissions } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { token, user } = await login(email.value, password.value)
    setSession(token, user)

    // Fetch full permission list right away so the sidebar/guards are
    // accurate from the very first page, not just the role name.
    const full = await me()
    setRolePermissions(full.role.permissions)

    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/admin')
  } catch (e) {
    error.value = e.message || 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។'
  } finally {
    loading.value = false
  }
}
</script>
