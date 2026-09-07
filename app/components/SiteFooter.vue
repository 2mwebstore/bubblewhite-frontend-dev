<template>
  <footer class="bg-ink text-cream mt-24 pb-16 md:pb-0">
    <div class="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
      <div class="col-span-2">
        <p class="font-sans font-extrabold text-lg mb-3">{{ settings?.companyName || 'bubble.white' }}</p>
        <p class="text-sm text-cream/60 leading-relaxed max-w-xs">{{ settings?.companyDetail || 'សម្លៀកបំពាក់សាមញ្ញ សុខស្រួលអតិបរមា។' }}<br />សូមអរគុណដែលបានគាំទ្រ Bubble White។</p>
        <div class="flex items-center gap-3 mt-5">
          <a v-for="s in socialLinks" :key="s.label" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="w-8 h-8 rounded-full border border-cream/25 flex items-center justify-center hover:border-cream transition-colors">
            <component :is="s.icon" v-if="s.icon" :size="14" :stroke-width="1.6" />
            <span v-else v-html="s.fallback" />
          </a>
        </div>
      </div>

      <div>
        <p class="text-xs tracking-widest uppercase font-semibold mb-4 text-cream/70">ទំនិញ</p>
        <ul class="space-y-2 text-sm text-cream/60">
          <li><NuxtLink to="/shop" class="hover:text-cream">ផលិតផលទាំងអស់</NuxtLink></li>
          <li v-for="cat in categoriesWithProducts" :key="cat.id">
            <NuxtLink :to="`/shop?category=${cat.slug}`" class="hover:text-cream">{{ cat.name }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <p class="text-xs tracking-widest uppercase font-semibold mb-4 text-cream/70">សេវាកម្មអតិថិជន</p>
        <ul class="space-y-2 text-sm text-cream/60">
          <li><NuxtLink to="/contact" class="hover:text-cream">ការដឹកជញ្ជូន</NuxtLink></li>
          <li><NuxtLink to="/contact" class="hover:text-cream">ការប្តូរ និងសង</NuxtLink></li>
          <li><NuxtLink to="/contact" class="hover:text-cream">សំណួរញឹកញាប់</NuxtLink></li>
        </ul>
      </div>

      <div>
        <p class="text-xs tracking-widest uppercase font-semibold mb-4 text-cream/70">ទំនាក់ទំនង</p>
        <ul class="space-y-2 text-sm text-cream/60">
          <li>{{ settings?.contactAddress || 'ភ្នំពេញ, កម្ពុជា' }}</li>
          <li>
            <a :href="`mailto:${contactEmail}`" class="hover:text-cream transition-colors">{{ contactEmail }}</a>
          </li>
          <li>
            <a :href="`tel:${phoneHref}`" class="hover:text-cream transition-colors">{{ contactPhone }}</a>
          </li>
          <li>{{ settings?.workingHours || 'ចន្ទ – អាទិត្យ / ៩ព្រឹក – ៩យប់' }}</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-cream/10">
      <div class="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/50">
        <p>© {{ year }} {{ settings?.companyName || 'Bubble White' }}។ រក្សាសិទ្ធិគ្រប់យ៉ាង។ <NuxtLink to="/privacy-policy" class="hover:text-cream underline">គោលការណ៍ភាពឯកជន</NuxtLink></p>
        <div class="flex items-center gap-2">
          <span class="border border-cream/25 rounded px-2 py-1">VISA</span>
          <span class="border border-cream/25 rounded px-2 py-1">Mastercard</span>
          <span class="border border-cream/25 rounded px-2 py-1">ABA</span>
          <span class="border border-cream/25 rounded px-2 py-1">KHQR</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Facebook, Instagram, Youtube } from 'lucide-vue-next'
import { useSiteSettings } from '../composables/useSiteSettings'
import { useCatalog } from '../composables/useCatalog'

const year = new Date().getFullYear()
const { settings, ensureLoaded } = useSiteSettings()
const { fetchCategories } = useCatalog()

const contactEmail = computed(() => settings.value?.contactEmail || 'hello@bubblewhite.co')
const contactPhone = computed(() => settings.value?.contactPhone || '+855 12 345 678')
// tel: links need a clean, dial-able number — strips everything except
// digits and a leading "+", so admin-entered formatting (spaces,
// parentheses, dashes) in the displayed text doesn't break the actual
// link a phone's dialer receives.
const phoneHref = computed(() => contactPhone.value.replace(/(?!^\+)[^\d]/g, ''))

const categories = ref([])
// Only link to categories that actually have at least one product —
// otherwise the footer sends shoppers to an empty results page the moment
// an admin adds a new (still-empty) category. Capped at 5 so the footer
// column stays a fixed, tidy height no matter how many categories exist.
const categoriesWithProducts = computed(() => categories.value.filter((c) => c.productCount > 0).slice(0, 5))

onMounted(() => {
  ensureLoaded()
  fetchCategories().then((c) => (categories.value = c)).catch(() => {})
})

const tiktokIcon = {
  fallback:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3c.3 2 1.8 3.6 4 3.9V9.9c-1.5 0-2.9-.5-4-1.3v6.6a5.2 5.2 0 11-4.4-5.1v3a2.2 2.2 0 102.2 2.2V3H14z"/></svg>',
}

// Only show a social link once the admin has actually set a URL for it.
const socialLinks = computed(() => {
  const s = settings.value
  const links = []
  if (s?.facebookUrl) links.push({ label: 'Facebook', href: s.facebookUrl, icon: Facebook })
  if (s?.instagramUrl) links.push({ label: 'Instagram', href: s.instagramUrl, icon: Instagram })
  if (s?.tiktokUrl) links.push({ label: 'TikTok', href: s.tiktokUrl, fallback: tiktokIcon.fallback })
  if (s?.telegramUrl) links.push({ label: 'YouTube', href: s.telegramUrl, icon: Youtube })
  return links
})
</script>
