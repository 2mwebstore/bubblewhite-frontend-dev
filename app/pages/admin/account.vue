<template>
  <div class="max-w-md">
    <h1 class="font-sans font-bold text-2xl mb-1">គណនីរបស់ខ្ញុំ</h1>
    <p class="text-sm text-muted mb-6">{{ state.user?.name }} — {{ state.user?.email }}</p>

    <div class="card-surface p-6">
      <p class="font-semibold mb-4">ប្តូរពាក្យសម្ងាត់</p>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <FormLabel text="ពាក្យសម្ងាត់បច្ចុប្បន្ន" required for-id="current-password" />
          <input
            id="current-password"
            v-model="form.currentPassword"
            type="password"
            required
            autocomplete="current-password"
            class="input-field text-sm"
            :class="fieldErrors.currentPassword ? 'border-red-400' : ''"
          />
          <FieldError :message="fieldErrors.currentPassword" />
        </div>
        <div>
          <FormLabel text="ពាក្យសម្ងាត់ថ្មី" required for-id="new-password" />
          <input
            id="new-password"
            v-model="form.newPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="input-field text-sm"
            :class="fieldErrors.newPassword ? 'border-red-400' : ''"
          />
          <FieldError :message="fieldErrors.newPassword" />
        </div>
        <div>
          <FormLabel text="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី" required for-id="confirm-password" />
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="input-field text-sm"
          />
          <p v-if="confirmPassword && confirmPassword !== form.newPassword" class="text-xs text-red-600 mt-1">
            ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ
          </p>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-rust">បានប្តូរពាក្យសម្ងាត់រួចរាល់។</p>

        <button type="submit" class="btn-primary" :disabled="saving || (confirmPassword && confirmPassword !== form.newPassword)">
          <Loader2 v-if="saving" :size="16" class="animate-spin" />
          {{ saving ? 'កំពុងរក្សាទុក…' : 'ប្តូរពាក្យសម្ងាត់' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

import { reactive, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'
import { useFieldErrors } from '~/composables/useFieldErrors'

const { changePassword } = useAdmin()
const { state } = useAuth()
const { fieldErrors, setFromError, clear: clearFieldError, watchField } = useFieldErrors()

const form = reactive({ currentPassword: '', newPassword: '' })
const confirmPassword = ref('')
const saving = ref(false)
const error = ref('')
const success = ref(false)

watchField(() => form.currentPassword, 'currentPassword')
watchField(() => form.newPassword, 'newPassword')

async function submit() {
  error.value = ''
  success.value = false
  clearFieldError()

  if (form.newPassword !== confirmPassword.value) {
    error.value = 'ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ'
    return
  }

  saving.value = true
  try {
    await changePassword(form.currentPassword, form.newPassword)
    success.value = true
    form.currentPassword = ''
    form.newPassword = ''
    confirmPassword.value = ''
  } catch (e) {
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ'
    }
  } finally {
    saving.value = false
  }
}
</script>
