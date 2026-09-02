<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
    :class="isActive ? 'bg-ink text-cream' : 'text-ink/70 hover:bg-cream-dark'"
  >
    <component :is="icon" :size="18" :stroke-width="1.8" />
    {{ label }}
  </NuxtLink>
</template>

<script setup>
import { computed } from 'vue'


const props = defineProps({
  to: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  label: { type: String, required: true },
})

const route = useRoute()
const isActive = computed(() => {
  if (props.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(props.to)
})
</script>
