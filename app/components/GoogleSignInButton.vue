<template>
  <!-- Google's button needs a real DOM element to render itself into —
       intentionally not styled by us, since Google's own button already
       satisfies their branding guidelines and a custom-styled substitute
       would risk violating them. Hidden entirely (v-if) when no client ID
       is configured, rather than rendering a button that would only ever
       fail on click. Icon-only, circular shape — no wrapper sizing needed
       since Google's own icon button is a fixed, small square/circle. -->
  <div v-if="clientId" ref="buttonEl" />
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
    // type: 'icon' + shape: 'circle' — logo only, no "Continue with
    // Google" text, per Google's own documented GsiButtonConfiguration
    // options (developers.google.com/identity/gsi/web/reference/js-reference).
    google.accounts.id.renderButton(buttonEl.value, {
      type: 'icon',
      theme: 'outline',
      size: 'large',
      shape: 'circle',
    })
  } catch (e) {
    emit('error', e.message || 'មិនអាចផ្ទុក Google Sign-In បានទេ')
  }
})
</script>
