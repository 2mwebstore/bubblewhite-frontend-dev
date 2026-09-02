<!-- app/components/FormLabel.vue -->
<template>
  <label v-if="text" :for="forId" class="text-xs font-medium block mb-1">
    {{ text }} <span v-if="required" class="text-rust" aria-hidden="true">*</span>
    <span v-if="required" class="sr-only">(ត្រូវការ)</span>
  </label>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
  required: { type: Boolean, default: false },
  // Pass the matching input's id to make this a real <label for="...">
  // instead of just floating text above the field.
  forId: { type: String, default: undefined },
})
</script>
