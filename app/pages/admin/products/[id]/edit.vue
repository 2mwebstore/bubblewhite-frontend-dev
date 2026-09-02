<template>
  <div class="max-w-2xl">
    <NuxtLink to="/admin/products" class="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-4">
      <ChevronLeft :size="16" /> ត្រឡប់ទៅផលិតផល
    </NuxtLink>
    <h1 class="font-sans font-bold text-2xl mb-6">{{ isEdit ? 'កែប្រែផលិតផល' : 'បន្ថែមផលិតផលថ្មី' }}</h1>

    <div v-if="loadingProduct" class="space-y-3">
      <div class="h-10 bg-cream-dark rounded animate-pulse" />
      <div class="h-10 bg-cream-dark rounded animate-pulse" />
      <div class="h-32 bg-cream-dark rounded animate-pulse" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="submit">
      <!-- Images -->
      <div>
        <p class="text-xs font-medium mb-2">រូបភាព (អាចជ្រើសរើសច្រើនក្នុងពេលតែមួយ)</p>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <div v-for="(img, i) in images" :key="img.url" class="relative aspect-square rounded-card overflow-hidden group">
            <img :src="img.url" class="w-full h-full object-cover" loading="lazy" />
            <div v-if="img.deleting" class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 :size="16" class="animate-spin text-white" />
            </div>
            <button
              v-else
              type="button"
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="លុបរូបភាព"
              @click="removeImage(i)"
            >
              <X :size="14" />
            </button>
          </div>
          <label class="aspect-square rounded-card border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ink transition-colors">
            <Loader2 v-if="uploading" :size="18" class="animate-spin" />
            <ImagePlus v-else :size="18" :stroke-width="1.6" />
            <span class="text-[10px] text-muted">{{ uploading ? `${uploadProgress.done}/${uploadProgress.total}` : 'បន្ថែម' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" :disabled="uploading" @change="onImagesChosen" />
          </label>
        </div>
        <p v-if="uploadError" class="text-xs text-red-600 mt-2">{{ uploadError }}</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <SearchableSelect
            v-model="form.category"
            :options="categoryOptions"
            label="ប្រភេទ"
            required
            placeholder="ជ្រើសរើសប្រភេទ"
            :clearable="false"
          />
          <FieldError :message="fieldErrors.category" />
        </div>
        <div>
          <FormLabel text="លេខសម្គាល់ (ID)" required for-id="product-id" />
          <input
            id="product-id"
            v-model="form.id"
            type="text"
            :disabled="isEdit"
            required
            placeholder="ជ្រើសរើសប្រភេទសិន"
            class="input-field text-sm"
            :class="fieldErrors.id ? 'border-red-400' : ''"
          />
          <p v-if="!isEdit" class="text-xs text-muted mt-1">បង្កើតដោយស្វ័យប្រវត្តិពីប្រភេទ — អាចកែប្រែបាន</p>
          <FieldError :message="fieldErrors.id" />
        </div>
      </div>

      <div>
        <FormLabel text="ឈ្មោះផលិតផល" required for-id="product-name" />
        <input
          id="product-name"
          v-model="form.name"
          type="text"
          required
          class="input-field text-sm"
          :class="fieldErrors.name ? 'border-red-400' : ''"
        />
        <FieldError :message="fieldErrors.name" />
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <FormLabel text="តម្លៃ ($)" required for-id="product-price" />
          <input
            id="product-price"
            v-model.number="form.price"
            type="number"
            min="0"
            step="0.01"
            required
            class="input-field text-sm"
            :class="fieldErrors.price ? 'border-red-400' : ''"
          />
          <FieldError :message="fieldErrors.price" />
        </div>
        <div>
          <FormLabel text="តម្លៃប្រៀបធៀប (ស្រេចចិត្ត)" for-id="product-compare-at" />
          <input id="product-compare-at" v-model.number="form.compareAt" type="number" min="0" step="0.01" class="input-field text-sm" />
        </div>
        <div>
          <FormLabel text="ស្លាក (ស្រេចចិត្ត)" for-id="product-badge" />
          <input id="product-badge" v-model="form.badge" type="text" placeholder="ថ្មី / -10%" class="input-field text-sm" />
        </div>
      </div>

      <div>
        <FormLabel text="ទំហំ (Enter ដើម្បីបន្ថែម)" />
        <div class="flex flex-wrap gap-2 mb-2">
          <span v-for="(s, i) in form.sizes" :key="s" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-dark text-sm">
            {{ s }}
            <button type="button" aria-label="remove" @click="form.sizes.splice(i, 1)"><X :size="12" /></button>
          </span>
        </div>
        <input v-model="sizeInput" type="text" placeholder="S, M, L, XL…" class="input-field text-sm" @keydown.enter.prevent="addSize" />
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.featured" type="checkbox" class="accent-ink" /> ផលិតផលពិសេស (Featured)
      </label>

      <div>
        <RichTextEditor v-model="form.description" label="ការពិពណ៌នា" placeholder="សរសេរការពិពណ៌នាផលិតផល…" />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <button type="submit" class="btn-primary" :disabled="saving">
          <Loader2 v-if="saving" :size="16" class="animate-spin" />
          {{ saving ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក' }}
        </button>
        <NuxtLink to="/admin/products" class="btn-secondary">បោះបង់</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'product.update' })

import { reactive, ref, computed, watch, onMounted } from 'vue'

import { ChevronLeft, ImagePlus, X, Loader2 } from 'lucide-vue-next'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import RichTextEditor from '~/components/admin/RichTextEditor.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useStore } from '~/composables/useStore'
import { keyFromUrl } from '~/composables/useImageKey'
import { runWithConcurrencyLimit } from '~/composables/useConcurrencyLimit'
import { useFieldErrors } from '~/composables/useFieldErrors'

const route = useRoute()
const router = useRouter()
const { getProduct, createProduct, updateProduct, uploadProductImage, deleteProductImage, listCategories, listProducts } = useAdmin()
const { showToast } = useStore()
const { fieldErrors, setFromError, clear: clearFieldError, watchField } = useFieldErrors()

const isEdit = !!route.params.id
const categories = ref([])
const categoryOptions = computed(() => categories.value.map((c) => ({ value: c.slug, label: c.name })))
const loadingProduct = ref(isEdit)
const saving = ref(false)
const uploading = ref(false)
const uploadProgress = reactive({ done: 0, total: 0 })
const uploadError = ref('')
const error = ref('')
const sizeInput = ref('')

// Each entry is { url, key, deleting }. `key` is set either from a fresh
// upload this session, or derived from the URL for images already saved on
// the product — R2 keys are just the URL's path, so either way clicking X
// can issue a real DELETE and not leave the file orphaned in the bucket.
const images = ref([])
const form = reactive({
  id: '',
  name: '',
  price: 0,
  compareAt: null,
  category: '',
  badge: '',
  featured: false,
  sizes: [],
  description: '',
})

// Clear a field's server-side error the moment the admin edits it, instead
// of it lingering until the next submit attempt.
watchField(() => form.id, 'id')
watchField(() => form.category, 'category')
watchField(() => form.name, 'name')
watchField(() => form.price, 'price')

// Auto-generate the ID and a starter name from the selected category, e.g.
// picking "Hoodies" (slug "hoodies") suggests id "hoodies-0001" and name
// "អាវហ៊ូឌី 0001". The 4-digit count comes from how many products already
// exist in that category, so it naturally increments by one every time a
// product actually gets created there — no separate counter to maintain.
// Both fields stay fully editable; this only runs when creating a new
// product (in edit mode the ID is locked anyway, and re-suggesting a name
// would clobber real edits).
watch(
  () => form.category,
  async (slug) => {
    if (isEdit || !slug) return
    const category = categories.value.find((c) => c.slug === slug)
    if (!category) return
    try {
      const { meta } = await listProducts({ category: slug, pageSize: 1 })
      const nextCount = (meta?.total || 0) + 1
      const padded = String(nextCount).padStart(4, '0')
      form.id = `${slug}-${padded}`
      form.name = `${category.name} ${padded}`
    } catch {
      // Non-critical — the admin can still type the ID/name manually.
    }
  }
)

function addSize() {
  const v = sizeInput.value.trim()
  if (v && !form.sizes.includes(v)) form.sizes.push(v)
  sizeInput.value = ''
}

// R2 object keys are exactly the URL's path (minus the leading slash) —
// works regardless of custom domain, since it's whatever comes after the host.

async function removeImage(i) {
  const img = images.value[i]
  const key = img.key || keyFromUrl(img.url)
  if (key) {
    img.deleting = true
    try {
      await deleteProductImage(key)
    } catch (err) {
      showToast(err.message || 'មិនអាចលុបរូបភាពពី R2 បានទេ')
      // Still remove it from the form even if the R2 delete failed — the
      // admin explicitly asked to remove it, and it won't get saved onto
      // the product either way.
    }
  }
  images.value.splice(i, 1)
}

async function onImagesChosen(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  uploadError.value = ''
  uploading.value = true
  uploadProgress.total = files.length
  uploadProgress.done = 0
  try {
    // Capped at 4 concurrent uploads — firing all of them at once (the old
    // Promise.allSettled(files.map(...)) behavior) is what caused "no
    // response / Load failed" on most requests once someone selected more
    // than a handful of images at a time.
    const results = await runWithConcurrencyLimit(
      files,
      (f) => uploadProductImage(f),
      4,
      (done, total) => {
        uploadProgress.done = done
        uploadProgress.total = total
      }
    )
    const failures = []
    const newImages = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        newImages.push({ url: r.value.url, key: r.value.key, deleting: false })
      } else {
        failures.push(r.reason?.message || 'ការផ្ទុករូបភាពបានបរាជ័យ')
      }
    }
    // Newly uploaded images go to the FRONT — images[0] is the product's
    // thumbnail/primary image, so the most recently added image becomes
    // the new primary one instead of getting buried at the end. Order
    // among the new batch is preserved (results stay index-aligned to the
    // originally selected files regardless of which finished first).
    images.value = [...newImages, ...images.value]
    if (failures.length) {
      const uniqueFailures = [...new Set(failures)]
      uploadError.value = `បរាជ័យ ${failures.length}/${files.length}: ${uniqueFailures.slice(0, 3).join(' / ')}`
    }
  } finally {
    uploading.value = false
  }
}

async function submit() {
  error.value = ''
  clearFieldError()
  saving.value = true
  try {
    const payload = {
      id: form.id,
      name: form.name,
      price: form.price,
      compareAt: form.compareAt || null,
      category: form.category,
      badge: form.badge || null,
      featured: form.featured,
      sizes: form.sizes,
      images: images.value.map((i) => i.url),
      description: form.description,
    }
    if (isEdit) {
      await updateProduct(route.params.id, payload)
      showToast('បានកែប្រែផលិតផលរួចរាល់')
    } else {
      await createProduct(payload)
      showToast('បានបង្កើតផលិតផលថ្មីរួចរាល់')
    }
    router.push('/admin/products')
  } catch (e) {
    // Field-level validation errors (duplicate ID, missing category/price,
    // etc.) come back as { fieldName: "message" } — show each one under its
    // own field instead of a single generic message that doesn't say which
    // fields are actually wrong.
    setFromError(e)
    if (Object.keys(e.fieldErrors || {}).length === 0) {
      error.value = e.message || 'មិនអាចរក្សាទុកបានទេ'
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await listCategories().catch(() => [])

  if (isEdit) {
    try {
      const p = await getProduct(route.params.id)
      form.id = p.id
      form.name = p.name
      form.price = p.price
      form.compareAt = p.compareAt
      form.category = p.category
      form.badge = p.badge || ''
      form.featured = p.featured
      form.sizes = p.sizes || []
      images.value = (p.images || []).map((url) => ({ url, key: null, deleting: false }))
      form.description = p.description || ''
    } catch (e) {
      error.value = 'មិនអាចទាញយកទិន្នន័យផលិតផលបានទេ'
    } finally {
      loadingProduct.value = false
    }
  }
})
</script>
