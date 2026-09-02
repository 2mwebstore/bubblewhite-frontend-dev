<template>
  <div>
    <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
      <h1 class="font-sans font-bold text-2xl">ផលិតផល</h1>
      <div v-if="hasPermission('product.create')" class="flex items-center gap-2">
        <NuxtLink to="/admin/products/bulk" class="btn-secondary">
          <Images :size="16" :stroke-width="2" /> បង្កើតច្រើនតាមរូបភាព
        </NuxtLink>
        <NuxtLink to="/admin/products/new" class="btn-primary">
          <Plus :size="16" :stroke-width="2" /> បន្ថែមផលិតផល
        </NuxtLink>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input v-model="search" type="search" placeholder="ស្វែងរកតាមឈ្មោះ…" class="input-field text-sm sm:max-w-xs" />
      <SearchableSelect
        v-model="category"
        :options="categoryOptions"
        show-all
        all-label="ប្រភេទទាំងអស់"
        placeholder="ប្រភេទទាំងអស់"
        :clearable="false"
        class="sm:w-48"
      />
      <SearchableSelect
        v-model="pageSize"
        :options="pageSizeOptions"
        :clearable="false"
        :searchable="false"
        class="sm:w-36"
      />
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 5" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="products.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3">ផលិតផល</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">ប្រភេទ</th>
            <th class="text-left px-4 py-3">តម្លៃ</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ស្ថានភាព</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="p in products" :key="p.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-cream-dark overflow-hidden shrink-0">
                  <img v-if="p.images?.[0]" :src="p.images[0]" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <span class="font-medium">{{ p.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-muted">{{ p.category }}</td>
            <td class="px-4 py-3">${{ p.price.toFixed(2) }}</td>
            <td class="px-4 py-3 hidden md:table-cell">
              <span v-if="p.featured" class="text-xs px-2 py-1 rounded-full bg-rust/10 text-rust">ពិសេស</span>
              <span v-if="p.badge" class="text-xs px-2 py-1 rounded-full bg-ink/10 ml-1">{{ p.badge }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink v-if="hasPermission('product.update')" :to="`/admin/products/${p.id}/edit`" class="p-2 hover:bg-cream-dark rounded-lg" aria-label="កែប្រែ">
                  <Pencil :size="16" :stroke-width="1.8" />
                </NuxtLink>
                <button v-if="hasPermission('product.delete')" type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600" aria-label="លុប" @click="askDelete(p)">
                  <Trash2 :size="16" :stroke-width="1.8" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :meta="meta" @change="(p) => (page = p)" />
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">មិនមានផលិតផលទេ។</p>
    </div>

    <ConfirmDialog
      :open="!!toDelete"
      :title="`លុប '${toDelete?.name}'?`"
      message="សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'product.view' })

import { ref, computed, watch, onMounted } from 'vue'

import { Plus, Images, Pencil, Trash2 } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import { keyFromUrl } from '~/composables/useImageKey'

const { listProducts, deleteProduct, deleteProductImage, listCategories } = useAdmin()
const { hasPermission } = useAuth()
const { showToast } = useStore()

const products = ref([])
const categories = ref([])
const search = ref('')
const category = ref('')
const page = ref(1)
const pageSize = ref(10)
const meta = ref(null)
const loading = ref(true)
const toDelete = ref(null)

const categoryOptions = computed(() => categories.value.map((c) => ({ value: c.slug, label: c.name })))
const pageSizeOptions = [
  { value: 10, label: '10 / ទំព័រ' },
  { value: 20, label: '20 / ទំព័រ' },
  { value: 50, label: '50 / ទំព័រ' },
]

let debounceTimer = null

async function load() {
  loading.value = true
  try {
    const { items, meta: m } = await listProducts({
      search: search.value.trim(),
      category: category.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    products.value = items
    meta.value = m
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកផលិតផលបានទេ')
  } finally {
    loading.value = false
  }
}

function askDelete(p) {
  toDelete.value = p
}

async function confirmDelete() {
  const p = toDelete.value
  toDelete.value = null
  try {
    await deleteProduct(p.id)
    // Clean up every image this product had in R2 — otherwise deleting the
    // product just leaves its files orphaned in the bucket forever.
    for (const url of p.images || []) {
      const key = keyFromUrl(url)
      if (key) deleteProductImage(key).catch(() => {})
    }
    showToast(`បានលុប "${p.name}"`)
    load()
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបផលិតផលបានទេ')
  }
}

watch([category, page], load)
watch(pageSize, () => {
  page.value = 1
  load()
})
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})

onMounted(async () => {
  categories.value = await listCategories().catch(() => [])
  load()
})
</script>
