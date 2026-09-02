<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-bold text-2xl">តួនាទី & សិទ្ធិ</h1>
      <button v-if="hasPermission('role.create')" type="button" class="btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="2" /> បន្ថែមតួនាទី
      </button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 3" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else class="space-y-3">
      <div v-for="r in roles" :key="r.id" class="card-surface p-4 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium">{{ r.name }}</p>
            <span v-if="r.isSystem" class="text-[10px] px-2 py-0.5 rounded-full bg-cream-dark text-muted">System</span>
          </div>
          <p class="text-xs text-muted truncate">{{ r.description || r.slug }}</p>
          <p class="text-xs text-rust mt-1">
            {{ r.permissions.includes('*') ? 'គ្រប់សិទ្ធិទាំងអស់' : `${r.permissions.length} សិទ្ធិ` }}
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            v-if="hasPermission('role.update') && (r.slug !== 'admin' || isCurrentUserAdmin)"
            type="button"
            class="p-2 hover:bg-cream-dark rounded-lg"
            aria-label="កែប្រែ"
            @click="openEdit(r)"
          >
            <Pencil :size="16" :stroke-width="1.8" />
          </button>
          <button v-if="hasPermission('role.delete') && !r.isSystem" type="button" class="p-2 hover:bg-cream-dark rounded-lg text-red-600" aria-label="លុប" @click="toDelete = r">
            <Trash2 :size="16" :stroke-width="1.8" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/edit modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalOpen" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4 py-8" @click.self="modalOpen = false">
          <form class="bg-white rounded-card p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto" @submit.prevent="submit">
            <p class="font-semibold">{{ editing ? 'កែប្រែតួនាទី' : 'បន្ថែមតួនាទីថ្មី' }}</p>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <FormLabel text="ឈ្មោះតួនាទី" required for-id="role-name" />
                <input id="role-name" v-model="form.name" type="text" required class="input-field text-sm" />
              </div>
              <div>
                <FormLabel text="Slug" required for-id="role-slug" />
                <input id="role-slug" v-model="form.slug" type="text" required :disabled="editing?.isSystem" class="input-field text-sm" />
              </div>
            </div>
            <div>
              <FormLabel text="ការពិពណ៌នា" for-id="role-description" />
              <input id="role-description" v-model="form.description" type="text" class="input-field text-sm" />
            </div>

            <div>
              <p class="text-xs font-medium mb-2">សិទ្ធិ</p>
              <p v-if="!isCurrentUserAdmin" class="text-xs text-muted mb-2">
                អ្នកអាចផ្តល់តែសិទ្ធិដែលអ្នកខ្លួនឯងមានប៉ុណ្ណោះ។
              </p>
              <div class="space-y-3">
                <div v-for="(perms, group) in groupedPermissions" :key="group" class="border border-line rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted">{{ group }}</p>
                    <button type="button" class="text-xs text-rust hover:underline" @click="toggleGroup(perms)">
                      {{ perms.every((p) => form.permissions.includes(p.slug)) ? 'ដកទាំងអស់' : 'ជ្រើសទាំងអស់' }}
                    </button>
                  </div>
                  <label v-for="p in perms" :key="p.slug" class="flex items-center gap-2 text-sm py-1">
                    <input type="checkbox" class="accent-ink" :value="p.slug" v-model="form.permissions" />
                    {{ p.description || p.slug }}
                  </label>
                </div>
              </div>
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white">
              <button type="button" class="btn-secondary" @click="modalOpen = false">បោះបង់</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក' }}</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="!!toDelete"
      :title="`លុបតួនាទី '${toDelete?.name}'?`"
      message="អ្នកប្រើប្រាស់ដែលមានតួនាទីនេះនឹងត្រូវផ្លាស់ប្តូរតួនាទីជាមុនសិន។"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'role.view' })

import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'

const { listRoles, listPermissions, createRole, updateRole, deleteRole } = useAdmin()
const { hasPermission, state } = useAuth()
const { showToast } = useStore()

const roles = ref([])
const permissions = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const error = ref('')
const toDelete = ref(null)

const isCurrentUserAdmin = computed(() => state.user?.role === 'admin')

const form = reactive({ name: '', slug: '', description: '', permissions: [] })

// Non-Administrators only ever see (and can therefore only ever grant)
// permissions they themselves hold — matches the backend's own check in
// RoleController, so a lower-privileged user can never build a role with
// more power than their own account.
const grantablePermissions = computed(() =>
  isCurrentUserAdmin.value ? permissions.value : permissions.value.filter((p) => hasPermission(p.slug))
)

const groupedPermissions = computed(() => {
  const groups = {}
  for (const p of grantablePermissions.value) {
    if (!groups[p.group]) groups[p.group] = []
    groups[p.group].push(p)
  }
  return groups
})

function toggleGroup(perms) {
  const allSelected = perms.every((p) => form.permissions.includes(p.slug))
  if (allSelected) {
    form.permissions = form.permissions.filter((s) => !perms.some((p) => p.slug === s))
  } else {
    const toAdd = perms.map((p) => p.slug).filter((s) => !form.permissions.includes(s))
    form.permissions.push(...toAdd)
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.permissions = []
  error.value = ''
  modalOpen.value = true
}

function openEdit(r) {
  editing.value = r
  form.name = r.name
  form.slug = r.slug
  form.description = r.description || ''
  form.permissions = r.permissions.includes('*') ? grantablePermissions.value.map((p) => p.slug) : [...r.permissions]
  error.value = ''
  modalOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const [r, p] = await Promise.all([listRoles(), listPermissions()])
    roles.value = r
    permissions.value = p
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកទិន្នន័យបានទេ')
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const payload = { name: form.name, slug: form.slug, description: form.description, permissions: form.permissions }
    if (editing.value) {
      await updateRole(editing.value.id, payload)
      showToast('បានកែប្រែតួនាទីរួចរាល់')
    } else {
      await createRole(payload)
      showToast('បានបង្កើតតួនាទីថ្មីរួចរាល់')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    error.value = e.message || 'មិនអាចរក្សាទុកបានទេ'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  const r = toDelete.value
  toDelete.value = null
  try {
    await deleteRole(r.id)
    showToast(`បានលុប "${r.name}"`)
    load()
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបបានទេ')
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
