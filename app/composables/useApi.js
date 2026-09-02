import { useAuth } from './useAuth'

/**
 * Thin wrapper around $fetch (Nuxt's ofetch, available identically during
 * SSR and in the browser) that:
 *  - prefixes every path with the API base URL (from runtime config)
 *  - attaches the admin Bearer token when logged in
 *  - unwraps the backend's { success, data, meta, error } envelope
 *  - throws an Error with the backend's message on failure (and logs the
 *    caller out on a 401 so a stale/expired token doesn't loop forever)
 *
 * Storefront pages call this through useAsyncData (see pages/*.vue) so the
 * fetch actually happens during SSR and gets serialized into the page
 * payload — that's what makes the rendered HTML contain real content
 * instead of an empty shell.
 */
async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const { state, logout } = useAuth()
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const headers = {}
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`

  try {
    return await $fetch(path, {
      baseURL,
      method,
      headers,
      body: isForm ? body : body,
    })
  } catch (err) {
    // ofetch throws FetchError with .response / .data already parsed from JSON.
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

export function useApi() {
  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    del: (path) => request(path, { method: 'DELETE' }),
    upload: (path, file) => {
      const form = new FormData()
      form.append('file', file)
      return request(path, { method: 'POST', body: form, isForm: true })
    },
  }
}
