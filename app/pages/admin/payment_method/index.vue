<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-2">វិធីទូទាត់</h1>
    <p class="text-sm text-muted mb-6">
      គ្រប់គ្រងវិធីទូទាត់ដែលអតិថិជនអាចប្រើនៅពេលទិញទំនិញ។ ជ្រើសរើសមួយជា "លំនាំដើម" ដែលនឹងត្រូវបានជ្រើសរើសស្រាប់នៅពេលទិញទំនិញ។
    </p>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-24 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else class="space-y-3">
      <div v-for="(pm, i) in methods" :key="pm.id" class="card-surface p-4 flex items-center gap-4">
        <!-- Logo -->
        <div class="relative w-16 h-16 rounded-lg overflow-hidden bg-cream-dark shrink-0 group border border-line">
          <img v-if="pm.imageUrl" :src="pm.imageUrl" class="w-full h-full object-contain p-2" loading="lazy" />
          <div v-else class="w-full h-full flex items-center justify-center text-muted">
            <ImageIcon :size="20" />
          </div>
          <div v-if="pm.uploading" class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 :size="16" class="animate-spin text-white" />
          </div>
          <template v-else>
            <label class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer" aria-label="ផ្លាស់ប្តូររូបសញ្ញា">
              <Upload :size="16" class="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onImageChosen(pm, $event)" />
            </label>
            <button
              v-if="pm.imageUrl"
              type="button"
              class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-red-600 hover:bg-red-50"
              aria-label="លុបរូបសញ្ញា"
              @click.stop="removeImage(pm)"
            >
              <X :size="12" :stroke-width="2.5" />
            </button>
          </template>
        </div>

        <!-- Name + code -->
        <div class="flex-1 min-w-0">
          <input
            v-model="pm.name"
            type="text"
            class="input-field text-sm py-1.5 mb-2 max-w-xs"
            @blur="saveField(pm)"
          />
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-xs text-muted font-mono">{{ pm.code }}</span>
            <label class="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input type="checkbox" class="accent-ink" :checked="pm.enabled" @change="toggleEnabled(pm, $event.target.checked)" />
              បើកដំណើរការ
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer" :class="pm.isPrimary ? 'text-rust font-medium' : 'text-muted'">
              <input type="radio" name="primary-payment-method" class="accent-rust" :checked="pm.isPrimary" @change="setPrimary(pm)" />
              លំនាំដើម
            </label>
          </div>
        </div>

        <!-- Reorder -->
        <div class="flex flex-col items-center gap-1 shrink-0">
          <button type="button" class="p-1.5 hover:bg-cream-dark rounded-lg disabled:opacity-30" :disabled="i === 0" aria-label="ផ្លាស់ទីឡើងលើ" @click="move(i, -1)">
            <ChevronUp :size="16" />
          </button>
          <button type="button" class="p-1.5 hover:bg-cream-dark rounded-lg disabled:opacity-30" :disabled="i === methods.length - 1" aria-label="ផ្លាស់ទីចុះក្រោម" @click="move(i, 1)">
            <ChevronDown :size="16" />
          </button>
        </div>
      </div>

      <div v-if="!methods.length" class="text-center py-16 border border-dashed border-line rounded-card">
        <p class="text-sm text-muted">មិនទាន់មានវិធីទូទាត់ទេ។</p>
      </div>
    </div>

    <p v-if="!methods.some((m) => m.enabled)" class="text-xs text-red-600 mt-4">
      ការព្រមាន៖ បើគ្មានវិធីទូទាត់ណាមួយបើកទេ អតិថិជននឹងមិនអាចដាក់ការបញ្ជាទិញបានទេ។
    </p>
    <p v-if="error" class="text-sm text-red-600 mt-3">{{ error }}</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'payment_method.update' })

import { ref, onMounted } from 'vue'
import { Loader2, Upload, X, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-vue-next'
import { useAdminPaymentMethods } from '~/composables/useAdminPaymentMethods'
import { useAdmin } from '~/composables/useAdmin'
import { keyFromUrl } from '~/composables/useImageKey'
import { useStore } from '~/composables/useStore'

const { listPaymentMethods, updatePaymentMethod } = useAdminPaymentMethods()
const { uploadPaymentMethodImage, deletePaymentMethodImage } = useAdmin()
const { showToast } = useStore()

const methods = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    // Payment methods are a small, fixed set (cash/PPCBank) — a
    // single page comfortably covers all of them without needing real
    // pagination controls in the UI, but the request still goes through
    // the same paginated admin endpoint every other admin list uses, for
    // consistency and in case more methods are ever added.
    const res = await listPaymentMethods({ page: 1, pageSize: 50 })
    methods.value = (res.data || []).map((m) => ({ ...m, uploading: false }))
  } catch (e) {
    error.value = e.message || 'មិនអាចទាញយកវិធីទូទាត់បានទេ'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function patchOf(pm) {
  return { name: pm.name, imageUrl: pm.imageUrl, enabled: pm.enabled, isPrimary: pm.isPrimary, sortOrder: pm.sortOrder }
}

async function saveField(pm) {
  try {
    await updatePaymentMethod(pm.id, patchOf(pm))
  } catch (e) {
    error.value = e.message || 'មិនអាចរក្សាទុកបានទេ'
  }
}

async function toggleEnabled(pm, checked) {
  const previous = pm.enabled
  pm.enabled = checked
  try {
    await updatePaymentMethod(pm.id, patchOf(pm))
  } catch (e) {
    pm.enabled = previous
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

// Only one payment method is ever primary — optimistically clear it on
// every other row locally so the radio group updates instantly, matching
// what the backend enforces server-side regardless (see
// PaymentMethodRepository.ClearPrimary).
async function setPrimary(pm) {
  const previous = methods.value.map((m) => m.isPrimary)
  methods.value.forEach((m) => { m.isPrimary = m.id === pm.id })
  try {
    await updatePaymentMethod(pm.id, patchOf(pm))
  } catch (e) {
    methods.value.forEach((m, i) => { m.isPrimary = previous[i] })
    showToast(e.message || 'មិនអាចកំណត់លំនាំដើមបានទេ')
  }
}

// Same pattern as categories.vue's image upload — uploads the new file,
// saves it onto the payment method immediately (not just staged in local
// form state, since there's no separate "save" step on this page — every
// field here saves itself on change), then cleans up whatever image it
// replaced so nothing is left orphaned in R2.
async function onImageChosen(pm, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const previousUrl = pm.imageUrl
  pm.uploading = true
  try {
    const result = await uploadPaymentMethodImage(file)
    pm.imageUrl = result.url
    await updatePaymentMethod(pm.id, patchOf(pm))
    if (previousUrl) {
      const oldKey = keyFromUrl(previousUrl)
      if (oldKey) deletePaymentMethodImage(oldKey).catch(() => {})
    }
  } catch (e) {
    showToast(e.message || 'មិនអាចផ្ទុករូបភាពបានទេ')
  } finally {
    pm.uploading = false
  }
}

// Explicit "clear image" action — this is the piece that was actually
// missing before: resets imageUrl back to empty (the select then falls
// back to the generic code-based icon) and deletes the R2 object, rather
// than requiring a full re-upload to change your mind.
async function removeImage(pm) {
  const oldUrl = pm.imageUrl
  pm.imageUrl = ''
  try {
    await updatePaymentMethod(pm.id, patchOf(pm))
    const oldKey = keyFromUrl(oldUrl)
    if (oldKey) deletePaymentMethodImage(oldKey).catch(() => {})
  } catch (e) {
    pm.imageUrl = oldUrl
    showToast(e.message || 'មិនអាចលុបរូបភាពបានទេ')
  }
}

// Reordering swaps sortOrder between the two affected rows and saves
// both — same pattern as banners.vue's move(), just persisted via
// sortOrder instead of an array-position PATCH.
async function move(index, direction) {
  const target = index + direction
  if (target < 0 || target >= methods.value.length) return
  const a = methods.value[index]
  const b = methods.value[target]
  const tempOrder = a.sortOrder
  a.sortOrder = b.sortOrder
  b.sortOrder = tempOrder
  ;[methods.value[index], methods.value[target]] = [methods.value[target], methods.value[index]]
  try {
    await Promise.all([updatePaymentMethod(a.id, patchOf(a)), updatePaymentMethod(b.id, patchOf(b))])
  } catch (e) {
    showToast(e.message || 'មិនអាចផ្លាស់ប្តូរលំដាប់បានទេ')
    await load()
  }
}
</script>
