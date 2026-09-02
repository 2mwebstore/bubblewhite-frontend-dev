// Calls Bakong's real Open API (check_transaction_by_md5) to verify
// whether a generated KHQR code has actually been paid — this is what
// lets the "scan to pay" modal detect payment automatically instead of
// relying on a manual "I've paid" click.
//
// getBakongToken/invalidateBakongToken are imported explicitly rather than
// relying on Nitro's server/utils/ auto-import — that auto-import has
// already proven unreliable on this specific deployment for Vue component
// auto-imports (SearchableSelect/AdminPagination hit the same issue), so
// an explicit import here is the safer bet regardless of the exact root
// cause on Railway's build.
import { getBakongToken, invalidateBakongToken } from '../utils/bakongToken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const md5 = String(body?.md5 || '')
  if (!md5) {
    throw createError({ statusCode: 400, statusMessage: 'md5 is required' })
  }

  // Read directly from process.env, NOT useRuntimeConfig() — see the
  // detailed explanation in server/api/khqr.post.js and
  // server/utils/bakongToken.js. A custom env var name only gets frozen
  // in as a build-time default when routed through Nuxt's runtimeConfig.
  const bakongApiBaseUrl = process.env.BAKONG_API_BASE_URL || 'https://api-bakong.nbc.gov.kh'

  async function check(token) {
    return await $fetch(`${bakongApiBaseUrl}/v1/check_transaction_by_md5`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { md5 },
    })
  }

  let token
  try {
    token = await getBakongToken()
  } catch (err) {
    // Logged, not just returned — without this, "not configured" and "IS
    // configured but the actual API call is failing for some other
    // reason" look identical on the frontend, with no way to tell them
    // apart from your deployment logs.
    console.error('[khqr-status] failed to obtain Bakong token:', err?.message || err)
    return { paid: false, verified: false, message: err.message || err.statusMessage || 'Bakong Open API not configured' }
  }

  try {
    const res = await check(token)
    // responseCode 0 = transaction found and completed. Bakong's docs also
    // define a genuine "Failed" transaction state (responseCode 1,
    // errorCode 3) distinct from "NotFound" (errorCode 1) — both correctly
    // fall out as paid:false here since we only care about the success case.
    return { paid: res.responseCode === 0, verified: true, message: res.responseMessage }
  } catch (err) {
    // 401 means the cached token expired sooner than our TTL guess
    // assumed — refresh once and retry, rather than reporting a false
    // "not paid" for what's actually an auth problem.
    if (err.response?.status === 401) {
      invalidateBakongToken()
      try {
        const freshToken = await getBakongToken(true)
        const res = await check(freshToken)
        return { paid: res.responseCode === 0, verified: true, message: res.responseMessage }
      } catch (retryErr) {
        console.error('[khqr-status] retry after 401 also failed:', retryErr?.message || retryErr)
        return { paid: false, verified: false, message: 'Bakong Open API authentication failed' }
      }
    }

    // Any other non-2xx (including Bakong's own documented "NotFound"
    // response, which $fetch treats as a thrown error) means "not paid
    // yet" — the expected, normal state before a customer has scanned.
    // Still logged at debug level conceptually, but since this is the
    // NORMAL state while someone hasn't paid, it's not worth spamming
    // error-level logs for every single poll — only genuinely unexpected
    // shapes (missing responseMessage entirely) get flagged.
    if (!err.data?.responseMessage) {
      console.error('[khqr-status] unexpected error checking transaction:', err?.message || err)
    }
    return { paid: false, verified: true, message: err.data?.responseMessage || 'not found' }
  }
})
