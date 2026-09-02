import { useCustomerApi } from './useCustomerApi'

// Checkout no longer just trusts the customer's stated payment intent for
// Bakong — the backend independently re-verifies against Bakong's real API
// using paymentReference before the order is created (see
// OrderService.Checkout in the Go backend). Cash orders still land as
// "pending, unpaid" for the business to confirm and fulfill manually, same
// as before.
export function useOrders() {
  const api = useCustomerApi()

  function checkout(paymentMethod, address, phone, paymentReference = '') {
    return api.post('/customer/orders', { paymentMethod, address, phone, paymentReference })
  }

  // PPCBank's flow is fundamentally different from Bakong/cash — the
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

  function listOrders() {
    return api.get('/customer/orders')
  }

  function getOrder(id) {
    return api.get(`/customer/orders/${id}`)
  }

  return { checkout, initiatePPCBankCheckout, getPPCBankReturnStatus, listOrders, getOrder }
}
