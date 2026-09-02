<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h1 class="font-sans font-bold text-2xl">បដារទំព័រដើម</h1>
    </div>
    <p class="text-sm text-muted mb-6">រូបភាពទាំងនេះបង្ហាញនៅក្នុង Swiper នៅផ្នែកខាងលើទំព័រដើម។ បើកសកម្មភាព ដើម្បីឱ្យវាបង្ហាញនៅលើគេហទំព័រ។</p>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 3" :key="n" class="h-24 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else class="space-y-3 mb-6">
      <div v-for="(b, i) in banners" :key="b.id" class="card-surface p-3 flex items-center gap-4">
        <div class="relative w-28 aspect-[16/9] rounded-lg overflow-hidden bg-cream-dark shrink-0 group">
          <img v-if="b.imageUrl" :src="b.imageUrl" class="w-full h-full object-cover" loading="lazy" />
          <div v-if="b.uploading" class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 :size="16" class="animate-spin text-white" />
          </div>
          <template v-else>
            <label class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer" aria-label="ជំនួសរូបភាព">
              <Upload :size="16" class="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onReplaceImage(b, $event)" />
            </label>
            <button
              v-if="b.imageUrl"
              type="button"
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="លុបរូបភាព"
              @click.stop="removeBannerImage(b)"
            >
              <X :size="12" />
            </button>
          </template>
        </div>

        <div class="flex-1 min-w-0">
          <input
            v-model="b.alt"
            type="text"
            placeholder="ពិពណ៌នារូបភាព (alt text)"
            class="input-field text-sm py-1.5 mb-2"
            @blur="saveField(b)"
          />
          <label class="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" class="accent-ink" :checked="b.isActive" @change="toggleActive(b, $event.target.checked)" />
            សកម្ម (បង្ហាញនៅលើគេហទំព័រ)
          </label>
        </div>

        <div class="flex flex-col items-center gap-1 shrink-0">
          <button type="button" class="p-1.5 hover:bg-cream-dark rounded-lg disabled:opacity-30" :disabled="i === 0" aria-label="ផ្លាស់ទីឡើងលើ" @click="move(i, -1)">
            <ChevronUp :size="16" />
          </button>
          <button type="button" class="p-1.5 hover:bg-cream-dark rounded-lg disabled:opacity-30" :disabled="i === banners.length - 1" aria-label="ផ្លាស់ទីចុះក្រោម" @click="move(i, 1)">
            <ChevronDown :size="16" />
          </button>
        </div>

        <button type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600 shrink-0" aria-label="លុប" @click="toDelete = b">
          <Trash2 :size="16" :stroke-width="1.8" />
        </button>
      </div>

      <div v-if="!banners.length" class="text-center py-16 border border-dashed border-line rounded-card">
        <p class="text-sm text-muted">មិនទាន់មានបដារទេ។ បន្ថែមមួយខាងក្រោម។</p>
      </div>
    </div>

    <label class="inline-flex items-center gap-2 btn-secondary cursor-pointer">
      <Loader2 v-if="uploading" :size="16" class="animate-spin" />
      <Plus v-else :size="16" :stroke-width="2" />
      {{ uploading ? 'កំពុងផ្ទុក…' : 'បន្ថែមបដារថ្មី' }}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" :disabled="uploading" @change="onImageChosen" />
    </label>
    <p v-if="error" class="text-sm text-red-600 mt-3">{{ error }}</p>

    <ConfirmDialog
      :open="!!toDelete"
      title="លុបបដារនេះ?"
      message="សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'banner.view' })

import { ref, onMounted } from 'vue'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Upload, X } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useStore } from '~/composables/useStore'
import { keyFromUrl } from '~/composables/useImageKey'

const { listBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage, deleteBannerImage } = useAdmin()
const { showToast } = useStore()

const banners = ref([])
const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const toDelete = ref(null)

async function load() {
  loading.value = true
  try {
    banners.value = await listBanners()
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកបដារបានទេ')
  } finally {
    loading.value = false
  }
}

async function onImageChosen(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const uploaded = await uploadBannerImage(file)
    const nextOrder = banners.value.length ? Math.max(...banners.value.map((b) => b.sortOrder)) + 1 : 1
    const created = await createBanner({
      imageUrl: uploaded.url,
      alt: '',
      sortOrder: nextOrder,
      isActive: true,
    })
    banners.value.push(created)
    showToast('បានបន្ថែមបដារថ្មីរួចរាល់')
  } catch (err) {
    error.value = err.message || 'មិនអាចផ្ទុក ឬបង្កើតបដារបានទេ'
  } finally {
    uploading.value = false
  }
}

async function saveField(b) {
  try {
    await updateBanner(b.id, { imageUrl: b.imageUrl, alt: b.alt, linkUrl: b.linkUrl || '', sortOrder: b.sortOrder, isActive: b.isActive })
  } catch (e) {
    showToast(e.message || 'មិនអាចរក្សាទុកបានទេ')
  }
}

// Replace this banner's image in place — uploads the new one, saves it onto
// the banner, then deletes the old file from R2.
async function onReplaceImage(b, e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const previousUrl = b.imageUrl
  b.uploading = true
  try {
    const uploaded = await uploadBannerImage(file)
    b.imageUrl = uploaded.url
    await saveField(b)
    const oldKey = keyFromUrl(previousUrl)
    if (oldKey) deleteBannerImage(oldKey).catch(() => {})
  } catch (err) {
    showToast(err.message || 'មិនអាចផ្ទុករូបភាពថ្មីបានទេ')
  } finally {
    b.uploading = false
  }
}

// Clears this banner's image (and deletes it from R2) without deleting the
// whole banner entry — the alt text / order / active state stay intact.
async function removeBannerImage(b) {
  const url = b.imageUrl
  b.imageUrl = ''
  await saveField(b)
  const key = keyFromUrl(url)
  if (key) {
    try {
      await deleteBannerImage(key)
    } catch (err) {
      showToast(err.message || 'មិនអាចលុបរូបភាពពី R2 បានទេ')
    }
  }
}

async function toggleActive(b, checked) {
  b.isActive = checked
  await saveField(b)
}

async function move(i, dir) {
  const j = i + dir
  if (j < 0 || j >= banners.value.length) return
  const a = banners.value[i]
  const c = banners.value[j]
  ;[a.sortOrder, c.sortOrder] = [c.sortOrder, a.sortOrder]
  ;[banners.value[i], banners.value[j]] = [banners.value[j], banners.value[i]]
  await Promise.all([saveField(a), saveField(c)])
}

async function confirmDelete() {
  const b = toDelete.value
  toDelete.value = null
  try {
    await deleteBanner(b.id)
    if (b.imageUrl) {
      const key = keyFromUrl(b.imageUrl)
      if (key) deleteBannerImage(key).catch(() => {})
    }
    banners.value = banners.value.filter((x) => x.id !== b.id)
    showToast('បានលុបបដារ')
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបបានទេ')
  }
}

onMounted(load)
</script>
