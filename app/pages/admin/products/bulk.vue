<template>
  <div class="max-w-2xl">
    <NuxtLink to="/admin/products" class="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-4">
      <ChevronLeft :size="16" /> ត្រឡប់ទៅផលិតផល
    </NuxtLink>
    <h1 class="font-sans font-bold text-2xl mb-1">បង្កើតផលិតផលច្រើនតាមរូបភាព</h1>
    <p class="text-sm text-muted mb-6">កំណត់ព័ត៌មានរួម ១ដង រួចផ្ទុករូបភាពច្រើន — រូបភាពនីមួយៗនឹងក្លាយជាផលិតផលមួយ ដោយស្វ័យប្រវត្តិកំណត់លេខសម្គាល់ និងឈ្មោះតាមប្រភេទ។</p>

    <form class="space-y-6" @submit.prevent="submit">
      <!-- Shared fields -->
      <div class="card-surface p-4 space-y-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">ព័ត៌មានរួម (សម្រាប់ផលិតផលទាំងអស់)</p>

        <div>
          <SearchableSelect
            v-model="shared.category"
            :options="categoryOptions"
            label="ប្រភេទ"
            required
            placeholder="ជ្រើសរើសប្រភេទ"
            :clearable="false"
          />
          <FieldError :message="fieldErrors.category" />
        </div>

        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <FormLabel text="តម្លៃ ($)" required for-id="bulk-price" />
            <input id="bulk-price" v-model.number="shared.price" type="number" min="0" step="0.01" required class="input-field text-sm" :class="fieldErrors.price ? 'border-red-400' : ''" />
            <FieldError :message="fieldErrors.price" />
          </div>
          <div>
            <FormLabel text="តម្លៃប្រៀបធៀប (ស្រេចចិត្ត)" for-id="bulk-compare-at" />
            <input id="bulk-compare-at" v-model.number="shared.compareAt" type="number" min="0" step="0.01" class="input-field text-sm" />
          </div>
          <div>
            <FormLabel text="ស្លាក (ស្រេចចិត្ត)" for-id="bulk-badge" />
            <input id="bulk-badge" v-model="shared.badge" type="text" placeholder="ថ្មី / -10%" class="input-field text-sm" />
          </div>
        </div>

        <div>
          <FormLabel text="ទំហំ (Enter ដើម្បីបន្ថែម)" />
          <div class="flex flex-wrap gap-2 mb-2">
            <span v-for="(s, i) in shared.sizes" :key="s" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-dark text-sm">
              {{ s }}
              <button type="button" aria-label="remove" @click="shared.sizes.splice(i, 1)"><X :size="12" /></button>
            </span>
          </div>
          <input v-model="sizeInput" type="text" placeholder="S, M, L, XL…" class="input-field text-sm" @keydown.enter.prevent="addSize" />
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="shared.featured" type="checkbox" class="accent-ink" /> ផលិតផលពិសេស (Featured) — អនុវត្តលើផលិតផលទាំងអស់
        </label>

        <div>
          <RichTextEditor v-model="shared.description" label="ការពិពណ៌នា (ស្រេចចិត្ត)" placeholder="ការពិពណ៌នារួមសម្រាប់ផលិតផលទាំងអស់…" />
        </div>
      </div>

      <!-- Images -> products -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted mb-2">រូបភាព (រូបភាពនីមួយៗ = ផលិតផលមួយ)</p>

        <div v-if="entries.length" class="space-y-2 mb-3">
          <div
            v-for="(entry, i) in entries"
            :key="entry.id"
            class="flex items-center gap-3 card-surface p-2"
          >
            <div class="w-14 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
              <img :src="entry.previewUrl" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ entry.previewName }}</p>
              <p class="text-xs text-muted truncate">{{ entry.file.name }}</p>
              <p v-if="entry.status === 'failed'" class="text-xs text-red-600 truncate">{{ entry.error }}</p>
            </div>
            <div class="shrink-0">
              <Loader2 v-if="entry.status === 'working'" :size="18" class="animate-spin text-muted" />
              <CheckCircle2 v-else-if="entry.status === 'done'" :size="18" class="text-green-600" />
              <AlertCircle v-else-if="entry.status === 'failed'" :size="18" class="text-red-600" :title="entry.error" />
              <button v-else type="button" class="p-1 hover:bg-cream-dark rounded-lg" aria-label="លុប" @click="entries.splice(i, 1)">
                <X :size="16" />
              </button>
            </div>
          </div>
        </div>

        <label class="w-full flex flex-col items-center justify-center gap-1 py-8 rounded-card border-2 border-dashed border-line cursor-pointer hover:border-ink transition-colors">
          <UploadCloud :size="20" :stroke-width="1.6" />
          <span class="text-sm text-muted">ចុចដើម្បីជ្រើសរើសរូបភាពច្រើន</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" :disabled="submitting" @change="onFilesChosen" />
        </label>

        <p v-if="entries.length && shared.category" class="text-xs text-muted mt-2">
          នឹងបង្កើត: {{ previewIds.join(', ') }}
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="summary" class="text-sm text-rust">{{ summary }}</p>

      <div class="flex items-center gap-3">
        <button type="submit" class="btn-primary" :disabled="submitting || !entries.length">
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ submitting ? `កំពុងបង្កើត (${doneCount}/${entries.length})…` : `បង្កើតផលិតផល (${entries.length})` }}
        </button>
        <NuxtLink to="/admin/products" class="btn-secondary">បោះបង់</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'product.create' })

import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import { ChevronLeft, UploadCloud, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import RichTextEditor from '~/components/admin/RichTextEditor.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useStore } from '~/composables/useStore'
import { useFieldErrors } from '~/composables/useFieldErrors'

const router = useRouter()
const { listCategories, listProducts, createProduct, uploadProductImage } = useAdmin()
const { showToast } = useStore()
const { fieldErrors, setFromError, clear: clearFieldError, watchField } = useFieldErrors()

const categories = ref([])
const categoryOptions = computed(() => categories.value.map((c) => ({ value: c.slug, label: c.name })))

const shared = reactive({
  category: '',
  price: 0,
  compareAt: null,
  badge: '',
  sizes: [],
  featured: false,
  description: '',
})
const sizeInput = ref('')

watchField(() => shared.category, 'category')
watchField(() => shared.price, 'price')

function addSize() {
  const v = sizeInput.value.trim()
  if (v && !shared.sizes.includes(v)) shared.sizes.push(v)
  sizeInput.value = ''
}

// Each entry: { id, file, previewUrl (object URL, revoked on cleanup),
// previewName (the id/name this image WILL get), status }.
let uid = 0
const entries = ref([])

function onFilesChosen(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  for (const file of files) {
    entries.value.push({
      id: ++uid,
      file,
      previewUrl: URL.createObjectURL(file),
      previewName: '',
      status: 'pending',
    })
  }
}

onBeforeUnmount(() => {
  entries.value.forEach((entry) => URL.revokeObjectURL(entry.previewUrl))
})

// The category slug/name currently selected, resolved to the actual
// Category object so we can read its display name.
const selectedCategory = computed(() => categories.value.find((c) => c.slug === shared.category) || null)

// Live preview of the IDs about to be created — recomputes whenever the
// category or the pending image list changes, using the same "existing
// count in this category + 1, incrementing per image" logic submit() uses.
const startCount = ref(1)
async function refreshStartCount() {
  if (!shared.category) {
    startCount.value = 1
    return
  }
  try {
    const { meta } = await listProducts({ category: shared.category, pageSize: 1 })
    startCount.value = (meta?.total || 0) + 1
  } catch {
    startCount.value = 1
  }
}
watch(() => shared.category, refreshStartCount, { immediate: true })

const previewIds = computed(() => {
  if (!selectedCategory.value) return []
  return entries.value.map((_, i) => `${shared.category}-${String(startCount.value + i).padStart(4, '0')}`)
})

const doneCount = computed(() => entries.value.filter((e) => e.status === 'done').length)
const submitting = ref(false)
const error = ref('')
const summary = ref('')

async function submit() {
  error.value = ''
  summary.value = ''
  clearFieldError()

  if (!shared.category) {
    error.value = 'សូមជ្រើសរើសប្រភេទសិន'
    return
  }
  if (!entries.value.length) {
    error.value = 'សូមផ្ទុករូបភាពយ៉ាងហោចណាស់មួយ'
    return
  }

  submitting.value = true
  await refreshStartCount()

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < entries.value.length; i++) {
    const entry = entries.value[i]
    if (entry.status === 'done') {
      successCount++
      continue
    }
    entry.status = 'working'

    const padded = String(startCount.value + successCount + failCount).padStart(4, '0')
    const id = `${shared.category}-${padded}`
    const name = `${selectedCategory.value?.name || shared.category} ${padded}`
    entry.previewName = id

    try {
      const uploaded = await uploadProductImage(entry.file)
      await createProduct({
        id,
        name,
        price: shared.price,
        compareAt: shared.compareAt || null,
        category: shared.category,
        badge: shared.badge || null,
        featured: shared.featured,
        sizes: shared.sizes,
        images: [uploaded.url],
        description: shared.description,
      })
      entry.status = 'done'
      successCount++
    } catch (err) {
      entry.status = 'failed'
      entry.error = err.message || 'មិនអាចបង្កើតបានទេ'
      if (err.fieldErrors) setFromError(err)
      failCount++
      // A failure on one image (e.g. an ID collision) shouldn't stop the
      // rest of the batch — keep going and report it per-image so the
      // admin can see exactly which ones need a retry.
    }
  }

  submitting.value = false
  if (failCount === 0) {
    showToast(`បានបង្កើតផលិតផល ${successCount} ដោយជោគជ័យ`)
    router.push('/admin/products')
  } else {
    summary.value = `បានបង្កើត ${successCount} ជោគជ័យ, ${failCount} បរាជ័យ — សូមព្យាយាមម្តងទៀតសម្រាប់ធាតុដែលបរាជ័យ។`
  }
}

onMounted(async () => {
  categories.value = await listCategories().catch(() => [])
})
</script>
