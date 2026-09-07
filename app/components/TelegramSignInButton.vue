<template>
  <!-- Telegram's widget works differently from Google/Facebook: instead of
       a JS SDK you call, this is a <script> tag that Telegram's own code
       replaces with an iframe button once it loads — so this component's
       job is just to build and insert that script tag correctly, then
       receive its callback. Hidden entirely when no bot username is
       configured, same reasoning as the Google/Facebook buttons. -->
  <div v-if="botUsername" ref="containerEl" class="w-full flex justify-center" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useSocialAuth } from '~/composables/useSocialAuth'

const emit = defineEmits(['success', 'error'])

const config = useRuntimeConfig()
const botUsername = config.public.telegramBotUsername
const containerEl = ref(null)
const { exchangeTelegramAuth } = useSocialAuth()

onMounted(() => {
  if (!botUsername || !containerEl.value) return

  // Telegram's data-onauth attribute names a GLOBAL function to call, not
  // a component-scoped one — the widget itself lives in an iframe outside
  // Vue's reach, so window is the only place it can actually call into.
  // Must be assigned here (onMounted), never at the top level of <script
  // setup> — that code also runs during SSR, where window doesn't exist
  // at all and this assignment crashes the whole page render.
  // Reassigning this same global name on every mount is fine since only
  // one of these buttons is ever realistically visible/active on a given
  // page at once (login.vue or register.vue, never both together).
  window.onTelegramAuth = async function (user) {
    try {
      const result = await exchangeTelegramAuth(user)
      emit('success', result)
    } catch (e) {
      emit('error', e.message || 'មិនអាចចូលគណនីតាម Telegram បានទេ')
    }
  }

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')
  script.onerror = () => emit('error', 'មិនអាចផ្ទុក Telegram Login បានទេ')
  containerEl.value.appendChild(script)
})
</script>
