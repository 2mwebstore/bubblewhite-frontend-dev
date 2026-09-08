<template>
  <!-- Google's button needs a real DOM element to render itself into —
       intentionally not styled by us, since Google's own button already
       satisfies their branding guidelines and a custom-styled substitute
       would risk violating them. Hidden entirely (v-if) when no client ID
       is configured, rather than rendering a button that would only ever
       fail on click.

       A loading placeholder covers the gap while Google's script is still
       being fetched (the actual slow part — DNS/TLS/download over the
       network, not the render itself) — same size/spinner as the
       Facebook button beside it, so the row doesn't look broken or empty
       while it loads. buttonEl uses v-show, not v-if: Google's own
       renderButton() needs that DOM node to already exist to render
       into, so it can't be conditionally removed from the DOM the way
       v-if would — only visually hidden until it's actually ready. -->
  <div v-if="clientId" class="relative w-10 h-10">
    <div
      v-show="!ready"
      class="absolute inset-0 w-10 h-10 rounded-full border border-line flex items-center justify-center"
    >
      <Loader2 :size="18" class="animate-spin text-muted" />
    </div>
    <div v-show="ready" ref="buttonEl" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { loadGoogleScript, useSocialAuth } from '~/composables/useSocialAuth'

const emit = defineEmits(['success', 'error'])

const config = useRuntimeConfig()
const clientId = config.public.googleClientId
const buttonEl = ref(null)
const ready = ref(false)
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
    ready.value = true
  } catch (e) {
    emit('error', e.message || 'មិនអាចផ្ទុក Google Sign-In បានទេ')
  }
})
</script>
