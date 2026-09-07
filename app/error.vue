<template>
  <div class="min-h-screen flex flex-col bg-cream text-ink font-body">
    <NavBar />
    <main class="flex-1 max-w-md mx-auto px-6 py-24 text-center w-full">
      <p class="font-sans font-extrabold text-5xl mb-4">{{ error?.statusCode || 404 }}</p>
      <h1 class="text-lg font-medium mb-2">{{ isNotFound ? 'ទំព័រនេះបានបាត់ទៅហើយ' : 'មានបញ្ហាកើតឡើង' }}</h1>
      <p class="text-sm text-muted mb-6">
        {{ isNotFound ? 'ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមាន ឬត្រូវបានផ្លាស់ទី។' : 'សូមព្យាយាមម្តងទៀត ឬត្រឡប់ទៅទំព័រដើម។' }}
      </p>
      <button type="button" class="btn-primary" @click="goHome">ត្រឡប់ទៅទំព័រដើម</button>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup>
const props = defineProps({
  error: { type: Object, default: null },
})

const isNotFound = computed(() => (props.error?.statusCode || 404) === 404)

useSeoMeta({
  title: isNotFound.value ? 'រកមិនឃើញទំព័រ | BubbleWhite' : 'មានបញ្ហាកើតឡើង | BubbleWhite',
  description: 'មិនអាចរកឃើញទំព័រនេះទេ។',
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>
