import { reactive } from 'vue'

const state = reactive({
  toast: null,
})

let toastTimer = null
function showToast(message) {
  state.toast = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (state.toast = null), 2200)
}

export function useStore() {
  return {
    state,
    showToast,
  }
}
