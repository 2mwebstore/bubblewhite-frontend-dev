<template>
  <div>
    <NuxtLoadingIndicator color="#B9794F" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Transition name="toast">
      <div v-if="state.toast" class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-ink text-cream text-sm px-5 py-3 rounded-full shadow-lg">
        {{ state.toast }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStore } from '~/composables/useStore'
import { useCart } from '~/composables/useCart'

const { state } = useStore()
const { fetchCart } = useCart()

// Client-only (onMounted never runs during SSR) — correct, since customer
// auth is localStorage-only and can't be known server-side anyway. Loads
// the cart badge count for both NavBar (desktop) and MobileTabBar from one
// place, since they share the same underlying cart state.
onMounted(fetchCart)
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
