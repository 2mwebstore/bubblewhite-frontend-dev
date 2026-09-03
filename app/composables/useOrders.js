import { useCustomerApi } from './useCustomerApi'

// Checkout is cash-only now (Bakong's integration was removed). Cash
// orders land as "pending, unpaid" for the business to confirm and
// fulfill manually.
export function useOrders() {
  const api = useCustomerApi()

  function checkout(paymentMethod, address, phone) {
    return api.post('/customer/orders', { paymentMethod, address, phone })
  }

  // PPCBank's flow is fundamentally different from cash — the
  // customer LEAVES this site to pay on PPCBank's hosted page, so the
  // order has to exist (as pending/unpaid) BEFORE redirecting, unlike
  // Checkout() above which only creates the order after payment is
  // already confirmed. Returns { orderId, reference, paymentURL } — the
  // caller redirects the browser to paymentURL.
  function initiatePPCBankCheckout(address, phone) {
    return api.post('/customer/orders/ppcbank/initiate', { address, phone })
  }

  // Called by /orders/ppcbank-return.vue after PPCBank redirects the
  // customer back — actively re-verifies with PPCBank rather than
  // passively waiting for the webhook, since the customer is watching
  // this page right now.
  function getPPCBankReturnStatus(billNumber) {
    return api.get(`/customer/orders/ppcbank/status?billNumber=${encodeURIComponent(billNumber)}`)
  }

  function listOrders({ page = 1, pageSize = 10 } = {}) {
    const q = new URLSearchParams({ page, pageSize })
    return api.get(`/customer/orders?${q.toString()}`)
  }

  function getOrder(id) {
    return api.get(`/customer/orders/${id}`)
  }

  return { checkout, initiatePPCBankCheckout, getPPCBankReturnStatus, listOrders, getOrder }
}
