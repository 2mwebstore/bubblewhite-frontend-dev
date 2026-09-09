<template>
  <div class="space-y-4">
    <!-- Step 1: phone entry -->
    <div v-if="step === 'phone'">
      <FormLabel text="លេខទូរស័ព្ទ" required for-id="otp-login-phone" />
      <input
        id="otp-login-phone"
        :value="phone"
        type="tel"
        required
        autocomplete="tel"
        inputmode="tel"
        class="input-field text-sm"
        :class="error ? 'border-red-400' : ''"
        @input="phone = sanitizePhoneInput($event.target.value)"
      />
      <FieldError :message="error" />
      <button type="button" class="btn-primary w-full mt-3" :disabled="loading || !phone" @click="requestCode">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងផ្ញើ…' : 'ផ្ញើលេខកូដ' }}
      </button>
    </div>

    <!-- Step 2: code entry (Telegram tap-through or already sent) -->
    <OtpCodeEntry
      v-else
      :phone="phone"
      :channel="channel"
      :telegram-link-url="telegramLinkUrl"
      @verified="onVerified"
      @change-phone="reset"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useOtpAuth } from '~/composables/useOtpAuth'
import { sanitizePhoneInput } from '~/composables/usePhoneInput'

const emit = defineEmits(['login-success', 'needs-registration', 'error'])

const { requestOTP } = useOtpAuth()

const step = ref('phone') // 'phone' | 'code'
const phone = ref('')
const channel = ref('')
const telegramLinkUrl = ref('')
const loading = ref(false)
const error = ref('')

async function requestCode() {
  error.value = ''
  loading.value = true
  try {
    const res = await requestOTP(phone.value)
    channel.value = res.data.channel
    telegramLinkUrl.value = res.data.telegramLinkUrl || ''
    step.value = 'code'
  } catch (e) {
    error.value = e.message || 'មិនអាចផ្ញើលេខកូដបានទេ'
  } finally {
    loading.value = false
  }
}

function onVerified(data) {
  if (data.needsRegistration) {
    emit('needs-registration', { phone: phone.value })
  } else {
    emit('login-success', { token: data.token, customer: data.customer })
  }
}

function reset() {
  step.value = 'phone'
  channel.value = ''
  telegramLinkUrl.value = ''
  error.value = ''
}
</script>
