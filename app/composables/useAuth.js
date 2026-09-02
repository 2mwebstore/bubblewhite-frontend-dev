import { reactive, computed } from 'vue'

const STORAGE_KEY = 'bw_admin_session'

// NOTE: this is module-level (singleton) state, which is fine for a
// client-only admin panel (see nuxt.config.ts's routeRules — /admin/** is
// ssr:false) but would be a cross-request data leak if ever read/written
// during actual SSR. The public storefront pages never call setSession/
// login, so state.token stays null for every server-rendered request.
function loadStored() {
  if (!import.meta.client) return { token: null, user: null, permissions: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null, permissions: [] }
    const parsed = JSON.parse(raw)
    return { token: parsed.token || null, user: parsed.user || null, permissions: parsed.permissions || [] }
  } catch {
    return { token: null, user: null, permissions: [] }
  }
}

const stored = loadStored()
const state = reactive({ token: stored.token, user: stored.user })
// Permissions granted to the current user's role. Persisted alongside the
// session (not just kept in memory) so a page refresh doesn't momentarily
// look "unauthorized" before GET /api/admin/me has a chance to re-fetch it —
// the route guard runs synchronously before that fetch can complete.
const rolePermissions = reactive({ list: stored.permissions })

function persist() {
  if (!import.meta.client) return
  if (state.token) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: state.token, user: state.user, permissions: rolePermissions.list })
    )
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function setSession(token, user) {
  state.token = token
  state.user = user
  persist()
}

function logout() {
  state.token = null
  state.user = null
  rolePermissions.list = []
  persist()
}

function setRolePermissions(list) {
  rolePermissions.list = list || []
  persist()
}

function hasPermission(slug) {
  if (!state.user) return false
  return rolePermissions.list.includes('*') || rolePermissions.list.includes(slug)
}

export function useAuth() {
  const isLoggedIn = computed(() => !!state.token)

  return {
    state,
    isLoggedIn,
    setSession,
    logout,
    setRolePermissions,
    hasPermission,
    myPermissions: computed(() => rolePermissions.list),
  }
}