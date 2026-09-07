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
          // Favicon
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/icon/32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/icon/192x192.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '512x512',
          href: '/icon/512x512.png',
        },

        // Apple / Mobile Icon
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/icon/180x180.png',
        },
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
    public: {
      // Same env var name Vite used before, so existing .env files/deploy
      // configs mostly carry over — Nuxt just needs the NUXT_PUBLIC_ prefix
      // to expose it to the client bundle.
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',

      // Public by design — a Google/Facebook client ID is meant to be
      // visible in the browser (it identifies the app, not a secret;
      // Facebook's actual secret stays backend-only, never exposed here).
      // Both default to empty string, which the login/register pages use
      // to hide the corresponding button entirely rather than show one
      // that would just fail — see SocialLoginButtons.vue.
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      facebookAppId: process.env.NUXT_PUBLIC_FACEBOOK_APP_ID || '',
      // The bot's @username (without the @) — needed by the Telegram
      // Login Widget's script tag. Nothing secret here; the bot TOKEN
      // that actually verifies sign-ins stays backend-only.
      telegramBotUsername: process.env.NUXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
      // Same value the `site.url` key below configures for the sitemap
      // module, exposed here too as an explicit, ordinary runtime config
      // field — needed by app.vue's structured data (JSON-LD), which
      // reads it via the standard useRuntimeConfig() pattern already
      // used for apiBaseUrl above. The sitemap module's own `site.url`
      // key is a separate, module-specific config surface, not something
      // that automatically becomes part of runtimeConfig.public on its
      // own.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
    routeRules: {
      // Security headers on every response, addressing a real external
      // scan (PentestTools) that flagged all four as missing on the live
      // site. These are genuinely low-risk to add — X-Content-Type-Options,
      // Referrer-Policy, and HSTS don't change how the site behaves, they
      // only restrict what a BROWSER is allowed to do with the response.
      '/**': {
        headers: {
          // Stops a browser from "helpfully" re-interpreting a response
          // as a different content-type than declared (e.g. treating an
          // uploaded file as HTML/JS) — a real vector for XSS via file
          // upload on other sites, blocked outright here.
          'X-Content-Type-Options': 'nosniff',
          // Never sends the previous page's full URL to a site a
          // customer clicks through to — least-leaky option that still
          // sends a same-origin referrer for your own internal
          // navigation and analytics.
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          // Forces HTTPS for a year, including subdomains — the scanner
          // specifically flags anything below 7,776,000 seconds (90
          // days) as too low; this uses the standard 1-year value.
          // Safe to set unconditionally here since the whole site is
          // already served over HTTPS (confirmed by the scan itself
          // being run against https://bubblewhite.co).
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          // Content-Security-Policy is NOT set here — it needs the
          // actual runtime apiBaseUrl (which can differ from whatever
          // was set at build time — the same NUXT_PUBLIC_* env var this
          // project has already been bitten by once: it's correctly
          // runtime-overridable for the runtimeConfig field, but a
          // process.env read directly inside this config file is not,
          // since nuxt.config.ts itself only runs once at build). See
          // server/middleware/security-headers.ts, which builds it
          // per-request via useRuntimeConfig() instead.
        },
      },
    },
  },
})
