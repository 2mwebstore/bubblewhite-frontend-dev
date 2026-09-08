<template>
  <div class="max-w-lg mx-auto px-6 py-12 md:py-16">
    <h1 class="font-sans font-bold text-2xl mb-1">គណនីរបស់ខ្ញុំ</h1>
    <p class="text-sm text-muted mb-8">{{ state.customer?.phone }}</p>

    <AccountTabs />

    <div class="card-surface p-6">
      <p class="font-semibold mb-4">{{ hasPassword ? 'ប្តូរពាក្យសម្ងាត់' : 'កំណត់ពាក្យសម្ងាត់' }}</p>
      <p v-if="!hasPassword" class="text-sm text-muted mb-4">
        គណនីរបស់អ្នកបានចូលតាម Google ឬ Facebook ហើយមិនទាន់មានពាក្យសម្ងាត់នៅឡើយទេ។ អ្នកអាចកំណត់មួយនៅទីនេះ ដើម្បីអាចចូលគណនីដោយប្រើលេខទូរស័ព្ទ/អ៊ីមែលផងដែរ។
      </p>
      <form class="space-y-4" @submit.prevent="submitPassword">
        <div v-if="hasPassword">
          <FormLabel text="ពាក្យសម្ងាត់បច្ចុប្បន្ន" required for-id="current-password" />
          <input
            id="current-password"
            v-model="passwordForm.currentPassword"
            type="password"
            required
            autocomplete="current-password"
            class="input-field text-sm"
          />
        </div>
        <div>
          <FormLabel text="ពាក្យសម្ងាត់ថ្មី" required for-id="new-password" />
          <input
            id="new-password"
            v-model="passwordForm.newPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="input-field text-sm"
          />
        </div>

        <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
        <p v-if="passwordSaved" class="text-sm text-rust">{{ hasPassword ? 'បានប្តូរពាក្យសម្ងាត់រួចរាល់។' : 'បានកំណត់ពាក្យសម្ងាត់រួចរាល់។' }}</p>

        <button type="submit" class="btn-primary" :disabled="savingPassword">
          <Loader2 v-if="savingPassword" :size="16" class="animate-spin" />
          {{ savingPassword ? 'កំពុងរក្សាទុក…' : hasPassword ? 'ប្តូរពាក្យសម្ងាត់' : 'កំណត់ពាក្យសម្ងាត់' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useCustomerApi } from '~/composables/useCustomerApi'
import { useCustomerAuth } from '~/composables/useCustomerAuth'

useSeoMeta({ title: 'ប្តូរពាក្យសម្ងាត់ | BubbleWhite' })

const router = useRouter()
const api = useCustomerApi()
const { state, isLoggedIn } = useCustomerAuth()

// Client-only (see nuxt.config.ts) — same reasoning as /account itself.
onMounted(() => {
  if (!isLoggedIn.value) {
    router.push({ path: '/login', query: { redirect: '/account/change-password' } })
  }
})

// A Google/Facebook-only customer has no existing password (see the
// backend's customerJSON, which is what populates this) — asking them for
// a "current password" they were never given the chance to set would
// block them from ever setting one at all, which is exactly why this form
// adapts instead of always requiring it.
const hasPassword = computed(() => state.customer?.hasPassword !== false)

const passwordForm = reactive({ currentPassword: '', newPassword: '' })
const savingPassword = ref(false)
const passwordError = ref('')
const passwordSaved = ref(false)

async function submitPassword() {
  passwordError.value = ''
  passwordSaved.value = false
  savingPassword.value = true
  try {
    await api.post('/customer/me/change-password', passwordForm)
    passwordSaved.value = true
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
  } catch (e) {
    passwordError.value = e.message || 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ'
  } finally {
    savingPassword.value = false
  }
}
</script>
