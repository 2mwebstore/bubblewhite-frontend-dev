// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/sitemap'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'km' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  // This is the actual fix: the admin panel never needs to be indexed or
  // crawled, and it has its own client-only concerns (localStorage-backed
  // auth session, file upload UI, a rich text editor) that don't play well
  // with SSR anyway — so it opts out entirely and renders as a pure SPA,
  // while every storefront route (the pages that actually need SEO) stays
  // server-rendered by default.
  routeRules: {
    '/admin/**': { ssr: false },
    // Customer auth is client-side/localStorage only (same reasoning as
    // the admin session) — the server can never know if a shopper is
    // logged in on the first request, so these two pages (private,
    // personalized, no SEO value anyway) skip SSR entirely rather than
    // mixing an unreliable auth check into server rendering.
    '/account/**': { ssr: false },
    '/cart': { ssr: false },
    '/orders/**': { ssr: false },
  },

  runtimeConfig: {
    // All Bakong-related config (merchant credentials, Open API
    // credentials) is intentionally NOT listed here — it's read directly
    // from process.env inside the actual request handlers instead (see
    // server/api/khqr.post.js and server/utils/bakongToken.js). Routing
    // custom-named env vars through Nuxt's runtimeConfig only works
    // reliably at RUNTIME if the var name matches Nuxt's own
    // NUXT_<SCREAMING_SNAKE_KEY> convention; anything else gets evaluated
    // once during the build step and silently frozen at that value
    // thereafter, ignoring the same env var if it's only set at deploy/
    // runtime (the normal pattern on Railway and most container hosts).
    // See BAKONG_* entries in .env.example for the full list of variables.

    public: {
      // Same env var name Vite used before, so existing .env files/deploy
      // configs mostly carry over — Nuxt just needs the NUXT_PUBLIC_ prefix
      // to expose it to the client bundle.
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
    },
  },

  site: {
    // Used by @nuxtjs/sitemap to build absolute <loc> URLs and by
    // useSeoMeta's canonical/og:url resolution across the app.
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  sitemap: {
    // Static routes are picked up automatically from the pages/ directory.
    // Product and category pages are dynamic (driven by the database), so
    // they're supplied here via a live call to the backend — this is what
    // makes the sitemap actually reflect real inventory instead of a
    // hand-maintained static file. Path matches @nuxtjs/sitemap's own
    // documented convention (server/api/_sitemap-urls.js) — an earlier
    // nested __sitemap__/urls.js path silently produced an empty sitemap.
    sources: ['/api/_sitemap-urls'],
    // The admin panel is auth-gated and never meant to be indexed — without
    // this, every /admin/** page (login, dashboard, products, users, ...)
    // gets auto-discovered from pages/ and listed right alongside real
    // storefront URLs.
    // Auth-gated / personal pages have no SEO value and shouldn't be
    // crawled or listed — same reasoning that made them ssr:false in
    // routeRules above, just applied to the sitemap too.
    exclude: ['/admin/**', '/account/**', '/cart', '/orders/**', '/login', '/register'],
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      // @nuxtjs/sitemap prerenders /sitemap.xml into a static file by
      // default — which then permanently freezes it with whatever the
      // backend returned (or failed to return) at BUILD time, and Nitro
      // serves that static file instead of ever running the dynamic route
      // again. Since our sitemap depends on live database content, it has
      // to stay a real per-request route.
      ignore: ['/sitemap.xml'],
    },
  },
})
