<template>
  <div class="space-y-4">
    <!-- Step 1: phone entry -->
    <div v-if="step === 'phone'">
      <FormLabel text="លេខទូរស័ព្ទ" required for-id="otp-phone" />
      <input
        id="otp-phone"
        v-model="phone"
        type="tel"
        required
        autocomplete="tel"
        class="input-field text-sm"
        :class="error ? 'border-red-400' : ''"
      />
      <FieldError :message="error" />
      <button type="button" class="btn-primary w-full mt-3" :disabled="loading || !phone" @click="requestCode">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងផ្ញើ…' : 'ផ្ញើលេខកូដ' }}
      </button>
    </div>

    <!-- Step 2: waiting on the Telegram tap-through, with SMS as an
         explicit fallback the customer chooses themselves (never
         automatic — see useOtpAuth's own comment on requestOTPBySMS for
         why: it costs real money per call). The code field is shown
         right away rather than waiting for some signal that the message
         arrived — if the customer types a code before actually receiving
         one, verifyCode below just fails with a clear message, which is
         simpler than building a polling mechanism for a case the error
         message already covers. -->
    <div v-else-if="step === 'telegram_pending'" class="space-y-4">
      <a
        :href="telegramLinkUrl"
        target="_blank"
        rel="noopener"
        class="btn-primary w-full flex items-center justify-center gap-2"
      >
        បើក Telegram ដើម្បីទទួលលេខកូដ
      </a>
      <button v-if="!smsRequested" type="button" class="text-sm text-muted hover:underline w-full text-center" :disabled="loading" @click="requestSMS">
        {{ loading ? 'កំពុងផ្ញើ…' : 'ផ្ញើតាម SMS វិញ' }}
      </button>
      <p v-else class="text-sm text-rust text-center">បានផ្ញើលេខកូដតាម SMS ទៅកាន់ {{ phone }}</p>

      <div>
        <FormLabel text="លេខកូដផ្ទៀងផ្ទាត់" required for-id="otp-code" />
        <input
          id="otp-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          required
          class="input-field text-sm"
          :class="error ? 'border-red-400' : ''"
        />
        <FieldError :message="error" />
      </div>
      <button type="button" class="btn-primary w-full" :disabled="loading || !code" @click="verifyCode">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងផ្ទៀងផ្ទាត់…' : 'ផ្ទៀងផ្ទាត់' }}
      </button>
      <button type="button" class="text-sm text-muted hover:underline w-full text-center" @click="reset">
        ប្តូរលេខទូរស័ព្ទ
      </button>
    </div>

    <!-- Step 3: code already sent (Telegram fast-path or SMS) -->
    <div v-else-if="step === 'code_sent'" class="space-y-4">
      <p class="text-sm text-muted">
        {{ channel === 'sms' ? 'បានផ្ញើលេខកូដតាម SMS ទៅកាន់' : 'បានផ្ញើលេខកូដតាម Telegram ទៅកាន់' }}
        {{ phone }}
      </p>
      <div>
        <FormLabel text="លេខកូដផ្ទៀងផ្ទាត់" required for-id="otp-code-2" />
        <input
          id="otp-code-2"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          required
          class="input-field text-sm"
          :class="error ? 'border-red-400' : ''"
        />
        <FieldError :message="error" />
      </div>
      <button type="button" class="btn-primary w-full" :disabled="loading || !code" @click="verifyCode">
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'កំពុងផ្ទៀងផ្ទាត់…' : 'ផ្ទៀងផ្ទាត់' }}
      </button>
      <button type="button" class="text-sm text-muted hover:underline w-full text-center" @click="reset">
        ប្តូរលេខទូរស័ព្ទ
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useOtpAuth } from '~/composables/useOtpAuth'

const emit = defineEmits(['login-success', 'needs-registration', 'error'])

const { requestOTP, requestOTPBySMS, verifyOTP } = useOtpAuth()

const step = ref('phone') // 'phone' | 'telegram_pending' | 'code_sent'
const phone = ref('')
const code = ref('')
const channel = ref('')
const telegramLinkUrl = ref('')
const smsRequested = ref(false)
const loading = ref(false)
const error = ref('')

async function requestCode() {
  error.value = ''
  loading.value = true
  try {
    const res = await requestOTP(phone.value)
    channel.value = res.data.channel
    if (res.data.channel === 'telegram_pending') {
      telegramLinkUrl.value = res.data.telegramLinkUrl
      step.value = 'telegram_pending'
    } else {
      step.value = 'code_sent'
    }
  } catch (e) {
    error.value = e.message || 'មិនអាចផ្ញើលេខកូដបានទេ'
  } finally {
    loading.value = false
  }
}

async function requestSMS() {
  error.value = ''
  loading.value = true
  try {
    await requestOTPBySMS(phone.value)
    smsRequested.value = true
    channel.value = 'sms'
  } catch (e) {
    error.value = e.message || 'មិនអាចផ្ញើលេខកូដតាម SMS បានទេ'
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  error.value = ''
  loading.value = true
  try {
    const res = await verifyOTP(phone.value, code.value)
    if (res.data.needsRegistration) {
      emit('needs-registration', { phone: phone.value, verificationToken: res.data.verificationToken })
    } else {
      emit('login-success', { token: res.data.token, customer: res.data.customer })
    }
  } catch (e) {
    error.value = e.message || 'លេខកូដមិនត្រឹមត្រូវ'
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 'phone'
  code.value = ''
  error.value = ''
  smsRequested.value = false
  telegramLinkUrl.value = ''
}
</script>
