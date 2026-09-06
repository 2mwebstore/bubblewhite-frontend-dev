<template>
  <!-- Google's button needs a real DOM element to render itself into —
       intentionally not styled by us, since Google's own button already
       satisfies their branding guidelines and a custom-styled substitute
       would risk violating them. Hidden entirely (v-if) when no client ID
       is configured, rather than rendering a button that would only ever
       fail on click. -->
  <div v-if="clientId" ref="buttonEl" class="w-full flex justify-center" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { loadGoogleScript, useSocialAuth } from '~/composables/useSocialAuth'

const emit = defineEmits(['success', 'error'])

const config = useRuntimeConfig()
const clientId = config.public.googleClientId
const buttonEl = ref(null)
const { exchangeGoogleToken } = useSocialAuth()

async function handleCredential(response) {
  try {
    const result = await exchangeGoogleToken(response.credential)
    emit('success', result)
  } catch (e) {
    emit('error', e.message || 'មិនអាចចូលគណនីតាម Google បានទេ')
  }
}

onMounted(async () => {
  if (!clientId) return
  try {
    const google = await loadGoogleScript()
    google.accounts.id.initialize({ client_id: clientId, callback: handleCredential })
    google.accounts.id.renderButton(buttonEl.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      locale: 'km',
    })
  } catch (e) {
    emit('error', e.message || 'មិនអាចផ្ទុក Google Sign-In បានទេ')
  }
})
</script>
