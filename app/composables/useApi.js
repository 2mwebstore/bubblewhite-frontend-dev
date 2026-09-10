import { useAuth } from './useAuth'
import { getRequestIP } from 'h3'

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
 *
 * IMPORTANT — real client IP during SSR: when this runs server-side, the
 * HTTP request that reaches the backend originates from THIS Nuxt server
 * process, not the visitor's own browser — so without the block below,
 * the backend would see every SSR-rendered page load as coming from the
 * SAME IP (this server's), collapsing per-visitor rate limiting into one
 * shared bucket for every customer. getRequestIP() reads the ORIGINAL
 * incoming request's real IP (the actual visitor, correctly resolved by
 * Nuxt from the X-Forwarded-For chain Railway's edge already set on the
 * hop this server itself received), and forwards it explicitly on this
 * server's own outbound call to the backend, authenticated by a shared
 * secret so no arbitrary caller of the public backend API could spoof
 * the same header — see nuxt.config.ts's internalProxySecret and the
 * backend's config.InternalProxySecret for the full reasoning.
 */
async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const { state, logout } = useAuth()
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const headers = {}
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`

  if (import.meta.server && config.internalProxySecret) {
    const event = useRequestEvent()
    const clientIP = event ? getRequestIP(event, { xForwardedFor: true }) : null
    if (clientIP) {
      headers['X-Internal-Client-IP'] = clientIP
      headers['X-Internal-Secret'] = config.internalProxySecret
    }
  }

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
