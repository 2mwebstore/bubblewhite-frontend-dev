// This exists as its own runtime middleware (not a static header in
// nuxt.config.ts's routeRules) specifically because it needs the actual
// runtime value of apiBaseUrl — routeRules headers are computed once at
// build time and baked into the output, so a process.env read there would
// silently use whatever was set during `npm run build`, not whatever the
// container's real environment sets at deploy/start time. useRuntimeConfig
// here is genuinely per-request, so this always reflects the real backend
// the app is actually configured to talk to.
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  let apiOrigin = ''
  try {
    apiOrigin = new URL(config.public.apiBaseUrl).origin
  } catch {
    // apiBaseUrl was somehow unparseable — fall back to just 'self'
    // below rather than crash the whole response over a CSP header.
  }

  // Two deliberate trade-offs worth knowing about:
  // - 'unsafe-inline' on script-src/style-src: Nuxt's SSR hydration
  //   payload and Tailwind's runtime both rely on inline <script>/<style>
  //   tags. Removing this needs a nonce-based CSP (a bigger, separate
  //   change — Nuxt doesn't wire this up by default). This is the
  //   realistic middle ground: still blocks an attacker's script/style
  //   TAG being loaded from an external domain, which is the path most
  //   real XSS payloads use, just doesn't stop one inline on the page.
  // - img-src allows any https: source rather than naming the R2 bucket
  //   domain specifically, since that domain isn't currently exposed to
  //   the frontend as its own env var (only the backend knows
  //   R2_PUBLIC_URL). Intentionally the least strict directive here,
  //   since image sources are a far smaller XSS risk than script sources.
  //
  // static.cloudflareinsights.com is explicitly allowed on both
  // script-src (where the beacon script itself loads from) and
  // connect-src (where it sends its actual analytics data) — this is
  // Cloudflare's own Web Analytics beacon, injected automatically into
  // every response because this site sits behind Cloudflare (confirmed
  // by the earlier PentestTools scan detecting Cloudflare as the CDN).
  // It isn't something this app's own code adds or controls, so the CSP
  // has to explicitly allow it or Cloudflare's own script gets blocked —
  // confirmed by an actual browser CSP violation report against the
  // live site before adding this.
  //
  // Google Identity Services (Sign in with Google / One Tap) and Facebook
  // Login each need script-src (their own JS library) and frame-src
  // (their actual sign-in UI renders as an iframe from their own domain,
  // not the page's origin) — confirmed against each provider's own
  // official docs, plus real CSP violation reports from the live site
  // that caught two gaps this CSP didn't originally cover: no frame-src
  // at all (silently falling back to default-src 'self' and blocking
  // both), and Facebook's SDK additionally calling
  // connect.facebook.net/app_config/... directly from the browser to
  // fetch its own app configuration — a connect-src need that isn't
  // obvious from Facebook's setup docs alone. Google's GIS library also
  // needs connect-src for its own status/credential endpoints; Facebook's
  // flow makes no comparable frontend network call of its own beyond
  // that app_config fetch.
  // Google's own docs specifically recommend the /gsi/ PARENT path here
  // rather than individual endpoint URLs, so a future Google-side
  // endpoint change under that path doesn't silently break this again.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://accounts.google.com/gsi/client https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    `connect-src 'self' https://cloudflareinsights.com https://accounts.google.com/gsi/ https://connect.facebook.net${apiOrigin ? ' ' + apiOrigin : ''}`,
    "frame-src https://accounts.google.com/gsi/ https://www.facebook.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  setResponseHeader(event, 'Content-Security-Policy', csp)
})
