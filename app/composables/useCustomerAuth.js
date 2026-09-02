import { reactive, computed } from 'vue'

const STORAGE_KEY = 'bw_customer_session'

// Same pattern as useAuth.js (admin session) but entirely separate storage
// and state — a customer and an admin can even be logged in at the same
// time in the same browser without conflicting. Since the storefront IS
// server-rendered (unlike the admin panel), the very first paint always
// renders "logged out" (state.token starts null on the server, since
// localStorage doesn't exist there) — a logged-in customer's session loads
// in immediately after hydration on the client. That's a normal, accepted
// trade-off for client-persisted auth in an SSR app.
function loadStored() {
  if (!import.meta.client) return { token: null, customer: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, customer: null }
    const parsed = JSON.parse(raw)
    return { token: parsed.token || null, customer: parsed.customer || null }
  } catch {
    return { token: null, customer: null }
  }
}

const stored = loadStored()
const state = reactive({ token: stored.token, customer: stored.customer })

function persist() {
  if (!import.meta.client) return
  if (state.token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, customer: state.customer }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function setSession(token, customer) {
  state.token = token
  state.customer = customer
  persist()
}

function updateCustomer(customer) {
  state.customer = customer
  persist()
}

function logout() {
  state.token = null
  state.customer = null
  persist()
}

export function useCustomerAuth() {
  const isLoggedIn = computed(() => !!state.token)

  return {
    state,
    isLoggedIn,
    setSession,
    updateCustomer,
    logout,
  }
}
