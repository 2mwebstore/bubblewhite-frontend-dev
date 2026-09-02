<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">សារទំនាក់ទំនង</h1>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-20 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="messages.length" class="space-y-3">
      <div
        v-for="m in messages"
        :key="m.id"
        class="card-surface p-4 flex flex-col sm:flex-row sm:items-start gap-3"
        :class="!m.isRead ? 'border-rust/40' : ''"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span v-if="!m.isRead" class="w-2 h-2 rounded-full bg-rust shrink-0" />
            <p class="font-medium truncate">{{ m.name }}</p>
            <span class="text-xs text-muted">{{ m.email }}</span>
          </div>
          <p v-if="m.subject" class="text-sm font-medium mb-1">{{ m.subject }}</p>
          <p class="text-sm text-muted whitespace-pre-line">{{ m.message }}</p>
          <p class="text-xs text-muted mt-2">{{ formatDate(m.createdAt) }}</p>
        </div>
        <div class="flex sm:flex-col gap-2 shrink-0">
          <button v-if="!m.isRead" type="button" class="p-2 hover:bg-cream-dark rounded-lg" aria-label="សម្គាល់ថាបានអាន" @click="markRead(m)">
            <Check :size="16" :stroke-width="1.8" />
          </button>
          <button type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600" aria-label="លុប" @click="toDelete = m">
            <Trash2 :size="16" :stroke-width="1.8" />
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">មិនមានសារទេ។</p>
    </div>

    <ConfirmDialog
      :open="!!toDelete"
      :title="`លុបសារពី '${toDelete?.name}'?`"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'contact.view' })

import { ref, onMounted } from 'vue'
import { Check, Trash2 } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useStore } from '~/composables/useStore'

const { listContacts, markContactRead, deleteContact } = useAdmin()
const { showToast } = useStore()

const messages = ref([])
const loading = ref(true)
const toDelete = ref(null)

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('km-KH', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  loading.value = true
  try {
    const list = await listContacts()
    // Unread first, then newest first.
    messages.value = [...list].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកសារបានទេ')
  } finally {
    loading.value = false
  }
}

async function markRead(m) {
  try {
    await markContactRead(m.id)
    m.isRead = true
  } catch (e) {
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

async function confirmDelete() {
  const m = toDelete.value
  toDelete.value = null
  try {
    await deleteContact(m.id)
    showToast('បានលុបសារ')
    load()
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបសារបានទេ')
  }
}

onMounted(load)
</script>
