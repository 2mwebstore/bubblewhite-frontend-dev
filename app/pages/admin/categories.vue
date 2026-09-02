<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-bold text-2xl">ប្រភេទ</h1>
      <button v-if="hasPermission('category.create')" type="button" class="btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="2" /> បន្ថែមប្រភេទ
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input v-model="search" type="search" placeholder="ស្វែងរកតាមឈ្មោះ ឬ slug…" class="input-field text-sm sm:max-w-xs" />
      <SearchableSelect v-model="pageSize" :options="pageSizeOptions" :clearable="false" :searchable="false" class="sm:w-36" />
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="paged.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3 w-24">លំដាប់</th>
            <th class="text-left px-4 py-3">ប្រភេទ</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">Slug</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">លេខសម្គាល់ (ID)</th>
            <th class="px-4 py-3">សកម្ម</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="c in paged" :key="c.id" :class="!c.isActive ? 'opacity-50' : ''">
            <td class="px-4 py-3">
              <input
                type="number"
                :value="c.sortOrder"
                :disabled="!hasPermission('category.update') || savingOrderFor === c.id"
                class="input-field text-sm py-1.5 w-20"
                @change="onSortOrderChange(c, $event.target.value)"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-cream-dark overflow-hidden shrink-0">
                  <img v-if="c.image" :src="c.image" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <span class="font-medium">{{ c.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-muted">{{ c.slug }}</td>
            <td class="px-4 py-3 hidden md:table-cell text-muted">{{ c.id }}</td>
            <td class="px-4 py-3">
              <input
                type="checkbox"
                class="w-5 h-5 accent-rust"
                :checked="c.isActive"
                :disabled="!hasPermission('category.update')"
                aria-label="សកម្ម"
                @change="toggleActive(c, $event.target.checked)"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button v-if="hasPermission('category.update')" type="button" class="p-2 hover:bg-cream-dark rounded-lg" aria-label="កែប្រែ" @click="openEdit(c)">
                  <Pencil :size="16" :stroke-width="1.8" />
                </button>
                <button v-if="hasPermission('category.delete')" type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600" aria-label="លុប" @click="toDelete = c">
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
      <p class="text-sm text-muted">{{ search ? 'មិនមានប្រភេទត្រូវនឹងការស្វែងរករបស់អ្នកទេ' : 'មិនមានប្រភេទទេ។' }}</p>
    </div>

    <!-- Create/edit modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalOpen" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="modalOpen = false">
          <form class="bg-white rounded-card p-6 w-full max-w-sm space-y-4" @submit.prevent="submit">
            <p class="font-semibold">{{ editing ? 'កែប្រែប្រភេទ' : 'បន្ថែមប្រភេទថ្មី' }}</p>

            <div class="flex justify-center">
              <div class="relative w-20 h-20">
                <label class="block w-20 h-20 rounded-full bg-cream-dark overflow-hidden cursor-pointer flex items-center justify-center border-2 border-dashed border-line hover:border-ink transition-colors">
                  <img v-if="form.image" :src="form.image" class="w-full h-full object-cover" loading="lazy" />
                  <Loader2 v-else-if="uploading" :size="18" class="animate-spin" />
                  <ImagePlus v-else :size="18" :stroke-width="1.6" />
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" :disabled="uploading" @change="onImageChosen" />
                </label>
                <button
                  v-if="form.image"
                  type="button"
                  class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                  aria-label="លុបរូបភាព"
                  @click="removeImage"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>

            <div>
              <FormLabel text="ឈ្មោះប្រភេទ" required for-id="cat-name" />
              <input
                id="cat-name"
                v-model="form.name"
                type="text"
                required
                class="input-field text-sm"
                :class="fieldErrors.name ? 'border-red-400' : ''"
                @input="autoSlug"
              />
              <FieldError :message="fieldErrors.name" />
            </div>
            <div>
              <FormLabel text="Slug" required for-id="cat-slug" />
              <input
                id="cat-slug"
                v-model="form.slug"
                type="text"
                required
                class="input-field text-sm"
                :class="fieldErrors.slug ? 'border-red-400' : ''"
              />
              <FieldError :message="fieldErrors.slug" />
            </div>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-5 h-5 accent-rust" />
              សកម្ម (បង្ហាញនៅលើគេហទំព័រ)
            </label>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="modalOpen = false">បោះបង់</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក' }}</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="!!toDelete"
      :title="`លុប '${toDelete?.name}'?`"
      message="ផលិតផលនៅក្នុងប្រភេទនេះនឹងនៅតែមាន ប៉ុន្តែលែងមានប្រភេទដើម្បីត្រង។"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'category.view' })

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Plus, Pencil, Trash2, ImagePlus, X, Loader2 } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import AdminPagination from '~/components/admin/AdminPagination.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import { keyFromUrl } from '~/composables/useImageKey'
import { useFieldErrors } from '~/composables/useFieldErrors'

const { listCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, deleteCategoryImage } = useAdmin()
const { hasPermission } = useAuth()
const { showToast } = useStore()
const { fieldErrors, setFromError, clear: clearFieldError, watchField } = useFieldErrors()

const categories = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const toDelete = ref(null)

const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [
  { value: 10, label: '10 / ទំព័រ' },
  { value: 20, label: '20 / ទំព័រ' },
  { value: 50, label: '50 / ទំព័រ' },
]

// ID is auto-generated by the database now — the form never sets or sends it.
const form = reactive({ name: '', slug: '', image: '', sortOrder: 0, isActive: true })

watchField(() => form.name, 'name')
watchField(() => form.slug, 'slug')

// The backend's categories endpoint isn't paginated (categories are a small,
// bounded list) — search and pagination are applied client-side here.
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
// Same shape as the backend's PageMeta, so AdminPagination works the same
// way here as it does on server-paginated views like Products.
const meta = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  total: filtered.value.length,
  totalPage: totalPages.value,
}))

watch([search, pageSize], () => (page.value = 1))

function slugify(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function autoSlug() {
  if (!editing.value) form.slug = slugify(form.name)
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.image = ''
  form.isActive = true
  // New categories go to the end of the display order by default — the
  // admin can then reorder with the up/down buttons once it's created.
  form.sortOrder = categories.value.length
    ? Math.max(...categories.value.map((c) => c.sortOrder ?? 0)) + 1
    : 0
  error.value = ''
  clearFieldError()
  modalOpen.value = true
}

function openEdit(c) {
  editing.value = c
  form.name = c.name
  form.slug = c.slug
  form.image = c.image || ''
  form.sortOrder = c.sortOrder ?? 0
  form.isActive = c.isActive ?? true
  error.value = ''
  clearFieldError()
  modalOpen.value = true
}

async function onImageChosen(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploading.value = true
  const previousUrl = form.image
  try {
    const result = await uploadCategoryImage(file)
    form.image = result.url
    // Clean up the image being replaced so it doesn't sit orphaned in R2.
    if (previousUrl) {
      const oldKey = keyFromUrl(previousUrl)
      if (oldKey) deleteCategoryImage(oldKey).catch(() => {})
    }
  } catch (err) {
    error.value = err.message || 'មិនអាចផ្ទុករូបភាពបានទេ'
  } finally {
    uploading.value = false
  }
}

// Clears the image from the form (and deletes it from R2) without needing
// to replace it with a new one — separate from the upload/replace flow above.
async function removeImage() {
  const url = form.image
  form.image = ''
  const key = keyFromUrl(url)
  if (key) {
    try {
      await deleteCategoryImage(key)
    } catch (err) {
      showToast(err.message || 'មិនអាចលុបរូបភាពពី R2 បានទេ')
    }
  }
}

async function load() {
  loading.value = true
  try {
    categories.value = await listCategories()
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកប្រភេទបានទេ')
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  clearFieldError()
  saving.value = true
  try {
    const payload = { name: form.name, slug: form.slug, image: form.image, sortOrder: form.sortOrder, isActive: form.isActive }
    if (editing.value) {
      await updateCategory(editing.value.id, payload)
      showToast('បានកែប្រែប្រភេទរួចរាល់')
    } else {
      await createCategory(payload)
      showToast('បានបង្កើតប្រភេទថ្មីរួចរាល់')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    // Field-level validation errors (e.g. a duplicate slug) come back as
    // { slug: "..." } in e.fieldErrors — show each one under its own field
    // instead of just a generic message that doesn't say what's wrong.
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចរក្សាទុកបានទេ'
    }
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  const c = toDelete.value
  toDelete.value = null
  try {
    await deleteCategory(c.id)
    if (c.image) {
      const key = keyFromUrl(c.image)
      if (key) deleteCategoryImage(key).catch(() => {})
    }
    showToast(`បានលុប "${c.name}"`)
    load()
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបប្រភេទបានទេ')
  }
}

// Reorder via direct input — type a number, it saves on blur/Enter and the
// list re-sorts to match. Works correctly even while a search filter is
// active (unlike a relative up/down swap would), since it's setting an
// absolute value rather than depending on what's currently adjacent.
const savingOrderFor = ref(null)

async function onSortOrderChange(c, rawValue) {
  const value = parseInt(rawValue, 10)
  if (Number.isNaN(value) || value === c.sortOrder) return

  savingOrderFor.value = c.id
  const previous = c.sortOrder
  c.sortOrder = value
  try {
    await updateCategory(c.id, { name: c.name, slug: c.slug, image: c.image, sortOrder: value, isActive: c.isActive })
    // Re-sort the local list to match the new order immediately, instead
    // of waiting for the admin to manually refresh.
    categories.value = [...categories.value].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  } catch (e) {
    c.sortOrder = previous
    showToast(e.message || 'មិនអាចរក្សាទុកលំដាប់បានទេ')
  } finally {
    savingOrderFor.value = null
  }
}

// Quick on/off toggle directly in the list — same optimistic-update
// pattern as onSortOrderChange above, and same reasoning for sending the
// full field set: this is a PUT, not a partial patch, so every field has
// to be included or the omitted ones get reset to their zero value.
async function toggleActive(c, value) {
  const previous = c.isActive
  c.isActive = value
  try {
    await updateCategory(c.id, { name: c.name, slug: c.slug, image: c.image, sortOrder: c.sortOrder, isActive: value })
  } catch (e) {
    c.isActive = previous
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
