// Handles the parts of Google/Facebook sign-in that are the same
// regardless of which page triggered it (login vs register — both do the
// same "find or create" on the backend) or which provider was used (the
// backend already returns the same {token, customer} shape as regular
// phone/password login).
//
// Google's button needs to render into an actual DOM element it controls,
// so that part lives in GoogleSignInButton.vue instead of here — this
// composable is what that component (and a plain Facebook button) both
// call once they have a real credential/token to exchange.

import { useCustomerApi } from './useCustomerApi'

let googleScriptPromise = null
let facebookScriptPromise = null

// Loads https://accounts.google.com/gsi/client exactly once no matter how
// many times this is called (e.g. the login and register pages both
// mounting their own button) — subsequent calls reuse the same in-flight
// or already-resolved promise instead of injecting the script twice.
export function loadGoogleScript() {
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

// Loads Facebook's JS SDK and calls FB.init() exactly once, same
// single-flight pattern as loadGoogleScript. version pinned to v22.0 (the
// current version as of this writing) rather than left unset, so a future
// Facebook default-version bump can't silently change this app's behavior
// without an explicit, intentional update here.
export function loadFacebookScript(appId) {
  if (facebookScriptPromise) return facebookScriptPromise
  facebookScriptPromise = new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB)
      return
    }
    window.fbAsyncInit = function () {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v22.0' })
      resolve(window.FB)
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Failed to load Facebook Login'))
    document.head.appendChild(script)
  })
  return facebookScriptPromise
}

// Exchanges a verified Google ID token or Facebook access token for this
// app's own session token — same backend response shape as regular login,
// so the caller (a page's submit handler) doesn't need separate success
// handling per provider.
async function exchangeWithBackend(path, body) {
  const api = useCustomerApi()
  const res = await api.post(path, body)
  return { token: res.data.token, customer: res.data.customer }
}

export function useSocialAuth() {
  return {
    loadGoogleScript,
    loadFacebookScript,
    exchangeGoogleToken: (idToken) => exchangeWithBackend('/customer/auth/google', { idToken }),
    exchangeFacebookToken: (accessToken) => exchangeWithBackend('/customer/auth/facebook', { accessToken }),
  }
}
