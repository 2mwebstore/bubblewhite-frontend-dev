import { useApi } from './useApi'

// Kept as its own small composable rather than added into useAdmin.js —
// self-contained and safe to drop in without touching/risking that
// (larger, already-established) file.
export function useAdminCustomers() {
  const api = useApi()

  function listCustomers({ page = 1, pageSize = 20 } = {}) {
    const q = new URLSearchParams({ page, pageSize })
    return api.get(`/admin/customers?${q.toString()}`)
  }

  function getCustomer(id) {
    return api.get(`/admin/customers/${id}`)
  }

  function getCustomerOrders(id) {
    return api.get(`/admin/customers/${id}/orders`)
  }

  function resetCustomerPassword(id, newPassword) {
    return api.patch(`/admin/customers/${id}/password`, { newPassword })
  }

  function setCustomerActive(id, isActive) {
    return api.patch(`/admin/customers/${id}/active`, { isActive })
  }

  return { listCustomers, getCustomer, getCustomerOrders, resetCustomerPassword, setCustomerActive }
}
