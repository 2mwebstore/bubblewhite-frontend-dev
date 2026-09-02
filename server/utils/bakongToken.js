// Auto-imported across server/api/ routes by Nitro's server/utils/
// convention (same mechanism as composables/ auto-import on the client) —
// no explicit import needed in the routes that call this.
//
// This does NOT call Bakong's renew_token directly — it fetches the
// already-cached token FROM the Go backend (GET /internal/bakong-token),
// which maintains its own in-memory + database-persisted cache (see the
// Go backend's services/bakong_payment.go). Both services independently
// calling renew_token would silently double up on Bakong's SHARED daily
// request quota (observed: 100 requests/day, total, not per service) for
// zero benefit — this makes the Go backend the single place that ever
// talks to Bakong's renew_token endpoint, with Nuxt just asking it for a
// copy.
let cachedToken = null
let cachedAt = 0
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

export async function getBakongToken(forceRefresh = false) {
  const config = useRuntimeConfig()
  // apiBaseUrl correctly re-reads NUXT_PUBLIC_API_BASE_URL at runtime —
  // unlike the custom Bakong-specific vars, this one follows Nuxt's own
  // NUXT_PUBLIC_ naming convention, so routing it through useRuntimeConfig()
  // is safe here (see khqr.post.js for the full explanation of why most
  // other Bakong config reads process.env directly instead).
  const apiBase = config.public.apiBaseUrl

  // INTERNAL_API_SECRET is a custom name, read directly from process.env
  // for the same reason.
  const internalSecret = process.env.INTERNAL_API_SECRET || ''

  const now = Date.now()
  if (!forceRefresh && cachedToken && now - cachedAt < TOKEN_TTL_MS) {
    return cachedToken
  }

  if (!internalSecret) {
    throw createError({
      statusCode: 500,
      message: 'INTERNAL_API_SECRET is not configured — must match the exact same value set on the Go backend',
    })
  }

  let res
  try {
    res = await $fetch(`${apiBase}/internal/bakong-token`, {
      headers: { 'X-Internal-Secret': internalSecret },
    })
  } catch (err) {
    // Logged with whatever detail the backend actually returned (wrong
    // secret, backend's own BAKONG_API_EMAIL not configured, etc.) —
    // without this, every distinct failure reason collapses into the same
    // generic frontend message, with nothing in the logs to tell them apart.
    console.error('[bakongToken] failed to fetch token from backend:', err?.data || err?.message || err)
    throw createError({
      statusCode: 502,
      message: err?.data?.error || 'Failed to fetch the Bakong token from the backend',
    })
  }

  if (!res?.data?.token) {
    console.error('[bakongToken] backend returned no token:', JSON.stringify(res))
    throw createError({ statusCode: 502, message: 'Backend returned no Bakong token' })
  }

  cachedToken = res.data.token
  cachedAt = now
  return cachedToken
}

// Clears the local cache so the next getBakongToken() call re-fetches from
// the backend — used when a request comes back 401, meaning the cached
// token expired earlier than our TTL guess assumed. Note this only clears
// NUXT's copy; if the backend's own token also needs refreshing, its own
// 401-retry logic (see the Go backend's checkBakongTransaction) handles that.
export function invalidateBakongToken() {
  cachedToken = null
  cachedAt = 0
}
