import { useCustomerAuth } from './useCustomerAuth'

/**
 * Same shape as useApi.js, but attaches the CUSTOMER session's token
 * instead of the admin session's — kept as an entirely separate wrapper
 * (rather than a flag on useApi) so there's no risk of an admin token ever
 * being sent to a public customer endpoint, or vice versa.
 */
async function request(path, { method = 'GET', body } = {}) {
  const { state, logout } = useCustomerAuth()
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const headers = {}
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`

  try {
    return await $fetch(path, { baseURL, method, headers, body })
  } catch (err) {
    const status = err?.response?.status
    if (status === 401) logout()
    const payload = err?.data
    const message = payload?.error || payload?.message || err?.message || `Request failed (${status || ''})`
    const wrapped = new Error(message)
    wrapped.status = status
    wrapped.fieldErrors = payload?.errors || null
    throw wrapped
  }
}

export function useCustomerApi() {
  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),
  }
}
