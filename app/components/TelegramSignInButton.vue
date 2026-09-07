<template>
  <!-- Telegram's widget works differently from Google/Facebook: instead of
       a JS SDK you call, this is a <script> tag that Telegram's own code
       replaces with an iframe button once it loads — so this component's
       job is just to build and insert that script tag correctly. Hidden
       entirely when no bot username is configured, same reasoning as the
       Google/Facebook buttons.

       Uses data-auth-url (a full-page redirect back to this same page,
       with the auth result as query parameters) rather than data-onauth
       (a JS callback function). Telegram's widget internally uses eval()
       to parse the data-onauth attribute's function-call-style string
       ("onTelegramAuth(user)") into an actual call — confirmed directly
       from a real CSP violation on the live site (window.__parseFunction
       throwing under a CSP with no 'unsafe-eval'). Allowing 'unsafe-eval'
       site-wide just for this one third-party widget would have been a
       significant, unnecessary weakening of the CSP; data-auth-url avoids
       needing it at all, since there's no callback string to parse — the
       actual handling of the returned data happens in login.vue/
       register.vue's own onMounted, reading it back out of the URL. -->
  <div v-if="botUsername" ref="containerEl" class="w-full flex justify-center" />
</template>

<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['error'])

const config = useRuntimeConfig()
const botUsername = config.public.telegramBotUsername
const containerEl = ref(null)

onMounted(() => {
  if (!botUsername || !containerEl.value) return

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  // Redirects back to whichever page (login or register) the button was
  // actually clicked from, stripped of any existing query string, so each
  // page's own onMounted can cleanly pick up the returned parameters —
  // see login.vue/register.vue's handleTelegramRedirect.
  script.setAttribute('data-auth-url', window.location.href.split('?')[0])
  script.setAttribute('data-request-access', 'write')
  // No success path to emit here (unlike Google/Facebook) — this mode
  // redirects the whole page rather than calling back into this
  // component, so a load failure is the only client-side error this
  // component itself can ever observe.
  script.onerror = () => emit('error', 'មិនអាចផ្ទុក Telegram Login បានទេ')
  containerEl.value.appendChild(script)
})
</script>
