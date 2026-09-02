<template>
  <div class="min-h-screen flex bg-cream text-ink font-body">
    <!-- Sidebar (desktop) -->
    <aside class="hidden md:flex w-64 flex-col border-r border-line bg-white shrink-0">
      <div class="h-16 flex items-center px-6 border-b border-line">
        <NuxtLink to="/admin" class="font-sans font-extrabold text-lg">bubble<span class="text-rust">.</span>admin</NuxtLink>
      </div>
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <template v-for="item in visibleNav" :key="item.label || item.to">
          <template v-if="item.group">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:bg-cream-dark transition-colors"
              @click="toggleGroup()"
            >
              <component :is="item.icon" :size="18" :stroke-width="1.8" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <ChevronDown :size="14" class="transition-transform" :class="settingsExpanded ? 'rotate-180' : ''" />
            </button>
            <div v-if="settingsExpanded" class="pl-4 space-y-1">
              <AdminNavLink v-for="child in item.children" :key="child.to" :to="child.to" :icon="child.icon" :label="child.label" />
            </div>
          </template>
          <AdminNavLink v-else :to="item.to" :icon="item.icon" :label="item.label" />
        </template>
      </nav>
      <div class="p-3 border-t border-line">
        <NuxtLink to="/admin/account" class="block px-3 py-2 mb-1 rounded-lg hover:bg-cream-dark transition-colors">
          <p class="text-sm font-medium truncate">{{ state.user?.name }}</p>
          <p class="text-xs text-muted truncate">{{ state.user?.role }}</p>
        </NuxtLink>
        <button type="button" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rust hover:bg-cream-dark transition-colors" @click="handleLogout">
          <LogOut :size="16" :stroke-width="1.8" /> ចាកចេញ
        </button>
      </div>
    </aside>

    <!-- Mobile topbar + drawer -->
    <div class="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-line flex items-center justify-between px-4">
      <button type="button" aria-label="បើកម៉ឺនុយ" @click="mobileOpen = true"><Menu :size="22" :stroke-width="1.8" /></button>
      <span class="font-sans font-extrabold">bubble<span class="text-rust">.</span>admin</span>
      <button type="button" aria-label="ចាកចេញ" @click="handleLogout"><LogOut :size="20" :stroke-width="1.8" /></button>
    </div>
    <Transition name="fade">
      <div v-if="mobileOpen" class="md:hidden fixed inset-0 z-50 bg-ink/40" @click.self="mobileOpen = false">
        <div class="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white p-4 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <span class="font-sans font-extrabold text-lg">bubble<span class="text-rust">.</span>admin</span>
            <button type="button" aria-label="បិទ" @click="mobileOpen = false"><X :size="20" :stroke-width="1.8" /></button>
          </div>
          <nav class="flex-1 overflow-y-auto space-y-1">
            <template v-for="item in visibleNav" :key="item.label || item.to">
              <template v-if="item.group">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:bg-cream-dark transition-colors"
                  @click="toggleGroup()"
                >
                  <component :is="item.icon" :size="18" :stroke-width="1.8" />
                  <span class="flex-1 text-left">{{ item.label }}</span>
                  <ChevronDown :size="14" class="transition-transform" :class="settingsExpanded ? 'rotate-180' : ''" />
                </button>
                <div v-if="settingsExpanded" class="pl-4 space-y-1">
                  <AdminNavLink v-for="child in item.children" :key="child.to" :to="child.to" :icon="child.icon" :label="child.label" @click="mobileOpen = false" />
                </div>
              </template>
              <AdminNavLink v-else :to="item.to" :icon="item.icon" :label="item.label" @click="mobileOpen = false" />
            </template>
            <NuxtLink
              to="/admin/account"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:bg-cream-dark"
              @click="mobileOpen = false"
            >
              <UserCircle :size="18" :stroke-width="1.8" /> គណនីរបស់ខ្ញុំ
            </NuxtLink>
          </nav>
        </div>
      </div>
    </Transition>

    <!-- Main content -->
    <div class="flex-1 min-w-0 md:pt-0 pt-14">
      <main class="p-4 md:p-8 max-w-6xl mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  LayoutDashboard, Package, Tags, Images, Users, ShieldCheck, Settings as SettingsIcon, Mail, LogOut, Menu, X, UserCircle,
  ShoppingBag, Contact, CreditCard, ChevronDown,
} from 'lucide-vue-next'
import AdminNavLink from '../components/admin/AdminNavLink.vue'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
const router = useRouter()
const route = useRoute()
const { state, logout, hasPermission, setRolePermissions } = useAuth()
const { me } = useAdmin()

const mobileOpen = ref(false)

// Re-sync permissions from the server on every admin page load (silently —
// a stale/expired token here just gets caught by the next API call's 401
// handler) so a role change takes effect without forcing a fresh login.
onMounted(() => {
  me()
    .then((full) => setRolePermissions(full.role.permissions))
    .catch(() => {})
})

const nav = [
  { to: '/admin', label: 'ផ្ទាំងគ្រប់គ្រង', icon: LayoutDashboard, permission: null },
  { to: '/admin/orders', label: 'ការបញ្ជាទិញ', icon: ShoppingBag, permission: 'order.view' },
  { to: '/admin/products', label: 'ផលិតផល', icon: Package, permission: 'product.view' },
  { to: '/admin/banners', label: 'បដារទំព័រដើម', icon: Images, permission: 'banner.view' },
  { to: '/admin/customers', label: 'អតិថិជន', icon: Contact, permission: 'customer.view' },
  { to: '/admin/contacts', label: 'សារទំនាក់ទំនង', icon: Mail, permission: 'contact.view' },
  {
    group: true,
    label: 'ការកំណត់',
    icon: SettingsIcon,
    children: [
      { to: '/admin/categories', label: 'ប្រភេទ', icon: Tags, permission: 'category.view' },
      { to: '/admin/payment_method', label: 'វិធីទូទាត់', icon: CreditCard, permission: 'payment_method.view' },
      { to: '/admin/users', label: 'អ្នកប្រើប្រាស់', icon: Users, permission: 'user.view' },
      { to: '/admin/roles', label: 'តួនាទី & សិទ្ធិ', icon: ShieldCheck, permission: 'role.view' },
      { to: '/admin/settings', label: 'ការកំណត់ក្រុមហ៊ុន', icon: SettingsIcon, permission: 'settings.view' },
    ],
  },
]

// Only show nav items the current user's role actually grants — settings.view
// isn't a real enforced permission on the backend (only settings.update is),
// so we treat "can see the settings page" as "can update it".
function canSeeItem(item) {
  if (!item.permission) return true
  if (item.permission === 'settings.view') return hasPermission('settings.update')
  return hasPermission(item.permission)
}

const visibleNav = computed(() =>
  nav
    .map((item) => {
      if (item.group) {
        const children = item.children.filter(canSeeItem)
        return children.length ? { ...item, children } : null
      }
      return canSeeItem(item) ? item : null
    })
    .filter(Boolean)
)

// Single boolean, not a generic multi-group map — there is currently only
// one collapsible group ("ការកំណត់"), so a plain ref is simpler and
// leaves no room for the kind of per-group-key reactivity mistake the
// previous version had.
const settingsExpanded = ref(false)

// Auto-EXPANDS (never auto-collapses) whenever navigation lands inside
// the settings group — a bookmark, a reload, or a link from somewhere
// other than this sidebar. Deliberately one-directional: toggleGroup()
// below can still collapse it manually even while already on one of its
// pages, since this watcher only ever sets true, and only re-runs when
// the PATH itself changes (not on every render).
watch(
  () => route.path,
  (path) => {
    const settingsGroup = nav.find((item) => item.group)
    if (settingsGroup?.children.some((child) => path.startsWith(child.to))) {
      settingsExpanded.value = true
    }
  },
  { immediate: true }
)

function toggleGroup() {
  settingsExpanded.value = !settingsExpanded.value
}

async function handleLogout() {
  logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
