import { reactive, computed } from 'vue'
import { useCustomerApi } from './useCustomerApi'
import { useCustomerAuth } from './useCustomerAuth'

// Cart is now backend-persisted (POST/GET/PUT/DELETE /api/customer/cart),
// tied to the logged-in customer's account — replaces the earlier
// localStorage-only version. This means:
//  - the cart survives across devices/browsers, not just one browser
//  - it requires login — there's no guest cart anymore (every mutating
//    call here assumes the caller already checked isLoggedIn; see
//    useCartAccess() below, used by the actual "Add to Cart" UI)
const state = reactive({ items: [], loaded: false, loading: false })

export function useCart() {
  const api = useCustomerApi()
  const { isLoggedIn } = useCustomerAuth()

  const itemCount = computed(() => state.items.reduce((sum, i) => sum + i.quantity, 0))
  const subtotal = computed(() => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0))

  async function fetchCart() {
    if (!isLoggedIn.value) {
      state.items = []
      state.loaded = true
      return
    }
    state.loading = true
    try {
      const res = await api.get('/customer/cart')
      state.items = res.data || []
      state.loaded = true
    } catch {
      state.items = []
    } finally {
      state.loading = false
    }
  }

  // Only call this from UI that already confirmed isLoggedIn — see
  // useCartAccess() below, which is the actual gate used by the "Add to
  // Cart" buttons. `image` is whichever specific product photo the
  // customer was previewing (product detail page's active thumbnail) —
  // passing a different image for the same product/size creates a
  // separate cart line rather than merging quantities (see the backend's
  // CartItem doc comment).
  async function addItem(product, size, quantity = 1, image = '') {
    await api.post('/customer/cart', { productId: product.id, size: size || '', image: image || '', quantity })
    await fetchCart()
  }

  async function updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      await removeItem(itemId)
      return
    }
    await api.put(`/customer/cart/${itemId}`, { quantity })
    await fetchCart()
  }

  async function removeItem(itemId) {
    await api.del(`/customer/cart/${itemId}`)
    state.items = state.items.filter((i) => i.id !== itemId)
  }

  async function clear() {
    await api.del('/customer/cart')
    state.items = []
  }

  return {
    items: computed(() => state.items),
    loading: computed(() => state.loading),
    itemCount,
    subtotal,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }
}
