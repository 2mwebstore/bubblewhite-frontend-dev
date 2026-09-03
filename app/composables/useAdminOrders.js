import { useApi } from './useApi'

// Kept as its own small composable rather than added into useAdmin.js —
// self-contained and safe to drop in without touching/risking that
// (larger, already-established) file.
export function useAdminOrders() {
  const api = useApi()

  function listOrders({ page = 1, pageSize = 20, search = '', customerId = '', status = '', paymentMethod = '' } = {}) {
    const q = new URLSearchParams({ page, pageSize })
    if (search) q.set('search', search)
    if (customerId) q.set('customerId', customerId)
    if (status) q.set('status', status)
    if (paymentMethod) q.set('paymentMethod', paymentMethod)
    return api.get(`/admin/orders?${q.toString()}`)
  }

  function getOrder(id) {
    return api.get(`/admin/orders/${id}`)
  }

  function updateOrderStatus(id, status) {
    return api.patch(`/admin/orders/${id}/status`, { status })
  }

  // Re-checks a PPCBank order's payment status against PPCBank's real
  // API — for when a customer says they paid but the order still shows
  // unpaid.
  function verifyPayment(id) {
    return api.post(`/admin/orders/${id}/verify-payment`, {})
  }

  return { listOrders, getOrder, updateOrderStatus, verifyPayment }
}
