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
import { useSiteSettings } from '~/composables/useSiteSettings'

const { state } = useStore()
const { fetchCart } = useCart()
const { settings, ensureLoaded } = useSiteSettings()

// Client-only (onMounted never runs during SSR) — correct, since customer
// auth is localStorage-only and can't be known server-side anyway. Loads
// the cart badge count for both NavBar (desktop) and MobileTabBar from one
// place, since they share the same underlying cart state.
onMounted(() => {
  fetchCart()
  ensureLoaded()
})

const siteUrl = useRuntimeConfig().public.siteUrl

// WebSite structured data (schema.org/JSON-LD) — this is a genuine,
// concrete SEO signal (not decoration): it tells Google this site is a
// single coherent entity with a name and a real, working search feature
// (SearchAction pointing at /shop?q=..., which actually works — see
// shop.vue reading route.query.q). This is the same mechanism Google
// documents as a prerequisite for potentially showing a "sitelinks
// search box" under a brand's search result.
//
// Important to be honest about what this does and doesn't do: sitelinks
// themselves (the small sub-links Google sometimes shows under a search
// result) are entirely automated and can never be directly requested or
// guaranteed by a site owner — Google's own documentation is explicit
// about this. This schema is a real, correct signal that helps Google
// understand the site better, not a switch that turns sitelinks on.
// Sitelinks typically only appear once Google has built up enough trust
// in a site over time (indexing history, consistent structure, organic
// traffic for the exact brand query) — there's no code change that
// shortcuts that.
useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: settings.value?.companyName || 'Bubble White',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],
}))
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
