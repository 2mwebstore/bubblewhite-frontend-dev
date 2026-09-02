import { ref, watch } from 'vue'

/**
 * Small helper around the backend's { errors: { field: "message" } }
 * validation response shape, so every admin form handles it the same way
 * instead of each one inventing its own ad-hoc idError/slugError ref.
 */
export function useFieldErrors() {
  const fieldErrors = ref({})

  // Populate from a caught API error (see useApi.js — err.fieldErrors is
  // set from the response envelope's `errors` map).
  function setFromError(e) {
    fieldErrors.value = e?.fieldErrors || {}
  }

  function clear(field) {
    if (!field) {
      fieldErrors.value = {}
      return
    }
    if (!fieldErrors.value[field]) return
    const next = { ...fieldErrors.value }
    delete next[field]
    fieldErrors.value = next
  }

  // Auto-clears one field's error the moment its value changes, so the red
  // state disappears as soon as the admin starts fixing it instead of only
  // on the next submit attempt.
  function watchField(getter, field) {
    watch(getter, () => clear(field))
  }

  return { fieldErrors, setFromError, clear, watchField }
}
