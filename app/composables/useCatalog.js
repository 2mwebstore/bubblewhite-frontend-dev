import { useApi } from './useApi'

/**
 * Storefront-facing catalog reads. Every function returns the *unwrapped*
 * data (the envelope's `data`/`meta` are already peeled off here) so views
 * don't need to know about the API's response shape.
 */
export function useCatalog() {
  const api = useApi()

  async function fetchCategories() {
    const res = await api.get('/categories')
    return res.data || []
  }

  /**
   * @param {Object} params - { category, search, featured, sortBy, sortDir, page, pageSize }
   * @returns {Promise<{items: Array, meta: Object}>}
   */
  async function fetchProducts(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v)
    })
    const qs = query.toString()
    const res = await api.get(`/products${qs ? `?${qs}` : ''}`)
    return { items: res.data || [], meta: res.meta || null }
  }

  async function fetchFeatured(limit = 10) {
    const { items } = await fetchProducts({ featured: true, pageSize: limit })
    return items
  }

  async function fetchProduct(id) {
    const res = await api.get(`/products/${id}`)
    return res.data
  }

  async function fetchRelated(id, limit = 4) {
    const res = await api.get(`/products/${id}/related?limit=${limit}`)
    return res.data || []
  }

  async function fetchSettings() {
    const res = await api.get('/settings')
    return res.data
  }

  async function fetchPaymentMethods() {
    const res = await api.get('/payment-methods')
    return res.data || []
  }

  async function fetchBanners() {
    const res = await api.get('/banners')
    return res.data || []
  }

  async function submitContact(payload) {
    return api.post('/contact', payload)
  }

  return {
    fetchCategories,
    fetchProducts,
    fetchFeatured,
    fetchProduct,
    fetchRelated,
    fetchSettings,
    fetchPaymentMethods,
    fetchBanners,
    submitContact,
  }
}
