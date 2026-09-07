<template>
  <header class="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-line">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
      <NuxtLink to="/" class="shrink-0" aria-label="BubbleWhite — ទំព័រដើម">
        <img :src="settings?.logoUrl || '/logo.png'" alt="BubbleWhite" class="h-10 md:h-14 w-auto" />
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-8 text-sm font-medium">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="relative py-1 transition-colors hover:text-rust"
          :class="isActive(link.to) ? 'text-ink' : 'text-ink/70'">
          {{ link.label }}
          <span v-if="isActive(link.to)" class="absolute -bottom-1 left-0 right-0 h-[2px] bg-ink" />
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-4 shrink-0">
        <!-- Cart — guest visitors have no cart (it's backend-persisted per
             account), so hidden entirely rather than shown empty. The
             mobile bottom tab bar has its own cart tab with the same rule. -->
        <NuxtLink v-if="isLoggedIn" to="/cart" class="relative hover:text-rust transition-colors" aria-label="រទេះទំនិញ">
          <ShoppingBag :size="20" :stroke-width="1.8" />
          <span
            v-if="itemCount > 0"
            class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rust text-cream text-[10px] font-bold flex items-center justify-center"
          >
            {{ itemCount > 99 ? '99+' : itemCount }}
          </span>
        </NuxtLink>

        <!-- Account — logged out: plain icon straight to /login.
             Logged in: avatar opens a dropdown (profile / password / logout)
             instead of navigating directly. -->
        <NuxtLink v-if="!isLoggedIn" to="/login" class="hover:text-rust transition-colors" aria-label="ចូលគណនី">
          <UserRound :size="20" :stroke-width="1.8" />
        </NuxtLink>

        <div v-else ref="menuRoot" class="relative">
          <button
            type="button"
            class="flex items-center gap-1.5 hover:text-rust transition-colors"
            aria-label="គណនីរបស់ខ្ញុំ"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <span class="w-8 h-8 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-semibold">
              {{ initials }}
            </span>
            <ChevronDown :size="14" :stroke-width="2" class="transition-transform hidden sm:block" :class="menuOpen ? 'rotate-180' : ''" />
          </button>

          <Transition name="fade">
            <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-56 rounded-lg border border-line bg-white shadow-lg overflow-hidden">
              <p class="px-4 py-3 text-xs text-muted border-b border-line truncate">{{ state.customer?.name }}</p>
              <NuxtLink to="/account" class="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors" @click="menuOpen = false">
                <UserPen :size="16" :stroke-width="1.8" /> ព័ត៌មានប្រវត្តិរូប
              </NuxtLink>
              <NuxtLink to="/account/change-password" class="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors" @click="menuOpen = false">
                <KeyRound :size="16" :stroke-width="1.8" /> ប្តូរពាក្យសម្ងាត់
              </NuxtLink>
              <button type="button" class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rust hover:bg-cream-dark transition-colors" @click="onLogout">
                <LogOut :size="16" :stroke-width="1.8" /> ចាកចេញ
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { ShoppingBag, UserRound, UserPen, KeyRound, LogOut, ChevronDown } from 'lucide-vue-next'
import { useSiteSettings } from '../composables/useSiteSettings'
import { useCustomerAuth } from '../composables/useCustomerAuth'
import { useCart } from '../composables/useCart'

const route = useRoute()
const router = useRouter()
const { settings, ensureLoaded } = useSiteSettings()
const { state, isLoggedIn, logout } = useCustomerAuth()
const { itemCount, fetchCart } = useCart()

onMounted(ensureLoaded)

const initials = computed(() => {
  const name = state.customer?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
})

const navLinks = [
  { to: '/', label: 'ទំព័រដើម' },
  { to: '/shop', label: 'ទំនិញ' },
  { to: '/about', label: 'អំពីយើង' },
  { to: '/contact', label: 'ទំនាក់ទំនង' },
]

function isActive(to) {
  const path = to.split('?')[0]
  return route.path === path && (path !== '/shop' || !to.includes('category'))
}

const menuOpen = ref(false)
const menuRoot = ref(null)
onClickOutside(menuRoot, () => (menuOpen.value = false))

function onLogout() {
  menuOpen.value = false
  logout()
  fetchCart() // clears the cart badge immediately instead of showing stale items
  router.push('/')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
