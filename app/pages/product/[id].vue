<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <nav class="text-xs text-muted mb-8" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-ink">ទំព័រដើម</NuxtLink> /
      <NuxtLink to="/shop" class="hover:text-ink">ទំនិញ</NuxtLink> /
      <span class="text-ink">{{ product.name }}</span>
    </nav>

    <div class="grid md:grid-cols-2 gap-12">
      <div data-aos="zoom-in">
        <div class="aspect-square card-surface bg-cream-dark flex items-center justify-center overflow-hidden relative group">
          <button
            v-if="activeImage"
            type="button"
            class="w-full h-full cursor-zoom-in"
            aria-label="Open full image preview"
            @click="openLightbox(activeIndex)"
          >
            <SkeletonImage
              :src="activeImage"
              :alt="product.name"
              wrapper-class="w-full h-full"
              img-class="w-full h-full object-cover"
              object-position="65% center"
              :width="520"
              :height="472"
              eager
            />
          </button>
          <ProductGlyph v-else :seed="product.id" class="w-1/2 h-1/2" />
          <div
            v-if="activeImage"
            class="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-ink/70 text-cream flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Expand :size="16" :stroke-width="1.8" />
          </div>
        </div>

        <!-- Thumbnail strip -->
        <div v-if="images.length > 1" class="grid grid-cols-5 gap-3 mt-3">
          <button
            v-for="(img, i) in images"
            :key="img + i"
            type="button"
            class="aspect-square rounded-card overflow-hidden border-2 transition-colors"
            :class="i === activeIndex ? 'border-ink' : 'border-transparent hover:border-line'"
            :aria-label="`Show image ${i + 1} of ${images.length}`"
            @click="activeIndex = i"
          >
            <SkeletonImage
              :src="img"
              :alt="`${product.name} thumbnail ${i + 1}`"
              wrapper-class="w-full aspect-[3/4] rounded-2xl"
              img-class="w-full h-full object-cover"
              object-position="65% center"
            />
          </button>
        </div>
      </div>

      <div data-aos="zoom-in">
        <h1 class="font-sans font-bold text-3xl mb-2">{{ product.name }}</h1>
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl font-semibold">${{ product.price.toFixed(2) }}</span>
          <span v-if="product.compareAt" class="text-base text-muted line-through">${{ product.compareAt.toFixed(2) }}</span>
          <span v-if="product.badge" class="text-[10px] font-bold px-2 py-1 rounded-full bg-ink text-cream">{{ product.badge }}</span>
        </div>
        <div class="text-muted leading-relaxed mb-8 prose prose-sm max-w-none" v-html="product.description"></div>

        <div class="mb-8">
          <p class="text-xs tracking-widest uppercase font-semibold mb-2">ទំហំ</p>
          <div class="flex gap-2 flex-wrap">
            <button v-for="s in product.sizes" :key="s" type="button"
              class="w-11 h-11 rounded-full border text-sm"
              :class="size === s ? 'border-ink bg-ink text-cream' : 'border-line hover:border-ink'"
              @click="size = s">{{ s }}</button>
          </div>
        </div>

        <div class="flex gap-3 mb-8">
          <button type="button" class="btn-primary flex-1" @click="onAddToCart">
            <ShoppingBag :size="16" :stroke-width="1.8" />
            {{ justAdded ? 'បានបន្ថែមទៅរទេះ ✓' : 'បន្ថែមទៅរទេះ' }}
          </button>
          <NuxtLink to="/contact" class="btn-secondary flex-1 flex items-center justify-center">សាកសួរដើម្បីបញ្ជាទិញ</NuxtLink>
        </div>

        <div class="grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm text-muted">
          <p class="flex items-center gap-2"><Truck :size="16" :stroke-width="1.6" class="shrink-0" /> ដឹកជញ្ជូនឥតគិតថ្លៃ លើសពី $50</p>
          <p class="flex items-center gap-2"><RotateCcw :size="16" :stroke-width="1.6" class="shrink-0" /> ប្តូរបានក្នុងរយៈពេល ៣០ ថ្ងៃ</p>
          <p class="flex items-center gap-2"><Lock :size="16" :stroke-width="1.6" class="shrink-0" /> ការទូទាត់សុវត្ថិភាព ១០០%</p>
          <p class="flex items-center gap-2"><MessageCircle :size="16" :stroke-width="1.6" class="shrink-0" /> ជំនួយ ២៤/៧</p>
        </div>
      </div>
    </div>

    <section v-if="related.length" class="mt-20">
      <h2 class="font-sans font-bold text-2xl mb-8" data-aos="zoom-in">ផលិតផលដែលអ្នកអាចចូលចិត្ត</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div v-for="(p, i) in related" :key="p.id" data-aos="zoom-in" :data-aos-delay="i * 80">
          <ProductCard :product="p" />
        </div>
      </div>
    </section>

    <!-- Facebook-style full-screen image preview, with prev/next across all product images -->
    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          @click.self="lightboxOpen = false"
        >
          <button
            type="button"
            class="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close preview"
            @click="lightboxOpen = false"
          >
            <X :size="22" :stroke-width="1.8" />
          </button>

          <button
            v-if="images.length > 1"
            type="button"
            class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Previous image"
            @click.stop="prevImage"
          >
            <ChevronLeft :size="24" :stroke-width="1.8" />
          </button>

          <Transition name="lightbox-zoom" mode="out-in" appear>
            <img
              :key="activeIndex"
              :src="images[activeIndex]"
              :alt="product.name"
              class="max-w-[92vw] max-h-[88vh] object-contain select-none"
              loading="eager"
              @click.stop
            />
          </Transition>

          <button
            v-if="images.length > 1"
            type="button"
            class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Next image"
            @click.stop="nextImage"
          >
            <ChevronRight :size="24" :stroke-width="1.8" />
          </button>

          <div v-if="images.length > 1" class="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium">
            {{ activeIndex + 1 }} / {{ images.length }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Truck, RotateCcw, Lock, MessageCircle, Expand, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-vue-next'
import { useCatalog } from '~/composables/useCatalog'
import { useCart } from '~/composables/useCart'
import { useCartAccess } from '~/composables/useCartAccess'
import { useStore } from '~/composables/useStore'

const route = useRoute()
const { fetchProduct, fetchRelated } = useCatalog()

// Real SSR fetch, with a REAL 404 — createError() here means the server
// actually returns HTTP 404 for a nonexistent product id, not a 200 with
// "not found" text in the body (a "soft 404", which search engines
// penalize / refuse to de-index properly).
//
// Important: the createError() call has to happen at the TOP LEVEL of
// setup (outside the useAsyncData callback) to actually propagate to
// Nuxt's page-level error boundary and set the real HTTP status — throwing
// it *inside* the callback just gets captured as useAsyncData's own local
// `error` ref instead, leaving `product.value` null and crashing the
// template with a generic 500 the next time it reads `product.name`.
const { data: product } = await useAsyncData(`product-${route.params.id}`, () =>
  fetchProduct(route.params.id).catch(() => null)
)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const { data: related } = await useAsyncData(
  `product-related-${route.params.id}`,
  () => fetchRelated(route.params.id, 4).catch(() => [])
)

const images = computed(() => product.value?.images ?? [])
const size = ref(product.value?.sizes?.[0] || '')

const { addItem } = useCart()
const { requireLogin } = useCartAccess()
const { showToast } = useStore()
const justAdded = ref(false)
let justAddedTimer = null

async function onAddToCart() {
  if (!requireLogin()) return
  try {
    // Pass whichever image is currently being previewed (the main image
    // area, changed by clicking a thumbnail) — not always the product's
    // first image, so what the customer sees on the cart page matches
    // what they were actually looking at when they added it.
    await addItem(product.value, size.value || null, 1, activeImage.value)
    showToast(`បានបន្ថែម "${product.value.name}" ទៅរទេះទំនិញ`)
    justAdded.value = true
    clearTimeout(justAddedTimer)
    justAddedTimer = setTimeout(() => (justAdded.value = false), 1500)
  } catch (e) {
    showToast(e.message || 'មិនអាចបន្ថែមទៅរទេះទំនិញបានទេ')
  }
}
const activeIndex = ref(0)
const activeImage = computed(() => images.value[activeIndex.value] ?? null)

const lightboxOpen = ref(false)
function openLightbox(index) {
  activeIndex.value = index
  lightboxOpen.value = true
}
function nextImage() {
  activeIndex.value = (activeIndex.value + 1) % images.value.length
}
function prevImage() {
  activeIndex.value = (activeIndex.value - 1 + images.value.length) % images.value.length
}

watch(lightboxOpen, (open) => {
  if (import.meta.client) document.documentElement.style.overflow = open ? 'hidden' : ''
})

function onKeydown(e) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') lightboxOpen.value = false
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}
if (import.meta.client) {
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    document.documentElement.style.overflow = ''
  })
}

const p = product.value
const canonicalUrl = useRequestURL().origin + `/product/${p.id}`

useSeoMeta({
  title: `${p.name} | BubbleWhite`,
  description: p.description?.replace(/<[^>]*>/g, '').slice(0, 160),
  ogTitle: p.name,
  ogDescription: p.description?.replace(/<[^>]*>/g, '').slice(0, 160),
  ogType: 'product',
  ogImage: p.images?.[0],
  twitterCard: 'summary_large_image',
  twitterImage: p.images?.[0],
})
useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.description?.replace(/<[^>]*>/g, ''),
        sku: p.id,
        image: p.images,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: p.price,
          availability: 'https://schema.org/InStock',
          url: canonicalUrl,
        },
      }),
    },
    {
      // BreadcrumbList — this is what makes Google show the
      // Home > Shop > Product Name trail directly in search results
      // instead of just the raw URL. The visible <nav> breadcrumb above
      // already exists; this is the machine-readable version of the same
      // three links, so it has to stay in sync with them by hand.
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ទំព័រដើម', item: useRequestURL().origin + '/' },
          { '@type': 'ListItem', position: 2, name: 'ទំនិញ', item: useRequestURL().origin + '/shop' },
          { '@type': 'ListItem', position: 3, name: p.name, item: canonicalUrl },
        ],
      }),
    },
  ],
})
</script>

<style scoped>
.lightbox-fade-enter-active, .lightbox-fade-leave-active { transition: opacity 0.2s ease; }
.lightbox-fade-enter-from, .lightbox-fade-leave-to { opacity: 0; }

.lightbox-zoom-enter-active, .lightbox-zoom-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.lightbox-zoom-enter-from, .lightbox-zoom-leave-to { transform: scale(0.96); opacity: 0; }
</style>