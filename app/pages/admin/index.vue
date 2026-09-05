<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-1">សួស្តី, {{ state.user?.name }} 👋</h1>
    <p class="text-sm text-muted mb-8">នេះជាទិដ្ឋភាពរួមនៃហាង BubbleWhite របស់អ្នក។</p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <div class="card-surface p-5">
        <p class="text-xs text-muted mb-1">ផលិតផលសរុប</p>
        <p class="text-2xl font-bold">{{ loading ? '…' : stats.products }}</p>
      </div>
      <div class="card-surface p-5">
        <p class="text-xs text-muted mb-1">ប្រភេទ</p>
        <p class="text-2xl font-bold">{{ loading ? '…' : stats.categories }}</p>
      </div>
      <div class="card-surface p-5">
        <p class="text-xs text-muted mb-1">សារមិនទាន់អាន</p>
        <p class="text-2xl font-bold">{{ loading ? '…' : stats.unreadContacts }}</p>
      </div>
      <div class="card-surface p-5">
        <p class="text-xs text-muted mb-1">អ្នកប្រើប្រាស់</p>
        <p class="text-2xl font-bold">{{ loading ? '…' : stats.users }}</p>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      <NuxtLink v-for="s in shortcuts" :key="s.to" :to="s.to" class="card-surface p-5 flex items-center gap-3 hover:border-ink transition-colors">
        <div class="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center shrink-0">
          <component :is="s.icon" :size="18" :stroke-width="1.8" />
        </div>
        <div>
          <p class="text-sm font-semibold">{{ s.label }}</p>
          <p class="text-xs text-muted">{{ s.desc }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

import { reactive, ref, onMounted, computed } from 'vue'

import { Package, Tags, Mail, Users, ShieldCheck, Settings as SettingsIcon } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { useAdmin } from '~/composables/useAdmin'

const { state, hasPermission } = useAuth()
const { listProducts, listCategories, listContacts, listUsers } = useAdmin()

const loading = ref(true)
const stats = reactive({ products: 0, categories: 0, unreadContacts: 0, users: 0 })

onMounted(async () => {
  try {
    const tasks = []
    if (hasPermission('product.view')) tasks.push(listProducts({ pageSize: 1 }).then((r) => (stats.products = r.meta?.total || 0)))
    if (hasPermission('category.view')) tasks.push(listCategories().then((r) => (stats.categories = r.length)))
    if (hasPermission('contact.view')) tasks.push(listContacts().then((r) => (stats.unreadContacts = r.filter((m) => !m.isRead).length)))
    if (hasPermission('user.view')) tasks.push(listUsers().then((r) => (stats.users = r.length)))
    await Promise.all(tasks)
  } finally {
    loading.value = false
  }
})

const shortcuts = computed(() =>
  [
    { to: '/admin/products/new', label: 'បន្ថែមផលិតផល', desc: 'បង្កើតផលិតផលថ្មី', icon: Package, permission: 'product.create' },
    { to: '/admin/categories', label: 'គ្រប់គ្រងប្រភេទ', desc: 'កែប្រែ ឬបន្ថែមប្រភេទ', icon: Tags, permission: 'category.view' },
    { to: '/admin/contacts', label: 'សារទំនាក់ទំនង', desc: 'មើលសាររបស់អតិថិជន', icon: Mail, permission: 'contact.view' },
    { to: '/admin/users', label: 'អ្នកប្រើប្រាស់', desc: 'គ្រប់គ្រងគណនីបុគ្គលិក', icon: Users, permission: 'user.view' },
    { to: '/admin/roles', label: 'តួនាទី & សិទ្ធិ', desc: 'កំណត់សិទ្ធិសម្រាប់តួនាទីនីមួយៗ', icon: ShieldCheck, permission: 'role.view' },
    { to: '/admin/settings', label: 'ការកំណត់ក្រុមហ៊ុន', desc: 'ព័ត៌មានក្រុមហ៊ុន និងទំនាក់ទំនង', icon: SettingsIcon, permission: 'settings.update' },
  ].filter((s) => hasPermission(s.permission))
)
</script>
