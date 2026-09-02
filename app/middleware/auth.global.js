// Runs on every navigation. Storefront routes return immediately (cheap,
// and importantly means useAuth() — a localStorage-backed, client-only
// composable — is never touched while rendering a public SSR page).
//
// useAuth is imported explicitly here (rather than relying on Nuxt's
// auto-import) so that if app/composables/useAuth.js is ever missing or
// misplaced, the build fails loudly with a clear "module not found" error
// at the exact path — instead of a vague runtime "useAuth is not defined"
// that gives no hint about WHERE to look.
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  const { isLoggedIn, hasPermission } = useAuth()

  if (!isLoggedIn.value) {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }

  // Individual admin pages declare their required permission via
  // definePageMeta({ permission: 'product.view' }) — logged in but lacking
  // it sends them to the dashboard instead of a blank/broken page.
  if (to.meta.permission && !hasPermission(to.meta.permission)) {
    return navigateTo('/admin')
  }
})