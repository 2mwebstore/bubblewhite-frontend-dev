import { useApi } from './useApi'

// Kept as its own small composable, same reasoning as useAdminCustomers.js
// — self-contained and safe to drop in without touching/risking any
// larger, already-established file.
export function useAdminPaymentMethods() {
  const api = useApi()

  function listPaymentMethods({ page = 1, pageSize = 20 } = {}) {
    const q = new URLSearchParams({ page, pageSize })
    return api.get(`/admin/payment-methods?${q.toString()}`)
  }

  function getPaymentMethod(id) {
    return api.get(`/admin/payment-methods/${id}`)
  }

  function updatePaymentMethod(id, patch) {
    return api.put(`/admin/payment-methods/${id}`, patch)
  }

  return { listPaymentMethods, getPaymentMethod, updatePaymentMethod }
}
