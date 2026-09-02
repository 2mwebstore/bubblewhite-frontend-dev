<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]"
    aria-label="រុករកចម្បង"
  >
    <div style="display: flex; align-items: stretch;">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        style="flex: 1 1 0%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;"
        class="py-2.5 text-[11px] font-medium transition-colors relative"
        :class="isActive(tab.to) ? 'text-ink' : 'text-muted'"
      >
        <span
          class="flex items-center justify-center w-9 h-9 rounded-full transition-colors relative"
          :class="isActive(tab.to) ? 'bg-ink text-cream' : ''"
        >
          <component :is="tab.icon" :size="18" :stroke-width="1.8" />
          <span
            v-if="tab.to === '/cart' && itemCount > 0"
            class="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rust text-cream text-[9px] font-bold flex items-center justify-center"
          >
            {{ itemCount > 99 ? '99+' : itemCount }}
          </span>
        </span>
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { Home, Store, ShoppingBag, Info, MessageCircle } from 'lucide-vue-next'
import { useCart } from '../composables/useCart'
import { useCustomerAuth } from '../composables/useCustomerAuth'

const route = useRoute()
const { itemCount } = useCart()
const { isLoggedIn } = useCustomerAuth()

// Cart sits in the middle (3rd of 5) — matches the requested "center" spot.
// Guest visitors have no cart (it's backend-persisted per account), so it's
// filtered out entirely rather than shown empty — same rule as NavBar.
const allTabs = [
  { to: '/', label: 'ទំព័រដើម', icon: Home },
  { to: '/shop', label: 'ទំនិញ', icon: Store },
  { to: '/cart', label: 'រទេះទំនិញ', icon: ShoppingBag, requiresLogin: true },
  { to: '/about', label: 'អំពីយើង', icon: Info },
  { to: '/contact', label: 'ទំនាក់ទំនង', icon: MessageCircle },
]
const tabs = computed(() => allTabs.filter((t) => !t.requiresLogin || isLoggedIn.value))

function isActive(to) {
  return route.path === to
}
</script>
