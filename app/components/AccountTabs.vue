<template>
  <div class="flex gap-1 mb-6 border-b border-line">
    <NuxtLink
      to="/account"
      class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
      :class="route.path === '/account' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'"
    >
      ព័ត៌មានប្រវត្តិរូប
    </NuxtLink>
    <NuxtLink
      to="/account/change-password"
      class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
      :class="route.path === '/account/change-password' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'"
    >
      ប្តូរពាក្យសម្ងាត់
    </NuxtLink>
  </div>
</template>

<script setup>
const route = useRoute()
</script>
