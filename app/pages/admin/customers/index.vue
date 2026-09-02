<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">អតិថិជន</h1>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 6" :key="n" class="h-14 rounded-card bg-cream-dark animate-pulse" />
    </div>

    <div v-else-if="customers.length" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-cream-dark text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="text-left px-4 py-3">ឈ្មោះ</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">លេខទូរស័ព្ទ</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">អ៊ីមែល</th>
            <th class="text-left px-4 py-3">ស្ថានភាព</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="cust in customers" :key="cust.id">
            <td class="px-4 py-3 font-medium">
              <NuxtLink :to="`/admin/customers/${cust.id}`" class="hover:text-rust hover:underline">{{ cust.name }}</NuxtLink>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-muted">{{ cust.phone }}</td>
            <td class="px-4 py-3 hidden md:table-cell text-muted">{{ cust.email || '—' }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="text-xs px-2 py-1 rounded-full"
                :class="cust.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                @click="onToggleActive(cust)"
              >
                {{ cust.isActive ? 'សកម្ម' : 'ផ្អាក' }}
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end">
                <button
                  type="button"
                  class="p-2 hover:bg-cream-dark rounded-lg"
                  aria-label="កំណត់ពាក្យសម្ងាត់ថ្មី"
                  title="កំណត់ពាក្យសម្ងាត់ថ្មី"
                  @click="openResetPassword(cust)"
                >
                  <KeyRound :size="16" :stroke-width="1.8" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :meta="meta" @change="(p) => (page = p)" />
    </div>
    <div v-else class="text-center py-16 border border-dashed border-line rounded-card">
      <p class="text-sm text-muted">មិនមានអតិថិជនទេ។</p>
    </div>

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
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'customer.view' })

import { ref, watch, onMounted } from 'vue'
import { KeyRound } from 'lucide-vue-next'
import { useAdminCustomers } from '~/composables/useAdminCustomers'
import { useStore } from '~/composables/useStore'
import AdminPagination from '~/components/admin/AdminPagination.vue'

const { listCustomers, resetCustomerPassword, setCustomerActive } = useAdminCustomers()
const { showToast } = useStore()

const customers = ref([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPage: 1 })

async function load() {
  loading.value = true
  try {
    const res = await listCustomers({ page: page.value, pageSize: 20 })
    customers.value = res.data || []
    meta.value = res.meta || meta.value
  } catch (e) {
    showToast(e.message || 'មិនអាចទាញយកអតិថិជនបានទេ')
  } finally {
    loading.value = false
  }
}

watch(page, load)
onMounted(load)

async function onToggleActive(cust) {
  const next = !cust.isActive
  try {
    await setCustomerActive(cust.id, next)
    cust.isActive = next
    showToast(next ? `បានបើកគណនី "${cust.name}"` : `បានផ្អាកគណនី "${cust.name}"`)
  } catch (e) {
    showToast(e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ')
  }
}

// --- Reset password ---
const resetTarget = ref(null)
const resetPasswordValue = ref('')
const resetSaving = ref(false)
const resetError = ref('')

function openResetPassword(cust) {
  resetTarget.value = cust
  resetPasswordValue.value = ''
  resetError.value = ''
}

async function submitReset() {
  resetError.value = ''
  resetSaving.value = true
  try {
    await resetCustomerPassword(resetTarget.value.id, resetPasswordValue.value)
    showToast(`បានកំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ "${resetTarget.value.name}"`)
    resetTarget.value = null
  } catch (e) {
    resetError.value = e.message || 'មិនអាចកំណត់ពាក្យសម្ងាត់បានទេ'
  } finally {
    resetSaving.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
