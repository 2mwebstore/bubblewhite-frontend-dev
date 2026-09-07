<template>
  <div class="max-w-7xl mx-auto px-6 py-8 md:py-12">
    <nav class="text-xs text-muted mb-3" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-ink">ទំព័រដើម</NuxtLink>
      <template v-if="activeCategoryName"> / <NuxtLink to="/shop" class="hover:text-ink">ទំនិញ</NuxtLink> / <span class="text-ink">{{ activeCategoryName }}</span></template>
      <template v-else> / <span class="text-ink">ទំនិញ</span></template>
    </nav>
    <h1 class="font-sans font-bold text-3xl md:text-4xl mb-6 md:mb-8">ទំនិញ</h1>

    <div class="flex flex-col md:flex-row gap-6 md:gap-10">
      <!-- Sidebar / mobile filter dropdown -->
      <aside class="w-full md:w-64 flex-shrink-0" data-aos="zoom-in">
        <button
          type="button"
          class="md:hidden w-full flex items-center justify-between input-field text-sm mb-4"
          @click="mobileFiltersOpen = !mobileFiltersOpen"
        >
          <span class="flex items-center gap-2">
            <SlidersHorizontal :size="16" :stroke-width="1.8" />
            ត្រង & ប្រភេទ
            <span v-if="filters.category" class="w-1.5 h-1.5 rounded-full bg-rust" />
          </span>
          <ChevronDown :size="16" :stroke-width="1.8" class="transition-transform" :class="mobileFiltersOpen ? 'rotate-180' : ''" />
        </button>

        <div class="space-y-8" :class="mobileFiltersOpen ? 'block' : 'hidden md:block'">
          <div>
            <p class="text-xs tracking-widest uppercase font-semibold mb-3">ស្វែងរក</p>
            <input v-model="filters.search" type="search" placeholder="ស្វែងរក…" class="input-field text-sm" />
          </div>

          <div>
            <p class="text-xs tracking-widest uppercase font-semibold mb-3">ប្រភេទ</p>
            <ul class="space-y-1">
              <li>
                <button
                  type="button"
                  class="w-full flex items-center gap-3 py-1.5 rounded-lg transition-colors text-sm"
                  :class="!filters.category ? 'text-rust font-medium' : 'text-ink/70 hover:text-ink'"
                  @click="filters.category = ''"
                >
                  <span class="w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center shrink-0">
                    <LayoutGrid :size="14" :stroke-width="1.8" class="text-ink/50" />
                  </span>
                  ទាំងអស់
                </button>
              </li>
              <li v-for="cat in categoriesWithProducts" :key="cat.id">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 py-1.5 rounded-lg transition-colors text-sm"
                  :class="filters.category === cat.slug ? 'text-rust font-medium' : 'text-ink/70 hover:text-ink'"
                  @click="filters.category = cat.slug"
                >
                  <span class="w-8 h-8 rounded-full bg-cream-dark overflow-hidden shrink-0">
                    <SkeletonImage
                      v-if="cat.image"
                      :src="cat.image"
                      :alt="cat.name"
                      wrapper-class="w-full h-full"
                      img-class="w-full h-full object-cover"
                      object-position="50% 35%"
                    />
                  </span>
                  {{ cat.name }}
                </button>
              </li>
            </ul>
          </div>

          <button type="button" class="text-xs text-rust hover:underline" @click="resetFilters">សម្អាតតម្រង</button>
        </div>
      </aside>

      <!-- Grid -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-3 mb-6">
          <p class="text-sm text-muted">{{ loading ? '&nbsp;' : `${total} ផលិតផល` }}</p>
          <SearchableSelect
            v-model="sortBy"
            :options="sortOptions"
            :clearable="false"
            :searchable="false"
            class="sm:w-36"
          />
        </div>

        <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div v-for="n in 8" :key="n" class="aspect-[3/4] rounded-card bg-cream-dark animate-pulse" />
        </div>

        <template v-else-if="products.length">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div v-for="(p, i) in products" :key="p.id" data-aos="zoom-in" :data-aos-delay="(i % 4) * 80">
              <ProductCard :product="p" />
            </div>
          </div>

          <!-- Infinite scroll: this sentinel only exists while there's a next
               page (v-if="hasMore") — as it scrolls into view, the observer
               below loads and appends the next page automatically, app-style,
               instead of numbered page buttons. Client-only, same as before. -->
          <div v-if="hasMore" ref="loadMoreSentinel" class="flex items-center justify-center py-10">
            <Loader2 v-if="loadingMore" :size="20" class="animate-spin text-muted" />
          </div>
        </template>

        <div v-else class="text-center py-16 md:py-20 border border-dashed border-line rounded-card px-4">
          <p class="font-medium mb-1">មិនមានផលិតផលត្រូវនឹងតម្រងរបស់អ្នកទេ</p>
          <p class="text-sm text-muted mb-4">សូមពង្រីកការស្វែងរក ឬសម្អាតតម្រង។</p>
          <button type="button" class="btn-secondary" @click="resetFilters">សម្អាតតម្រង</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { SlidersHorizontal, ChevronDown, LayoutGrid, Loader2 } from 'lucide-vue-next'
import { useCatalog } from '~/composables/useCatalog'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'

const route = useRoute()
const { fetchCategories, fetchProducts } = useCatalog()

const filters = reactive({
  search: typeof route.query.q === 'string' ? route.query.q : '',
  category: typeof route.query.category === 'string' ? route.query.category : '',
})

const sortBy = ref('default')
const sortOptions = [
  { value: 'default', label: 'លំដាប់ដើម' },
  { value: 'price_asc', label: 'តម្លៃ៖ ទាបទៅខ្ពស់' },
  { value: 'price_desc', label: 'តម្លៃ៖ ខ្ពស់ទៅទាប' },
]

const page = ref(1)
const pageSize = 8
const total = ref(0)
const totalPages = ref(1)
const products = ref([])
const categories = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const mobileFiltersOpen = ref(false)

const hasMore = computed(() => page.value < totalPages.value)
const categoriesWithProducts = computed(() => categories.value.filter((c) => c.productCount > 0))
// Used by the breadcrumb (both the visible nav and its BreadcrumbList
// schema) — resolves the category name from its slug once categories have
// loaded, so a direct link to /shop?category=hoodies shows "Hoodies" in
// the trail instead of just "Shop".
const activeCategoryName = computed(() => categories.value.find((c) => c.slug === filters.category)?.name || '')

function buildParams(targetPage) {
  const [sortField, sortDir] = sortBy.value !== 'default' ? sortBy.value.split('_') : ['', '']
  return {
    category: filters.category,
    search: filters.search.trim(),
    sortBy: sortField,
    sortDir,
    page: targetPage,
    pageSize,
  }
}

// Real SSR fetch for whatever /shop?category=&q= was actually requested —
// this is what makes a category-filtered shop URL show correct products in
// its initial HTML, not just after client JS runs.
const { data: initial } = await useAsyncData(
  () => `shop-${filters.category}-${filters.search}`,
  async () => {
    const [cats, productsRes] = await Promise.all([fetchCategories(), fetchProducts(buildParams(1))])
    return { cats, items: productsRes.items, meta: productsRes.meta }
  }
)

categories.value = initial.value?.cats || []
products.value = initial.value?.items || []
total.value = initial.value?.meta?.total || 0
totalPages.value = initial.value?.meta?.totalPage || 1
loading.value = false

// Fresh load — used for client-driven filter/sort/search changes after the
// initial SSR render (replaces the grid from page 1).
async function loadFresh() {
  loading.value = true
  page.value = 1
  try {
    const { items, meta } = await fetchProducts(buildParams(1))
    products.value = items
    total.value = meta?.total || items.length
    totalPages.value = meta?.totalPage || 1
  } catch (e) {
    products.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

// Load-more — fetches the next page and appends, no reset/scroll jump.
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const { items, meta } = await fetchProducts(buildParams(nextPage))
    products.value.push(...items)
    page.value = nextPage
    total.value = meta?.total ?? total.value
    totalPages.value = meta?.totalPage ?? totalPages.value
  } catch (e) {
    // Leave hasMore/page as-is — scrolling the sentinel back into view
    // will simply retry.
  } finally {
    loadingMore.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
  sortBy.value = 'default'
}

watch([() => filters.category, sortBy], loadFresh)

watch(() => filters.category, () => {
  mobileFiltersOpen.value = false
})

let searchDebounce = null
watch(
  () => filters.search,
  () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(loadFresh, 350)
  }
)

// --- Infinite scroll (client-only, same as before) ---
const loadMoreSentinel = ref(null)
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    },
    { rootMargin: '400px' }
  )
  if (loadMoreSentinel.value) observer.observe(loadMoreSentinel.value)
})

onBeforeUnmount(() => observer?.disconnect())

watch(loadMoreSentinel, (el) => {
  if (el && observer) observer.observe(el)
})

const title = activeCategoryName.value ? `${activeCategoryName.value} | BubbleWhite` : 'ផលិតផលទាំងអស់ | BubbleWhite'
const description = activeCategoryName.value
  ? `ស្វែងរកកម្រង ${activeCategoryName.value} របស់ BubbleWhite។`
  : 'ស្វែងរកកម្រងផលិតផលពេញលេញរបស់ BubbleWhite — អាវយឺត អាវហ៊ូឌី និងគ្រឿងបន្លាស់ សម្រាប់បុរស និងនារី។'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
useHead({
  link: [{ rel: 'canonical', href: useRequestURL().href }],
  script: activeCategoryName.value
    ? [
        {
          // Only meaningful when actually on a category-filtered view — a
          // 2-item trail (Home > Shop) isn't worth emitting as structured
          // data, Google already infers that much from the URL alone.
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'ទំព័រដើម', item: useRequestURL().origin + '/' },
              { '@type': 'ListItem', position: 2, name: 'ទំនិញ', item: useRequestURL().origin + '/shop' },
              { '@type': 'ListItem', position: 3, name: activeCategoryName.value, item: useRequestURL().href },
            ],
          }),
        },
      ]
    : [],
})
</script>
