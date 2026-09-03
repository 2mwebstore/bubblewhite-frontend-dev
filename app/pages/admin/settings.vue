<template>
  <div class="max-w-2xl">
    <h1 class="font-sans font-bold text-2xl mb-6">ការកំណត់ក្រុមហ៊ុន</h1>

    <div v-if="loading" class="space-y-3">
      <div class="h-10 bg-cream-dark rounded animate-pulse" />
      <div class="h-10 bg-cream-dark rounded animate-pulse" />
      <div class="h-32 bg-cream-dark rounded animate-pulse" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="submit">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-cream-dark overflow-hidden shrink-0 flex items-center justify-center">
          <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <label class="btn-secondary cursor-pointer">
          <Loader2 v-if="uploadingLogo" :size="16" class="animate-spin" />
          <Upload v-else :size="16" :stroke-width="1.8" />
          {{ uploadingLogo ? 'កំពុងផ្ទុក…' : 'ផ្ទុករូបសញ្ញា' }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" :disabled="uploadingLogo" @change="onLogoChosen" />
        </label>
        <button v-if="form.logoUrl" type="button" class="text-sm text-red-600 hover:underline" @click="removeLogo">លុបរូបសញ្ញា</button>
      </div>

      <div>
        <label class="text-xs font-medium block mb-1">ឈ្មោះក្រុមហ៊ុន</label>
        <input v-model="form.companyName" type="text" class="input-field text-sm" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1">ការពិពណ៌នាក្រុមហ៊ុន (ទំព័រអំពីយើង)</label>
        <textarea v-model="form.companyDetail" rows="4" class="input-field rounded-2xl text-sm"></textarea>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium block mb-1">អ៊ីមែលទំនាក់ទំនង</label>
          <input v-model="form.contactEmail" type="email" class="input-field text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1">លេខទូរស័ព្ទ</label>
          <input v-model="form.contactPhone" type="text" class="input-field text-sm" />
        </div>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium block mb-1">អាសយដ្ឋាន</label>
          <input v-model="form.contactAddress" type="text" class="input-field text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1">ម៉ោងធ្វើការ</label>
          <input v-model="form.workingHours" type="text" class="input-field text-sm" />
        </div>
      </div>

      <div class="border-t border-line pt-6">
        <p class="text-sm font-semibold mb-1">ទីតាំងហាង</p>
        <p class="text-xs text-muted mb-3">ចុចលើផែនទី ឬអូសម្ការសម្គាល់ ដើម្បីកំណត់ទីតាំងហាងរបស់អ្នក។</p>
        <div ref="mapContainer" class="w-full h-72 rounded-card border border-line overflow-hidden" />
        <div class="grid sm:grid-cols-3 gap-4 mt-3">
          <div>
            <label class="text-xs font-medium block mb-1">រយៈទទឹង (Latitude)</label>
            <input :value="form.latitude.toFixed(6)" type="text" readonly class="input-field text-sm bg-cream-dark text-muted" />
          </div>
          <div>
            <label class="text-xs font-medium block mb-1">បណ្តោយ (Longitude)</label>
            <input :value="form.longitude.toFixed(6)" type="text" readonly class="input-field text-sm bg-cream-dark text-muted" />
          </div>
          <div>
            <label class="text-xs font-medium block mb-1">ចម្ងាយដឹកជញ្ជូន (គីឡូម៉ែត្រ)</label>
            <input v-model.number="form.deliveryDistanceKm" type="number" min="0" step="0.5" class="input-field text-sm" />
          </div>
        </div>
      </div>

      <div class="border-t border-line pt-6">
        <p class="text-sm font-semibold mb-1">ថ្លៃដឹកជញ្ជូន</p>
        <p class="text-xs text-muted mb-3">ចំនួនទឹកប្រាក់ថេរដែលបន្ថែមទៅលើសរុបការបញ្ជាទិញរបស់អតិថិជននីមួយៗ។</p>
        <div class="max-w-xs">
          <label class="text-xs font-medium block mb-1">ថ្លៃដឹកជញ្ជូន ($)</label>
          <input v-model.number="form.shippingFee" type="number" min="0" step="0.25" class="input-field text-sm" />
        </div>
      </div>

      <div>
        <p class="text-xs font-medium mb-2">បណ្តាញសង្គម</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <input v-model="form.facebookUrl" type="url" placeholder="Facebook URL" class="input-field text-sm" />
          <input v-model="form.instagramUrl" type="url" placeholder="Instagram URL" class="input-field text-sm" />
          <input v-model="form.tiktokUrl" type="url" placeholder="TikTok URL" class="input-field text-sm" />
          <input v-model="form.telegramUrl" type="url" placeholder="Telegram URL" class="input-field text-sm" />
        </div>
      </div>

      <div class="border-t border-line pt-6">
        <p class="text-sm font-semibold mb-1">វិធីទូទាត់</p>
        <p class="text-xs text-muted mb-3">
          ការគ្រប់គ្រងវិធីទូទាត់ (បើក/បិទ, រូបសញ្ញា, លំនាំដើម) ត្រូវបានផ្លាស់ទីទៅ
          <NuxtLink to="/admin/payment_method" class="text-rust underline">ទំព័រវិធីទូទាត់</NuxtLink>។
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="saved" class="text-sm text-rust">បានរក្សាទុករួចរាល់។</p>

      <button type="submit" class="btn-primary" :disabled="saving">
        <Loader2 v-if="saving" :size="16" class="animate-spin" />
        {{ saving ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក' }}
      </button>
    </form>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'settings.update' })

import { reactive, ref, onMounted, nextTick, watch } from 'vue'
import { Upload, Loader2 } from 'lucide-vue-next'
import { useAdmin } from '~/composables/useAdmin'
import { keyFromUrl } from '~/composables/useImageKey'
import 'leaflet/dist/leaflet.css'

const { getSettings, updateSettings, uploadSiteImage, deleteSiteImage } = useAdmin()

const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const error = ref('')
const saved = ref(false)
const mapContainer = ref(null)
let map = null
let marker = null
let circle = null

const form = reactive({
  companyName: '', companyDetail: '',
  contactEmail: '', contactPhone: '', contactAddress: '', workingHours: '',
  facebookUrl: '', instagramUrl: '', tiktokUrl: '', telegramUrl: '',
  logoUrl: '',
  latitude: 0, longitude: 0, deliveryDistanceKm: 0,
  shippingFee: 0,
})

// Phnom Penh center — used only when no location has been saved yet
// (latitude/longitude both 0, which is never a real store location, it's
// the middle of the ocean off West Africa), so the map opens somewhere
// actually useful instead of at 0,0.
const DEFAULT_CENTER = [11.5564, 104.9282]

async function initMap() {
  // Leaflet touches `window`/DOM directly, so it must only ever load in
  // the browser — dynamic import here keeps it out of the SSR bundle
  // entirely, rather than crashing on `window is not defined` server-side.
  const L = (await import('leaflet')).default

  // Leaflet's default marker icon paths break under Vite's bundling (the
  // image URLs it hard-codes don't survive the build) — this is the
  // standard, well-documented fix: point the default icon at Leaflet's
  // own CDN-hosted images instead of relying on the bundled paths.
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  const hasSavedLocation = form.latitude !== 0 || form.longitude !== 0
  const center = hasSavedLocation ? [form.latitude, form.longitude] : DEFAULT_CENTER

  map = L.map(mapContainer.value).setView(center, hasSavedLocation ? 15 : 12)

  // OpenStreetMap tiles — free, no API key, no billing account required
  // (unlike Google Maps), which is exactly what was asked for here.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  marker = L.marker(center, { draggable: true }).addTo(map)

  // Delivery zone circle — L.circle's radius is in METERS, while
  // deliveryDistanceKm is stored in kilometers, hence the *1000. Only
  // drawn if a distance is actually set (0 would just be an invisible
  // dot, not worth rendering).
  if (form.deliveryDistanceKm > 0) {
    circle = L.circle(center, { radius: form.deliveryDistanceKm * 1000, color: '#b3552f', fillOpacity: 0.1 }).addTo(map)
  }

  function setLocation(lat, lng) {
    form.latitude = lat
    form.longitude = lng
    // Keep the circle centered on the marker whenever it moves — without
    // this, dragging the marker would leave the delivery zone drawn
    // around the OLD location instead of following the store.
    if (circle) circle.setLatLng([lat, lng])
  }

  marker.on('dragend', () => {
    const pos = marker.getLatLng()
    setLocation(pos.lat, pos.lng)
  })

  map.on('click', (e) => {
    marker.setLatLng(e.latlng)
    setLocation(e.latlng.lat, e.latlng.lng)
  })

  // Redraws the circle whenever the admin types a new radius — creates
  // it on the fly if one doesn't exist yet (e.g. distance was 0 when the
  // map first loaded), removes it entirely if the value is cleared back
  // to 0/empty rather than leaving a stale, invisible layer behind.
  watch(
    () => form.deliveryDistanceKm,
    (km) => {
      const radiusMeters = (Number(km) || 0) * 1000
      if (radiusMeters <= 0) {
        if (circle) {
          map.removeLayer(circle)
          circle = null
        }
        return
      }
      const center = marker.getLatLng()
      if (circle) {
        circle.setRadius(radiusMeters)
      } else {
        circle = L.circle(center, { radius: radiusMeters, color: '#b3552f', fillOpacity: 0.1 }).addTo(map)
      }
    }
  )
}

async function onLogoChosen(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploadingLogo.value = true
  const previousUrl = form.logoUrl
  try {
    const result = await uploadSiteImage(file)
    form.logoUrl = result.url
    // Clean up the logo being replaced so it doesn't sit orphaned in R2.
    if (previousUrl) {
      const oldKey = keyFromUrl(previousUrl)
      if (oldKey) deleteSiteImage(oldKey).catch(() => {})
    }
  } catch (err) {
    error.value = err.message || 'មិនអាចផ្ទុករូបភាពបានទេ'
  } finally {
    uploadingLogo.value = false
  }
}

// Clears the logo from the form (and deletes it from R2) without needing to
// replace it with a new one.
async function removeLogo() {
  const url = form.logoUrl
  form.logoUrl = ''
  const key = keyFromUrl(url)
  if (key) {
    try {
      await deleteSiteImage(key)
    } catch (err) {
      error.value = err.message || 'មិនអាចលុបរូបសញ្ញាពី R2 បានទេ'
    }
  }
}

async function submit() {
  error.value = ''
  saved.value = false
  saving.value = true
  try {
    await updateSettings({ ...form })
    saved.value = true
  } catch (e) {
    error.value = e.message || 'មិនអាចរក្សាទុកបានទេ'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const s = await getSettings()
    Object.assign(form, s)
  } catch (e) {
    error.value = 'មិនអាចទាញយកការកំណត់បានទេ'
  } finally {
    loading.value = false
  }
  // The map container only exists once loading finishes and the v-else
  // branch of the template actually renders — nextTick waits for that DOM
  // update before Leaflet tries to attach to it, otherwise mapContainer
  // would still be null here.
  await nextTick()
  if (mapContainer.value) initMap()
})
</script>
