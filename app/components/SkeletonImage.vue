<template>
  <div
    class="pearl-image relative overflow-hidden"
    :class="wrapperClass"
    :aria-busy="Boolean(src && !loaded && !failed)"
  >
    <!-- Loading animation -->
    <Transition name="placeholder">
      <div
        v-if="src && !loaded && !failed"
        class="pearl-placeholder"
        aria-hidden="true"
      >
        <div class="pearl-glow" />

        <div class="pearl-stage">
          <div class="pearl-shadow" />
          <div class="pearl pearl-main" />
          <div class="pearl pearl-secondary" />
          <div class="pearl pearl-small" />
        </div>

        <div class="pearl-sweep" />
      </div>
    </Transition>

    <!-- Image -->
    <img
      v-if="src && !failed"
      :key="src"
      ref="imageRef"
      :src="src"
      :alt="alt"
      :style="objectPosition ? { objectPosition } : undefined"
      :class="[
        imgClass,
        'pearl-photo',
        { 'pearl-photo-ready': loaded },
      ]"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Missing or failed image -->
    <div
      v-else
      class="pearl-fallback"
      role="img"
      :aria-label="alt ? `${alt} — image unavailable` : 'Image unavailable'"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m3 17 5-5 4 4 3-3 6 6" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: '' },
  wrapperClass: { type: String, default: 'w-full h-full' },
  imgClass: { type: String, default: 'w-full h-full object-cover' },
  objectPosition: { type: String, default: '' },
  eager: { type: Boolean, default: false },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
})

const imageRef = ref(null)
const loaded = ref(false)
const failed = ref(false)

function isCurrentImage(image) {
  return (
    image === imageRef.value &&
    image?.getAttribute('src') === props.src
  )
}

function handleLoad(event) {
  if (!isCurrentImage(event.target)) return

  loaded.value = true
  failed.value = false
}

function handleError(event) {
  if (!isCurrentImage(event.target)) return

  failed.value = true
  loaded.value = false
}

// Also handles cached images that finished before handlers were attached.
function checkCachedImage() {
  const image = imageRef.value

  if (!props.src || !isCurrentImage(image) || !image.complete) return

  loaded.value = image.naturalWidth > 0
  failed.value = !loaded.value
}

watch(
  () => props.src,
  async () => {
    loaded.value = false
    failed.value = false

    await nextTick()
    checkCachedImage()
  },
  { flush: 'sync' },
)

onMounted(checkCachedImage)
</script>

<style scoped>
.pearl-image {
  /* Container units keep the pearls circular even in tall product cards. */
  container-type: inline-size;
  isolation: isolate;
  background: #f2eee8;
}

.pearl-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(135deg, #f8f5ef, #eee8df);
}

.pearl-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.9),
    transparent 70%
  );
  animation: pearl-glow-pulse 3.5s ease-in-out infinite;
}

.pearl-stage {
  position: relative;
  z-index: 2;
  width: 64px;
  width: clamp(12px, 30cqw, 86px);
  aspect-ratio: 1;
  animation: pearl-stage-in 650ms cubic-bezier(.22, 1, .36, 1) both;
}

.pearl {
  position: absolute;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 50%;
  background: radial-gradient(
    circle at 28% 24%,
    #fff 0%,
    rgba(255, 255, 255, 0.8) 15%,
    rgba(237, 232, 222, 0.55) 48%,
    rgba(199, 189, 173, 0.6) 80%,
    rgba(255, 255, 255, 0.9) 100%
  );
  box-shadow:
    inset -4px -5px 9px rgba(153, 136, 110, 0.13),
    inset 2px 3px 7px rgba(255, 255, 255, 0.95),
    0 8px 14px -7px rgba(100, 85, 65, 0.2);
  animation: pearl-float 3.2s ease-in-out infinite;
}

.pearl::before {
  content: '';
  position: absolute;
  top: 17%;
  left: 22%;
  width: 25%;
  height: 17%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(-35deg);
}

.pearl-main {
  top: 12%;
  left: 10%;
  width: 59%;
}

.pearl-secondary {
  top: 48%;
  right: 3%;
  width: 40%;
  animation-delay: -1.1s;
}

.pearl-small {
  top: 5%;
  right: 8%;
  width: 19%;
  animation-delay: -2.1s;
}

.pearl-shadow {
  position: absolute;
  bottom: 1%;
  left: 18%;
  width: 65%;
  height: 9%;
  border-radius: 50%;
  background: rgba(110, 95, 70, 0.12);
  filter: blur(3px);
  animation: pearl-shadow-pulse 3.2s ease-in-out infinite;
}

.pearl-sweep {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 75%
  );
  transform: translateX(-110%);
  animation: pearl-shimmer 2.4s ease-in-out infinite;
}

.pearl-photo {
  display: block;
  opacity: 0;
  transform: scale(1.025);
  transition:
    opacity 550ms ease,
    transform 850ms cubic-bezier(.22, 1, .36, 1);
}

.pearl-photo-ready {
  opacity: 1;
  transform: scale(1);
}

.placeholder-leave-active {
  transition: opacity 450ms ease;
}

.placeholder-leave-to {
  opacity: 0;
}

.pearl-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #f2eee8;
  color: #a69c8e;
}

@keyframes pearl-float {
  0%, 100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-13%) rotate(5deg);
  }
}

@keyframes pearl-shadow-pulse {
  0%, 100% {
    transform: scaleX(1);
    opacity: 0.8;
  }
  50% {
    transform: scaleX(0.75);
    opacity: 0.4;
  }
}

@keyframes pearl-shimmer {
  0% {
    transform: translateX(-110%);
  }
  65%, 100% {
    transform: translateX(110%);
  }
}

@keyframes pearl-glow-pulse {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}

@keyframes pearl-stage-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pearl-image *,
  .pearl-image *::before,
  .pearl-image *::after {
    animation: none !important;
    transition: none !important;
  }

  .pearl-photo {
    transform: none;
  }

  .pearl-sweep {
    display: none;
  }
}
</style>
