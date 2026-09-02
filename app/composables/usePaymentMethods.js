import { ref } from 'vue'
import { useCatalog } from './useCatalog'

// Module-level (not per-component), same reasoning as useSiteSettings.js —
// every caller (cart.vue, and anywhere else that might need this later)
// shares one fetch instead of independently hitting GET /api/payment-methods.
const methods = ref(null)
const loaded = ref(false)
let inflight = null

export function usePaymentMethods() {
  const { fetchPaymentMethods } = useCatalog()

  function ensureLoaded() {
    if (loaded.value) return Promise.resolve(methods.value)
    if (inflight) return inflight

    inflight = fetchPaymentMethods()
      .then((m) => {
        methods.value = m
        loaded.value = true
        return m
      })
      .catch(() => null)
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  return { methods, ensureLoaded }
}
