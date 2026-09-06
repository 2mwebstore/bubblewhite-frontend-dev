<template>
  <svg viewBox="0 0 200 240" class="w-2/3 h-2/3" fill="none">
    <circle cx="100" cy="120" r="86" :fill="bg" />
    <g :stroke="fg" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <!-- tee -->
      <path v-if="kind === 'tee' || kind === 'women'" d="M70 70 L40 92 L55 112 L70 100 V180 H130 V100 L145 112 L160 92 L130 70 Q100 84 70 70 Z" />
      <!-- hoodie -->
      <path v-else-if="kind === 'hoodie'" d="M68 78 Q100 58 132 78 L150 96 L165 88 L152 118 L134 108 V182 H66 V108 L48 118 L35 88 L50 96 Z" />
      <path v-if="kind === 'hoodie'" d="M78 78 Q100 96 122 78" />
      <!-- cap -->
      <path v-else-if="kind === 'cap'" d="M55 130 Q100 96 145 130 L150 138 H50 Z" />
      <path v-if="kind === 'cap'" d="M148 134 L182 142 L150 148 Z" />
      <!-- sweatshirt / default -->
      <path v-else-if="kind === 'sweat'" d="M66 82 L40 100 L54 120 L68 108 V182 H132 V108 L146 120 L160 100 L134 82 Q100 96 66 82 Z" />
    </g>
    <text x="100" y="220" text-anchor="middle" font-family="Manrope, sans-serif" font-size="9" letter-spacing="2" :fill="fg" opacity="0.55">BUBBLE WHITE</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  seed: { type: String, required: true },
})

const kind = computed(() => {
  const s = props.seed
  if (s.includes('hoodie')) return 'hoodie'
  if (s.includes('cap')) return 'cap'
  if (s.includes('sweat') || s.includes('crewneck')) return 'sweat'
  if (s.includes('women')) return 'women'
  return 'tee'
})

// alternate two quiet palettes for visual rhythm across grids
const alt = computed(() => {
  let hash = 0
  for (const c of props.seed) hash += c.charCodeAt(0)
  return hash % 2 === 0
})

const bg = computed(() => (alt.value ? '#EFE8DA' : '#E9E0CD'))
const fg = computed(() => '#232019')
</script>
