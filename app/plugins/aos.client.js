// AOS ("Animate On Scroll") manipulates the DOM and observes scroll
// position, so it can only ever run in the browser — hence the `.client`
// suffix, which tells Nuxt to skip this file entirely during SSR instead
// of crashing on `window`/`document` access.
import AOS from 'aos'
import 'aos/dist/aos.css'

export default defineNuxtPlugin((nuxtApp) => {
  AOS.init({
    duration: 600,
    easing: 'ease-out-cubic',
    once: false,
    mirror: true,
    offset: 60,
  })

  // Re-scan the DOM for new [data-aos] elements after each client-side page
  // transition, and reset scroll-triggered state so animations replay on
  // the new page — the Nuxt equivalent of the old router.afterEach() hook.
  nuxtApp.hook('page:finish', () => {
    setTimeout(() => AOS.refreshHard(), 50)
  })
})
