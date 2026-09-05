<template>
  <div class="bg-ink text-cream text-xs">
    <div class="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
      <p class="hidden sm:flex items-center gap-1.5 opacity-90">
        <Truck :size="14" :stroke-width="1.5" class="shrink-0" />
        សម្រាប់បងៗនៅភ្នំពេញអាច​ទូទាត់​ប្រាក់នៅពេលទទួល​អីវ៉ាន់​បាន
      </p>
      <p class="flex-1 sm:flex-none text-center font-medium">កម្រងផលិតផលថ្មី — រដូវក្តៅ ២០២៦ មកដល់ហើយ</p>
      <div class="hidden sm:flex items-center gap-4 opacity-90">
        <NuxtLink to="/contact" class="hover:opacity-70">មជ្ឈមណ្ឌលជំនួយ</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Truck } from 'lucide-vue-next'
</script>
