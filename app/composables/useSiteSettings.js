import { ref } from 'vue'
import { useCatalog } from './useCatalog'

// Module-level (not per-component) so every caller shares one fetch instead
// of the navbar, footer, about page, and contact page all independently
// hitting GET /api/settings on every page load.
const settings = ref(null)
const loaded = ref(false)
let inflight = null

export function useSiteSettings() {
  const { fetchSettings } = useCatalog()

  function ensureLoaded() {
    if (loaded.value) return Promise.resolve(settings.value)
    if (inflight) return inflight

    inflight = fetchSettings()
      .then((s) => {
        settings.value = s
        loaded.value = true
        return s
      })
      .catch(() => null)
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  return { settings, ensureLoaded }
}
