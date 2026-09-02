import { useCustomerAuth } from './useCustomerAuth'
import { useStore } from './useStore'

/**
 * Used by every "Add to Cart" trigger (ProductCard's quick-add, the
 * product detail page's Add to Cart button). Since the cart is now
 * backend-persisted per customer account, there's no guest cart to fall
 * back to — this is the single gate that decides what happens when a
 * logged-out visitor tries to add something: show a clear message and
 * send them to log in (returning to the page they were on), rather than
 * either silently failing or letting the API call 401 with no explanation.
 */
export function useCartAccess() {
  const { isLoggedIn } = useCustomerAuth()
  const { showToast } = useStore()
  const router = useRouter()
  const route = useRoute()

  function requireLogin() {
    if (isLoggedIn.value) return true
    showToast('សូមចូលគណនីជាមុនសិន ដើម្បីបន្ថែមទំនិញទៅរទេះ')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }

  return { requireLogin }
}
