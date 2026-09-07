<template>
  <div>
    <section class="max-w-7xl mx-auto px-6 py-16 items-center" data-aos="zoom-in">
      <div class="w-full card-surface overflow-hidden">
        <img src="/banners/contact-hero.png" alt="កាតកូនក្រណាត់ BubbleWhite" class="w-full h-full object-cover" loading="eager" fetchpriority="high" />
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-12">
      <div data-aos="zoom-in">
        <h2 class="font-semibold text-lg mb-6">ទាក់ទងមកយើង</h2>
        <ul class="space-y-5 text-sm">
          <li class="flex items-start gap-3"><MapPin :size="18" :stroke-width="1.6" class="shrink-0 mt-0.5 text-rust" /><div><p class="font-medium">ទីតាំងរបស់យើង</p><p class="text-muted">{{ settings?.contactAddress || 'ភ្នំពេញ, កម្ពុជា' }}</p></div></li>
          <li class="flex items-start gap-3"><Mail :size="18" :stroke-width="1.6" class="shrink-0 mt-0.5 text-rust" /><div><p class="font-medium">អ៊ីមែលមកយើង</p><p class="text-muted">{{ settings?.contactEmail || 'hello@bubblewhite.co' }}</p></div></li>
          <li class="flex items-start gap-3"><Phone :size="18" :stroke-width="1.6" class="shrink-0 mt-0.5 text-rust" /><div><p class="font-medium">ទូរស័ព្ទមកយើង</p><p class="text-muted">{{ settings?.contactPhone || '+855 12 345 678' }}</p></div></li>
          <li class="flex items-start gap-3"><Clock :size="18" :stroke-width="1.6" class="shrink-0 mt-0.5 text-rust" /><div><p class="font-medium">ម៉ោងធ្វើការ</p><p class="text-muted">{{ settings?.workingHours || 'ចន្ទ – អាទិត្យ / ៩ព្រឹក – ៩យប់' }}</p></div></li>
        </ul>
      </div>

      <form class="space-y-4" data-aos="zoom-in" @submit.prevent="submit">
        <h2 class="font-semibold text-lg mb-2">ផ្ញើសារមកយើង</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="name" class="text-xs font-medium block mb-1">ឈ្មោះពេញ</label>
            <input id="name" v-model="form.name" required type="text" placeholder="ឈ្មោះរបស់អ្នក" class="input-field" />
          </div>
          <div>
            <label for="email" class="text-xs font-medium block mb-1">អាសយដ្ឋានអ៊ីមែល</label>
            <input id="email" v-model="form.email" required type="email" placeholder="អ៊ីមែលរបស់អ្នក" class="input-field" />
          </div>
        </div>
        <div>
          <label for="subject" class="text-xs font-medium block mb-1">ប្រធានបទ</label>
          <input id="subject" v-model="form.subject" required type="text" placeholder="តើយើងអាចជួយអ្វីបាន?" class="input-field" />
        </div>
        <div>
          <label for="message" class="text-xs font-medium block mb-1">សារ</label>
          <textarea id="message" v-model="form.message" required rows="4" placeholder="សរសេរសាររបស់អ្នកនៅទីនេះ…" class="input-field rounded-2xl"></textarea>
        </div>
        <button type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? 'កំពុងផ្ញើ…' : 'ផ្ញើសារ' }}</button>
        <p v-if="sent" class="text-sm text-rust">សូមអរគុណ {{ form.name || 'អ្នក' }} — យើងនឹងទាក់ទងអ្នកឆាប់ៗនេះ។</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>
    </section>

    <section class="bg-cream-dark border-t border-line">
      <div class="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-12 items-start">
        <div class="md:col-span-2" data-aos="zoom-in">
          <h2 class="font-sans font-bold text-2xl mb-6">សំណួរដែលសួរញឹកញាប់</h2>
          <div class="divide-y divide-line border-y border-line">
            <div v-for="(faq, i) in faqs" :key="faq.q">
              <button type="button" class="w-full flex items-center justify-between py-4 text-left font-medium" @click="openFaq = openFaq === i ? -1 : i">
                {{ faq.q }}
                <Minus v-if="openFaq === i" :size="18" :stroke-width="1.8" />
                <Plus v-else :size="18" :stroke-width="1.8" />
              </button>
              <p v-if="openFaq === i" class="pb-4 text-sm text-muted">{{ faq.a }}</p>
            </div>
          </div>
        </div>
        <div class="hidden md:block aspect-square card-surface overflow-hidden" data-aos="zoom-in">
          <img src="/banners/faq-flatlay.png" alt="អាវយឺត និងអាវហ៊ូឌី BubbleWhite បត់ជាប់" class="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { MapPin, Mail, Phone, Clock, Minus, Plus } from 'lucide-vue-next'
import { useCatalog } from '~/composables/useCatalog'
import { useSiteSettings } from '~/composables/useSiteSettings'

const { submitContact } = useCatalog()
const { settings, ensureLoaded } = useSiteSettings()
await useAsyncData('site-settings', ensureLoaded)

const form = reactive({ name: '', email: '', subject: '', message: '' })
const sent = ref(false)
const submitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await submitContact(form)
    sent.value = true
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
  } catch (e) {
    error.value = e.message || 'មិនអាចផ្ញើសារបានទេ សូមព្យាយាមម្តងទៀត។'
  } finally {
    submitting.value = false
  }
}

const openFaq = ref(0)
const faqs = [
  { q: 'តើការដឹកជញ្ជូនប្រើពេលប៉ុន្មាន?', a: 'ការបញ្ជាទិញក្នុងភ្នំពេញជាធម្មតាមកដល់ក្នុងរយៈពេល ១–២ ថ្ងៃធ្វើការ រីឯតាមខេត្តត្រូវការ ៣–៥ ថ្ងៃ។' },
  { q: 'តើខ្ញុំអាចប្តូរ ឬសងទំនិញបានទេ?', a: 'បាទ/ចាស — ទំនិញដែលមិនទាន់ពាក់ និងមានស្លាកនៅគ្រប់ អាចប្តូរ ឬសងវិញបានក្នុងរយៈពេល ៣០ ថ្ងៃ បន្ទាប់ពីទទួល។' },
  { q: 'តើខ្ញុំអាចតាមដានការបញ្ជាទិញរបស់ខ្ញុំដោយរបៀបណា?', a: 'នៅពេលការបញ្ជាទិញរបស់អ្នកត្រូវបានដឹកជញ្ជូន អ្នកនឹងទទួលបានតំណតាមដានតាមអ៊ីមែល ឬ Telegram។' },
  { q: 'តើអ្នកទទួលការទូទាត់តាមមធ្យោបាយអ្វីខ្លះ?', a: 'យើងទទួល ABA PayWay, KHQR, Visa និង Mastercard។' },
]

const title = 'ទំនាក់ទំនង | BubbleWhite'
const description = 'ទាក់ទងមក BubbleWhite — សំណួរអំពីការបញ្ជាទិញ ការដឹកជញ្ជូន ការប្តូរ ឬបញ្ហាផ្សេងទៀត។'

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website' })
useHead({
  link: [{ rel: 'canonical', href: useRequestURL().origin + '/contact' }],
})
</script>
