<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="$emit('cancel')">
        <div class="bg-white rounded-card p-6 w-full max-w-sm">
          <p class="font-semibold mb-2">{{ title }}</p>
          <p class="text-sm text-muted mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn-secondary" @click="$emit('cancel')">បោះបង់</button>
            <button type="button" class="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-red-700 transition-colors" @click="$emit('confirm')">
              លុប
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'តើអ្នកប្រាកដទេ?' },
  message: { type: String, default: 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។' },
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
