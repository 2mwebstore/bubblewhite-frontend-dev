/**
 * R2 object keys are exactly the URL's path (minus the leading slash) —
 * works regardless of custom domain, since it's whatever comes after the
 * host. Used whenever we need to delete an already-uploaded image from R2
 * but only have the public URL on hand (e.g. an image loaded from a saved
 * product/category/banner, not one just uploaded this session).
 *
 * `new URL(url)` with no second argument THROWS if `url` isn't already
 * absolute (has a scheme) — which silently breaks this whenever the
 * backend's R2_PUBLIC_URL isn't set (or is missing "https://"), since the
 * stored image URL then comes back relative (e.g. "/categories/xxx.jpg").
 * Browsers resolve that fine for <img src>, so it *looks* fine in the UI —
 * but this function would return null and the R2 delete call would never
 * fire. Passing window.location.origin as a base makes it work for both
 * absolute and relative URLs.
 */
export function keyFromUrl(url) {
  if (!url) return null
  const base = import.meta.client ? window.location.origin : 'http://localhost'
  try {
    return new URL(url, base).pathname.replace(/^\//, '')
  } catch {
    return null
  }
}
