// Feeds @nuxtjs/sitemap (see nuxt.config.ts's `sitemap.sources`) with every
// product and every non-empty category, pulled live from the Go backend.
// Static routes (/, /shop, /about, /contact) are picked up automatically
// from the pages/ directory — this only needs to cover what the backend
// actually knows about.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl
  const urls = []

  if (!apiBase) {
    console.error('[sitemap] apiBaseUrl is empty — NUXT_PUBLIC_API_BASE_URL is not set on this deployment')
  }

  try {
    const categories = await $fetch(`${apiBase}/categories`)
    let added = 0
    for (const cat of categories?.data || []) {
      if (cat.productCount > 0) {
        urls.push({
          loc: `/shop?category=${cat.slug}`,
          lastmod: cat.updatedAt,
          images: cat.image ? [{ loc: cat.image, title: cat.name }] : undefined,
        })
        added++
      }
    }
    console.log(`[sitemap] fetched ${categories?.data?.length ?? 0} categories from ${apiBase}/categories, added ${added} with products`)
  } catch (err) {
    // Logged, not swallowed — a silent catch here is exactly what made this
    // hard to debug: the sitemap just quietly fell back to the static
    // routes with no indication anything had gone wrong. Check this
    // deployment's server logs for the actual reason (wrong
    // NUXT_PUBLIC_API_BASE_URL, backend unreachable from this container,
    // a non-2xx response, etc.).
    console.error(`[sitemap] failed to fetch categories from ${apiBase}/categories:`, err?.message || err)
  }

  try {
    let page = 1
    const pageSize = 200
    let totalAdded = 0
    // Capped at 25 pages (5,000 products) as a sanity limit.
    while (page <= 25) {
      const res = await $fetch(`${apiBase}/products`, { query: { page, pageSize } })
      const items = res?.data || []
      for (const p of items) {
        urls.push({
          loc: `/product/${p.id}`,
          lastmod: p.updatedAt,
          // Image sitemap entries — lets Google Images crawl/index product
          // photos directly from the sitemap instead of only discovering
          // them by rendering the page. Every image, not just the first,
          // since a shopper searching by a specific angle/color should
          // still be able to find the product.
          images: (p.images || []).map((url) => ({ loc: url, title: p.name })),
        })
        totalAdded++
      }
      const total = res?.meta?.total || 0
      if (items.length === 0 || page * pageSize >= total) break
      page++
    }
    console.log(`[sitemap] added ${totalAdded} product URLs from ${apiBase}/products`)
  } catch (err) {
    console.error(`[sitemap] failed to fetch products from ${apiBase}/products:`, err?.message || err)
  }

  return urls
})
