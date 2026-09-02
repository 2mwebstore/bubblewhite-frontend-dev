<!-- src/components/admin/AdminPagination.vue -->
<template>
  <div v-if="meta && meta.totalPage > 1" class="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
    <span>ទំព័រ {{ meta.page }} នៃ {{ meta.totalPage }} · សរុប {{ meta.total }}</span>
    <div class="flex gap-1">
      <button
        type="button"
        class="rounded-md border border-line p-1.5 hover:bg-cream-dark disabled:opacity-40"
        :disabled="meta.page <= 1"
        aria-label="ទំព័រមុន"
        @click="emit('change', meta.page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="rounded-md border border-line p-1.5 hover:bg-cream-dark disabled:opacity-40"
        :disabled="meta.page >= meta.totalPage"
        aria-label="ទំព័របន្ទាប់"
        @click="emit('change', meta.page + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

// meta shape matches the backend's utils.PageMeta: { page, pageSize, total, totalPage }
defineProps({
  meta: { type: Object, default: null },
})
const emit = defineEmits(['change'])
</script>
