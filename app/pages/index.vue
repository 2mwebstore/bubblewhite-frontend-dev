<template>
  <div>
    <!-- Hero -->
    <section v-if="heroSlides.length" class="max-w-7xl mx-auto px-6 pt-6 pb-6 md:pt-16 md:pb-16">
      <div class="w-full card-surface overflow-hidden relative hero-swiper">
        <Swiper
          :modules="[Autoplay, Pagination]"
          :loop="heroSlides.length > 1"
          :autoplay="{ delay: 4500, disableOnInteraction: false }"
          :pagination="{ clickable: true }"
          class="w-full h-auto"
        >
          <SwiperSlide v-for="(slide, i) in heroSlides" :key="slide.id">
            <component :is="slide.linkUrl ? 'a' : 'div'" :href="slide.linkUrl || undefined" class="block w-full h-full">
              <img
                :src="slide.imageUrl"
                :alt="slide.alt"
                class="w-full h-full object-cover"
                :loading="i === 0 ? 'eager' : 'lazy'"
                :fetchpriority="i === 0 ? 'high' : undefined"
              />
            </component>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>

    <!-- Category strip — auto-sliding + looping via Swiper, so it stays
         fully swipeable/draggable (a pure CSS marquee can't support touch
         at all, which is why the previous version couldn't be swiped). -->
    <section
        v-if="categoriesWithProducts.length"
        class="py-6 border-y border-line category-swiper"
      >
        <Swiper
          :modules="[Autoplay, FreeMode]"
          :slides-per-view="'auto'"
          :space-between="24"
          :loop="categoriesWithProducts.length > 2"
          :free-mode="{ enabled: true, momentum: true }"
          :autoplay="{ delay: 2200, disableOnInteraction: false, pauseOnMouseEnter: true }"
          :speed="900"
          grab-cursor
          class="max-w-7xl mx-auto px-6"
        >
          <SwiperSlide v-for="cat in categoriesWithProducts" :key="cat.id" class="!w-56">
            <NuxtLink
              :to="`/shop?category=${cat.slug}`"
              class="flex items-center gap-3 group"
            >
              <div
                class="w-14 h-14 rounded-full bg-cream-dark overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-ink transition-all"
              >
                <img
                  v-if="cat.image"
                  :src="cat.image"
                  :alt="cat.name"
                  class="w-full h-full object-cover"
                  style="object-position: 50% 35%"
                  loading="lazy"
                />
              </div>

              <div class="min-w-0">
                <p class="text-sm font-semibold truncate">
                  {{ cat.name }}
                </p>

                <span class="text-xs text-rust inline-flex items-center gap-1 whitespace-nowrap">
                  ទិញឥឡូវ →
                </span>
              </div>
            </NuxtLink>
          </SwiperSlide>
        </Swiper>
      </section>

    <!-- Featured -->
    <section v-if="featured.length" class="max-w-7xl mx-auto px-6 pb-6 pt-6">
      <div class="flex items-end justify-between mb-8" data-aos="zoom-in">
        <h2 class="font-sans font-bold text-2xl">ផលិតផលពិសេស</h2>
        <NuxtLink to="/shop" class="text-sm font-medium text-rust hover:underline">មើលទាំងអស់ →</NuxtLink>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="(p, i) in featured" :key="p.id" data-aos="zoom-in" :data-aos-delay="(i % 5) * 80">
          <ProductCard :product="p" />
        </div>
      </div>
    </section>

    <!-- Best selling -->
    <section class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-end justify-between mb-8" data-aos="zoom-in">
        <h2 class="font-sans font-bold text-2xl">លក់ដាច់ជាងគេ</h2>
        <NuxtLink to="/shop" class="text-sm font-medium text-rust hover:underline">មើលទាំងអស់ →</NuxtLink>
      </div>
      <p v-if="loadError" class="text-sm text-muted">មិនអាចទាញយកផលិតផលបានទេ។ សូមព្យាយាមម្តងទៀត។</p>
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="(p, i) in bestSelling" :key="p.id" data-aos="zoom-in" :data-aos-delay="(i % 5) * 80">
          <ProductCard :product="p" />
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-cream-dark border-y border-line">
      <div class="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div v-for="(f, i) in features" :key="f.title" class="flex items-center gap-3" data-aos="zoom-in" :data-aos-delay="i * 100">
          <div class="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
            <component :is="f.icon" :size="18" :stroke-width="1.6" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ f.title }}</p>
            <p class="text-xs text-muted">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/free-mode'
import { Truck, RotateCcw, ShieldCheck, Headset } from 'lucide-vue-next'
import { useCatalog } from '~/composables/useCatalog'

const { fetchCategories, fetchFeatured, fetchProducts, fetchBanners } = useCatalog()

// The actual SSR fix: this fetch runs on the SERVER for the first request
// (and gets serialized into the page payload for hydration), so the
// rendered HTML search engines/link-preview bots see already contains real
// product data — not an empty shell waiting for client JS to fill it in.
const { data, error } = await useAsyncData('home', async () => {
  const [cats, feat, banners, productsRes] = await Promise.all([
    fetchCategories(),
    fetchFeatured(10),
    fetchBanners(),
    fetchProducts({ pageSize: 10 }),
  ])
  return { cats, feat, banners, products: productsRes.items }
})

const loadError = computed(() => !!error.value)
const categories = computed(() => data.value?.cats || [])
const categoriesWithProducts = computed(() => categories.value.filter((c) => c.productCount > 0))
const featured = computed(() => data.value?.feat || [])
const bestSelling = computed(() => data.value?.products || [])
const heroSlides = computed(() => data.value?.banners || [])

const features = [
  { title: 'ដឹកជញ្ជូនឥតគិតថ្លៃ', desc: 'លើការបញ្ជាទិញលើសពី $50', icon: Truck },
  { title: 'ងាយស្រួលប្តូរ', desc: 'ក្នុងរយៈពេល ៣០ ថ្ងៃ', icon: RotateCcw },
  { title: 'ការទូទាត់សុវត្ថិភាព', desc: 'សុវត្ថិភាព ១០០%', icon: ShieldCheck },
  { title: 'ជំនួយ ២៤/៧', desc: 'យើងនៅទីនេះដើម្បីជួយ', icon: Headset },
]

const title = 'ផ្តល់ជូន​អតិថិជន​នូវ​សម្លៀកបំពាក់​គុណ​ភាព​ខ្ពស់​និងទាន់​សម័យ | BubbleWhite'
const description = 'ទិញទំនិញ BubbleWhite — សម្លៀកបំពាក់ប្រចាំថ្ងៃដ៏សាមញ្ញ និងសុខស្រួល ផលិតនៅភ្នំពេញ។ អាវយឺត អាវហ៊ូឌី និងគ្រឿងបន្លាស់ រចនាឡើងសម្រាប់ភាពសាមញ្ញ និងទំនុកចិត្ត។'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
useHead({
  link: [{ rel: 'canonical', href: useRequestURL().origin + '/' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ClothingStore',
        name: 'BubbleWhite',
        url: useRequestURL().origin,
        address: { '@type': 'PostalAddress', addressLocality: 'Phnom Penh', addressCountry: 'KH' },
      }),
    },
  ],
})
</script>

<style scoped>
.hero-swiper :deep(.swiper-pagination-bullet) {
  background: #fff;
  opacity: 0.6;
  width: 7px;
  height: 7px;
}
.hero-swiper :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  background: #121110;
}

/* Swiper defaults to 100% width slides — 'auto' mode plus this override
   lets each category card keep its natural w-56 sizing instead of
   stretching to fill the viewport. */
.category-swiper :deep(.swiper-slide) {
  width: auto;
}
</style>
