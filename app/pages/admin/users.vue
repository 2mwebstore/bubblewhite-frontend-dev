<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-bold text-2xl">អ្នកប្រើប្រាស់</h1>
      <button v-if="hasPermission('user.create')" type="button" class="btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="2" /> បន្ថែមអ្នកប្រើប្រាស់
      </button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-16 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="users.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3">ឈ្មោះ</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">អ៊ីមែល</th>
            <th class="text-left px-4 py-3">តួនាទី</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">ស្ថានភាព</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="u in users" :key="u.id">
            <td class="px-4 py-3 font-medium">
              <span class="flex items-center gap-1.5">
                {{ u.name }}
                <ShieldCheck v-if="isAdminRole(u)" :size="14" class="text-rust" aria-label="Administrator" />
              </span>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-muted">{{ u.email }}</td>
            <td class="px-4 py-3">
              <SearchableSelect
                :model-value="u.roleId"
                :options="roleOptionsFor(u)"
                :clearable="false"
                :searchable="false"
                :disabled="!hasPermission('user.manage') || isAdminRole(u)"
                :title="isAdminRole(u) ? 'តួនាទី Administrator មិនអាចប្តូរបានទេ' : undefined"
                class="w-40"
                @update:model-value="(val) => changeRole(u, val)"
              />
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <button
                type="button"
                class="text-xs px-2 py-1 rounded-full"
                :class="u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                :disabled="!hasPermission('user.update')"
                @click="toggleActive(u)"
              >
                {{ u.isActive ? 'សកម្ម' : 'អសកម្ម' }}
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-if="hasPermission('user.update')"
                  type="button"
                  class="p-2 hover:bg-cream-dark rounded-lg"
                  aria-label="កំណត់ពាក្យសម្ងាត់ថ្មី"
                  title="កំណត់ពាក្យសម្ងាត់ថ្មី"
                  @click="openResetPassword(u)"
                >
                  <KeyRound :size="16" :stroke-width="1.8" />
                </button>
                <button
                  v-if="hasPermission('user.delete')"
                  type="button"
                  class="p-2 rounded-lg text-red-600"
                  :class="isAdminRole(u) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cream-dark'"
                  :disabled="isAdminRole(u)"
                  :title="isAdminRole(u) ? 'មិនអាចលុបគណនី Administrator បានទេ' : 'លុប'"
                  aria-label="លុប"
                  @click="!isAdminRole(u) && (toDelete = u)"
                >
                  <Trash2 :size="16" :stroke-width="1.8" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">មិនមានអ្នកប្រើប្រាស់ទេ។</p>
    </div>

    <!-- Create modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalOpen" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="modalOpen = false">
          <form class="bg-white rounded-card p-6 w-full max-w-sm space-y-4" @submit.prevent="submit">
            <p class="font-semibold">បន្ថែមអ្នកប្រើប្រាស់ថ្មី</p>

            <div>
              <FormLabel text="ឈ្មោះ" required for-id="user-name" />
              <input id="user-name" v-model="form.name" type="text" required class="input-field text-sm" />
            </div>
            <div>
              <FormLabel text="អ៊ីមែល" required for-id="user-email" />
              <input id="user-email" v-model="form.email" type="email" required class="input-field text-sm" />
            </div>
            <div>
              <FormLabel text="ពាក្យសម្ងាត់" required for-id="user-password" />
              <input id="user-password" v-model="form.password" type="password" required minlength="6" class="input-field text-sm" />
            </div>
            <div>
              <SearchableSelect
                v-model="form.roleId"
                :options="assignableRoleOptions"
                label="តួនាទី"
                required
                placeholder="ជ្រើសរើសតួនាទី"
                :clearable="false"
                :searchable="false"
              />
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="modalOpen = false">បោះបង់</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'កំពុងបង្កើត…' : 'បង្កើត' }}</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <!-- Reset password modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="resetTarget" class="fixed inset-0 z-[200] bg-ink/50 flex items-center justify-center px-4" @click.self="resetTarget = null">
          <form class="bg-white rounded-card p-6 w-full max-w-sm space-y-4" @submit.prevent="submitReset">
            <p class="font-semibold">កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ {{ resetTarget?.name }}</p>
            <p class="text-xs text-muted">មិនចាំបាច់ដឹងពាក្យសម្ងាត់ចាស់ទេ — នេះជាសកម្មភាពរបស់អ្នកគ្រប់គ្រង។</p>

            <div>
              <FormLabel text="ពាក្យសម្ងាត់ថ្មី" required for-id="reset-password" />
              <input id="reset-password" v-model="resetPasswordValue" type="password" required minlength="6" class="input-field text-sm" />
            </div>

            <p v-if="resetError" class="text-sm text-red-600">{{ resetError }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="resetTarget = null">បោះបង់</button>
              <button type="submit" class="btn-primary" :disabled="resetSaving">{{ resetSaving ? 'កំពុងរក្សាទុក…' : 'កំណត់ពាក្យសម្ងាត់' }}</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="!!toDelete"
      :title="`លុប '${toDelete?.name}'?`"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'user.view' })

import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Trash2, KeyRound, ShieldCheck } from 'lucide-vue-next'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import { useAdmin } from '~/composables/useAdmin'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'

const { listUsers, createUser, deleteUser, assignRole, updateUser, listRoles, resetUserPassword } = useAdmin()
const { hasPermission, state } = useAuth()
const { showToast } = useStore()

const users = ref([])
const roles = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const saving = ref(false)
const error = ref('')
const toDelete = ref(null)

// Only an existing Administrator can grant the Administrator role to anyone
// (including a new user) — everyone else simply doesn't see it as an
// option, matching the same restriction the backend enforces.
const isCurrentUserAdmin = computed(() => state.user?.role === 'admin')
const allRoleOptions = computed(() => roles.value.map((r) => ({ value: r.id, label: r.name })))
const assignableRoleOptions = computed(() =>
  roles.value
    .filter((r) => r.slug !== 'admin' || isCurrentUserAdmin.value)
    .map((r) => ({ value: r.id, label: r.name }))
)
// A row whose CURRENT role is already Administrator needs the full option
// list so its (disabled) dropdown still displays "Administrator" correctly
// instead of falling back to a raw id — filtering it out entirely would
// otherwise break that display for non-admin viewers.
function roleOptionsFor(u) {
  return isAdminRole(u) ? allRoleOptions.value : assignableRoleOptions.value
}

// The built-in Administrator role — protects against deleting or demoting
// an admin account straight from this list. Matches the backend's own
// protection in UserService (defense in depth: even if this check were
// somehow bypassed client-side, the API refuses the same actions).
function isAdminRole(u) {
  const role = roles.value.find((r) => r.id === u.roleId)
  return role?.slug === 'admin'
}

const form = reactive({ name: '', email: '', password: '', roleId: '' })

function openCreate() {
  form.name = ''
  form.email = ''
  form.password = ''
  form.roleId = assignableRoleOptions.value[0]?.value || ''
  error.value = ''
  modalOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const [u, r] = await Promise.all([listUsers(), listRoles()])
    users.value = u
    roles.value = r
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
    await createUser({ ...form, roleId: Number(form.roleId) })
    showToast('បានបង្កើតអ្នកប្រើប្រាស់ថ្មីរួចរាល់')
    modalOpen.value = false
    load()
  } catch (e) {
    error.value = e.message || 'មិនអាចបង្កើតបានទេ'
  } finally {
    saving.value = false
  }
}

async function changeRole(u, roleId) {
  if (isAdminRole(u)) return
  try {
    await assignRole(u.id, Number(roleId))
    u.roleId = Number(roleId)
    showToast('បានផ្លាស់ប្តូរតួនាទីរួចរាល់')
  } catch (e) {
    showToast(e.message || 'មិនអាចផ្លាស់ប្តូរតួនាទីបានទេ')
  }
}

async function toggleActive(u) {
  try {
    await updateUser(u.id, { name: u.name, isActive: !u.isActive })
    u.isActive = !u.isActive
  } catch (e) {
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

async function confirmDelete() {
  const u = toDelete.value
  toDelete.value = null
  try {
    await deleteUser(u.id)
    showToast(`បានលុប "${u.name}"`)
    load()
  } catch (e) {
    showToast(e.message || 'មិនអាចលុបបានទេ')
  }
}

// --- Admin reset another user's password ---
const resetTarget = ref(null)
const resetPasswordValue = ref('')
const resetSaving = ref(false)
const resetError = ref('')

function openResetPassword(u) {
  resetTarget.value = u
  resetPasswordValue.value = ''
  resetError.value = ''
}

async function submitReset() {
  resetError.value = ''
  resetSaving.value = true
  try {
    await resetUserPassword(resetTarget.value.id, resetPasswordValue.value)
    showToast(`បានកំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ "${resetTarget.value.name}"`)
    resetTarget.value = null
  } catch (e) {
    resetError.value = e.message || 'មិនអាចកំណត់ពាក្យសម្ងាត់បានទេ'
  } finally {
    resetSaving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
