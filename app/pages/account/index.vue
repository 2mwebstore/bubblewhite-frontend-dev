<template>
  <div class="max-w-lg mx-auto px-6 py-12 md:py-16">
    <h1 class="font-sans font-bold text-2xl mb-1">គណនីរបស់ខ្ញុំ</h1>
    <p class="text-sm text-muted mb-8">{{ state.customer?.phone }}</p>

    <AccountTabs />

    <div class="card-surface p-6">
      <p class="font-semibold mb-4">ព័ត៌មានផ្ទាល់ខ្លួន</p>
      <form class="space-y-4" @submit.prevent="submitProfile">
        <div>
          <FormLabel text="ឈ្មោះពេញ" required for-id="profile-name" />
          <input id="profile-name" v-model="profileForm.name" type="text" required class="input-field text-sm" />
        </div>
        <div>
          <FormLabel text="លេខទូរស័ព្ទ" required for-id="profile-phone" />
          <input id="profile-phone" v-model="profileForm.phone" type="tel" required class="input-field text-sm" />
        </div>
        <div>
          <FormLabel text="អ៊ីមែល (ស្រេចចិត្ត)" for-id="profile-email" />
          <input id="profile-email" v-model="profileForm.email" type="email" class="input-field text-sm" />
        </div>

        <p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>
        <p v-if="profileSaved" class="text-sm text-rust">បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានរួចរាល់។</p>

        <button type="submit" class="btn-primary" :disabled="savingProfile">
          <Loader2 v-if="savingProfile" :size="16" class="animate-spin" />
          {{ savingProfile ? 'កំពុងរក្សាទុក…' : 'រក្សាទុកព័ត៌មាន' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useCustomerApi } from '~/composables/useCustomerApi'
import { useCustomerAuth } from '~/composables/useCustomerAuth'

useSeoMeta({ title: 'គណនីរបស់ខ្ញុំ | BubbleWhite' })

const router = useRouter()
const api = useCustomerApi()
const { state, isLoggedIn, updateCustomer } = useCustomerAuth()

// This page is client-only (see nuxt.config.ts) since customer auth is
// localStorage-only and can't be verified during SSR — the guard runs
// after mount instead of in route middleware.
onMounted(() => {
  if (!isLoggedIn.value) {
    router.push({ path: '/login', query: { redirect: '/account' } })
    return
  }
  profileForm.name = state.customer?.name || ''
  profileForm.phone = state.customer?.phone || ''
  profileForm.email = state.customer?.email || ''
})

const profileForm = reactive({ name: '', phone: '', email: '' })
const savingProfile = ref(false)
const profileError = ref('')
const profileSaved = ref(false)

async function submitProfile() {
  profileError.value = ''
  profileSaved.value = false
  savingProfile.value = true
  try {
    const res = await api.put('/customer/me', profileForm)
    updateCustomer(res.data)
    profileSaved.value = true
  } catch (e) {
    profileError.value = e.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ'
  } finally {
    savingProfile.value = false
  }
}
</script>
