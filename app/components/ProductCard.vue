<template>
  <NuxtLink :to="`/product/${product.id}`" class="group block">
    <div class="relative card-surface overflow-hidden mb-3">
      <span
        v-if="product.badge"
        class="absolute top-3 left-3 z-10 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md bg-ink text-cream"
      >{{ product.badge }}</span>

      <div class="aspect-[3/4] bg-cream-dark flex items-center justify-center overflow-hidden">
        <img
          v-if="thumbnail"
          :src="thumbnail"
          :alt="product.name"
          class="w-full h-full object-cover"
          style="object-position: 65% center"
          loading="lazy"
          width="520"
          height="472"
        />
        <ProductGlyph v-else :seed="product.id" />
      </div>

      <button
        type="button"
        class="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-cream/95 backdrop-blur flex items-center justify-center shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-ink hover:text-cream"
        aria-label="បន្ថែមទៅរទេះទំនិញ"
        title="បន្ថែមទៅរទេះទំនិញ"
        @click.stop.prevent="onQuickAdd"
      >
        <Check v-if="justAdded" :size="16" :stroke-width="2" />
        <ShoppingBag v-else :size="16" :stroke-width="1.8" />
      </button>
    </div>

    <h3 class="text-sm font-medium text-ink group-hover:text-rust transition-colors">{{ product.name }}</h3>
    <div class="flex items-center gap-2 mt-1">
      <span class="text-sm font-semibold">${{ product.price.toFixed(2) }}</span>
      <span v-if="product.compareAt" class="text-xs text-muted line-through">${{ product.compareAt.toFixed(2) }}</span>
    </div>
  </NuxtLink>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ShoppingBag, Check } from 'lucide-vue-next'
import ProductGlyph from './ProductGlyph.vue'
import { useCart } from '../composables/useCart'
import { useCartAccess } from '../composables/useCartAccess'
import { useStore } from '../composables/useStore'

const props = defineProps({
  product: { type: Object, required: true },
})

const thumbnail = computed(() => props.product.images?.[0] ?? null)

const { addItem } = useCart()
const { requireLogin } = useCartAccess()
const { showToast } = useStore()
const justAdded = ref(false)
let justAddedTimer = null

// Quick-add from the grid — no size picker here, so it defaults to the
// product's first available size (refinable from the cart or product page).
// requireLogin() shows a message and redirects to /login when logged out,
// instead of silently doing nothing or letting the API call fail with a
// confusing 401.
async function onQuickAdd() {
  if (!requireLogin()) return
  try {
    // No "currently previewed" concept on a grid card — use the product's
    // own default (first) image, same as before this became explicit.
    await addItem(props.product, props.product.sizes?.[0] || null, 1, props.product.images?.[0] || '')
    showToast(`បានបន្ថែម "${props.product.name}" ទៅរទេះទំនិញ`)
    justAdded.value = true
    clearTimeout(justAddedTimer)
    justAddedTimer = setTimeout(() => (justAdded.value = false), 1200)
  } catch (e) {
    showToast(e.message || 'មិនអាចបន្ថែមទៅរទេះទំនិញបានទេ')
  }
}
</script>
