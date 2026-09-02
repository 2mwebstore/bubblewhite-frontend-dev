// Calls Nuxt's OWN server route (server/api/khqr.post.js), not the Go
// backend — same-origin, so a plain relative path is correct here, unlike
// useApi.js/useCustomerApi.js which target NUXT_PUBLIC_API_BASE_URL.
export function useKhqr() {
  async function generateKhqr(amount, billNumber) {
    return await $fetch('/api/khqr', { method: 'POST', body: { amount, billNumber } })
  }

  // Polls this to detect real payment — see server/api/khqr-status.post.js.
  // `verified: false` in the response means the Bakong Open API isn't
  // configured server-side, distinct from a genuine "not paid yet".
  async function checkKhqrStatus(md5) {
    return await $fetch('/api/khqr-status', { method: 'POST', body: { md5 } })
  }

  return { generateKhqr, checkKhqrStatus }
}
