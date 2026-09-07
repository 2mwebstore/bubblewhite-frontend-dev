<template>
  <!-- Unlike Google, Facebook's SDK doesn't render its own button — this
       is a plain custom button that calls FB.login() directly. Icon-only,
       circular, matching the same size/style as the Google icon button
       next to it. aria-label/title carry the text an icon-only button
       would otherwise lose for screen readers and on hover. -->
  <button
    v-if="appId"
    type="button"
    class="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-cream-dark transition-colors disabled:opacity-60"
    :disabled="loading || !sdkReady"
    aria-label="បន្តជាមួយ Facebook"
    title="បន្តជាមួយ Facebook"
    @click="signIn"
  >
    <Loader2 v-if="loading || !sdkReady" :size="18" class="animate-spin text-muted" />
    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  </button>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { loadFacebookScript, useSocialAuth } from '~/composables/useSocialAuth'

const emit = defineEmits(['success', 'error'])

const config = useRuntimeConfig()
const appId = config.public.facebookAppId
const { exchangeFacebookToken } = useSocialAuth()
const loading = ref(false)

// FB.login() opens a popup, and browsers only allow that when it's called
// SYNCHRONOUSLY inside a genuine click handler — mobile Safari enforces
// this far more strictly than desktop browsers, expiring that "user
// gesture" window almost immediately. The previous version awaited
// loadFacebookScript() inside the click handler before ever calling
// FB.login() — that await, even though it usually resolved in well under
// a second, was enough of a gap for mobile Safari to no longer consider
// the eventual FB.login() call part of the original tap, so it silently
// blocked the popup with no visible error — exactly "click does nothing".
// The SDK is now loaded here on mount instead, well before anyone could
// realistically tap the button, so the click handler below can call
// fb.value.login() with zero awaits ahead of it, regardless of platform.
const fb = ref(null)
const sdkReady = ref(false)

onMounted(async () => {
  try {
    fb.value = await loadFacebookScript(appId)
    sdkReady.value = true
  } catch (e) {
    emit('error', e.message || 'មិនអាចផ្ទុក Facebook Login បានទេ')
  }
})

function signIn() {
  if (!fb.value) return
  loading.value = true
  fb.value.login(
    (response) => {
      if (response.authResponse?.accessToken) {
        exchangeFacebookToken(response.authResponse.accessToken)
          .then((result) => emit('success', result))
          .catch((e) => emit('error', e.message || 'មិនអាចចូលគណនីតាម Facebook បានទេ'))
          .finally(() => (loading.value = false))
      } else {
        // status is 'not_authorized' (declined the permissions dialog) or
        // 'unknown' (closed the popup without deciding) — either way, the
        // person simply didn't complete sign-in, not an actual error
        // worth alarming them about.
        loading.value = false
      }
    },
    { scope: 'public_profile,email' }
  )
}
</script>
