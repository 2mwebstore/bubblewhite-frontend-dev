<template>
  <div class="space-y-4">
    <!-- Waiting on the Telegram tap-through, with SMS as an explicit
         fallback the customer chooses themselves (never automatic — see
         useOtpAuth's own comment on requestOTPBySMS for why: it costs
         real money per call). The code field is shown right away rather
         than waiting for some signal that the message arrived — if the
         customer types a code before actually receiving one, verifyCode
         below just fails with a clear message, which is simpler than
         building a polling mechanism for a case the error message
         already covers. -->
    <template v-if="channel === 'telegram_pending'">
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
    </template>
    <p v-else class="text-sm text-muted">
      {{ activeChannel === 'sms' ? 'បានផ្ញើលេខកូដតាម SMS ទៅកាន់' : 'បានផ្ញើលេខកូដតាម Telegram ទៅកាន់' }}
      {{ phone }}
    </p>

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
    <button type="button" class="text-sm text-muted hover:underline w-full text-center" @click="$emit('change-phone')">
      ប្តូរលេខទូរស័ព្ទ
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useOtpAuth } from '~/composables/useOtpAuth'

const props = defineProps({
  phone: { type: String, required: true },
  channel: { type: String, required: true }, // 'telegram_pending' | 'telegram_sent' | 'sms'
  telegramLinkUrl: { type: String, default: '' },
})
const emit = defineEmits(['verified', 'error', 'change-phone'])

const { requestOTPBySMS, verifyOTP } = useOtpAuth()

const activeChannel = ref(props.channel)
const smsRequested = ref(false)
const code = ref('')
const loading = ref(false)
const error = ref('')

async function requestSMS() {
  error.value = ''
  loading.value = true
  try {
    await requestOTPBySMS(props.phone)
    smsRequested.value = true
    activeChannel.value = 'sms'
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
    const res = await verifyOTP(props.phone, code.value)
    emit('verified', res.data)
  } catch (e) {
    error.value = e.message || 'លេខកូដមិនត្រឹមត្រូវ'
  } finally {
    loading.value = false
  }
}
</script>
