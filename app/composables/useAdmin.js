import { useApi } from './useApi'

/**
 * Every /api/admin/* call the admin panel needs, in one place. Each function
 * returns the unwrapped `data` (and `meta` where relevant) from the backend's
 * response envelope.
 */
export function useAdmin() {
  const api = useApi()

  // --- Auth -------------------------------------------------------------
  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    return res.data // { token, user: { id, name, email, role } }
  }

  async function me() {
    const res = await api.get('/admin/me')
    return res.data // { id, name, email, role: { id, name, slug, permissions } }
  }

  async function changePassword(currentPassword, newPassword) {
    return api.post('/admin/me/change-password', { currentPassword, newPassword })
  }

  // --- Products -----------------------------------------------------------
  async function listProducts(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v)
    })
    const qs = query.toString()
    const res = await api.get(`/products${qs ? `?${qs}` : ''}`)
    return { items: res.data || [], meta: res.meta || null }
  }
  async function getProduct(id) {
    return (await api.get(`/products/${id}`)).data
  }
  async function createProduct(payload) {
    return (await api.post('/admin/products', payload)).data
  }
  async function updateProduct(id, payload) {
    return (await api.put(`/admin/products/${id}`, payload)).data
  }
  async function deleteProduct(id) {
    return api.del(`/admin/products/${id}`)
  }
  async function uploadProductImage(file) {
    return (await api.upload('/admin/uploads/products', file)).data // { url, key, ... }
  }
  async function deleteProductImage(key) {
    return api.del(`/admin/uploads/products?key=${encodeURIComponent(key)}`)
  }

  // --- Categories ---------------------------------------------------------
  async function listCategories() {
    // Admin-only endpoint — returns EVERY category regardless of active
    // status, unlike the public GET /categories which only returns active
    // ones. Without this, a disabled category would become permanently
    // invisible to admins too, with no way to find and re-enable it.
    return (await api.get('/admin/categories')).data || []
  }
  async function createCategory(payload) {
    return (await api.post('/admin/categories', payload)).data
  }
  async function updateCategory(id, payload) {
    return (await api.put(`/admin/categories/${id}`, payload)).data
  }
  async function deleteCategory(id) {
    return api.del(`/admin/categories/${id}`)
  }
  async function uploadCategoryImage(file) {
    return (await api.upload('/admin/uploads/categories', file)).data
  }
  async function deleteCategoryImage(key) {
    return api.del(`/admin/uploads/categories?key=${encodeURIComponent(key)}`)
  }

  async function uploadPaymentMethodImage(file) {
    return (await api.upload('/admin/uploads/payment-methods', file)).data
  }
  async function deletePaymentMethodImage(key) {
    return api.del(`/admin/uploads/payment-methods?key=${encodeURIComponent(key)}`)
  }

  // --- Users ----------------------------------------------------------------
  async function listUsers() {
    return (await api.get('/admin/users')).data || []
  }
  async function createUser(payload) {
    return (await api.post('/admin/users', payload)).data
  }
  async function updateUser(id, payload) {
    return (await api.put(`/admin/users/${id}`, payload)).data
  }
  async function deleteUser(id) {
    return api.del(`/admin/users/${id}`)
  }
  async function assignRole(id, roleId) {
    return api.patch(`/admin/users/${id}/role`, { roleId })
  }
  async function resetUserPassword(id, newPassword) {
    return api.patch(`/admin/users/${id}/password`, { newPassword })
  }

  // --- Roles & permissions -----------------------------------------------
  async function listRoles() {
    return (await api.get('/admin/roles')).data || []
  }
  async function listPermissions() {
    return (await api.get('/admin/permissions')).data || []
  }
  async function createRole(payload) {
    return (await api.post('/admin/roles', payload)).data
  }
  async function updateRole(id, payload) {
    return (await api.put(`/admin/roles/${id}`, payload)).data
  }
  async function deleteRole(id) {
    return api.del(`/admin/roles/${id}`)
  }

  // --- Contact messages -----------------------------------------------------
  async function listContacts() {
    return (await api.get('/admin/contacts')).data || []
  }
  async function markContactRead(id) {
    return api.patch(`/admin/contacts/${id}/read`)
  }
  async function deleteContact(id) {
    return api.del(`/admin/contacts/${id}`)
  }

  // --- Settings -----------------------------------------------------------
  async function getSettings() {
    return (await api.get('/settings')).data
  }
  async function updateSettings(payload) {
    return (await api.put('/admin/settings', payload)).data
  }
  async function uploadSiteImage(file) {
    return (await api.upload('/admin/uploads/site', file)).data
  }
  async function deleteSiteImage(key) {
    return api.del(`/admin/uploads/site?key=${encodeURIComponent(key)}`)
  }

  // --- Banners (home page hero carousel) -----------------------------------
  async function listBanners() {
    return (await api.get('/admin/banners')).data || []
  }
  async function createBanner(payload) {
    return (await api.post('/admin/banners', payload)).data
  }
  async function updateBanner(id, payload) {
    return (await api.put(`/admin/banners/${id}`, payload)).data
  }
  async function deleteBanner(id) {
    return api.del(`/admin/banners/${id}`)
  }
  async function uploadBannerImage(file) {
    return (await api.upload('/admin/uploads/banners', file)).data
  }
  async function deleteBannerImage(key) {
    return api.del(`/admin/uploads/banners?key=${encodeURIComponent(key)}`)
  }

  return {
    login, me, changePassword,
    listProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
    listCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, deleteCategoryImage,
    uploadPaymentMethodImage, deletePaymentMethodImage,
    listUsers, createUser, updateUser, deleteUser, assignRole, resetUserPassword,
    listRoles, listPermissions, createRole, updateRole, deleteRole,
    listContacts, markContactRead, deleteContact,
    getSettings, updateSettings, uploadSiteImage, deleteSiteImage,
    listBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage, deleteBannerImage,
  }
}
