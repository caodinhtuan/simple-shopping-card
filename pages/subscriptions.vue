<template>
  <div class="container mx-auto px-4 py-12 max-w-7xl relative">
    <!-- Page Header -->
    <div class="mb-10 text-center animate-in">
      <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-5">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"/>
        {{ t('subs.eyebrow') }}
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
        {{ t('subs.title_part1') }} <span class="gradient-text-cyan">{{ t('subs.title_part2') }}</span>
      </h1>
      <p class="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
        {{ t('subs.subtitle') }}
      </p>
    </div>

    <!-- Active Subscription Banner -->
    <div v-if="activeSubscription" class="mb-10 animate-in stagger-1">
      <div class="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-emerald-400 mb-1">Active Subscription: {{ activeSubscription.plan_name }}</h3>
          <p class="text-slate-400 text-sm">
            You are currently subscribed to the {{ activeSubscription.plan_name }} plan ({{ activeSubscription.interval }}).
          </p>
        </div>
        <div class="mt-4 md:mt-0 md:text-right">
          <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Subscription ID</p>
          <p class="font-mono text-sm text-slate-300">{{ activeSubscription.subscription_id }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-32 animate-in">
      <n-spin size="large" stroke="#06b6d4"/>
      <span class="text-slate-400 mt-4 font-semibold text-sm">{{ t('subs.loading') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 animate-in">
      <div
          class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-2xl mb-4">
        ⚠️
      </div>
      <h3 class="text-lg font-semibold text-slate-200 mb-1">{{ t('subs.error_title') }}</h3>
      <p class="text-sm text-slate-500 mb-6 max-w-md text-center">{{ error.message || '' }}</p>
      <n-button secondary type="primary" @click="() => refresh()">
        {{ t('products.try_again') }}
      </n-button>
    </div>

    <!-- Pricing Grid -->
    <div v-else class="animate-in stagger-2">
      <PricingGrid :plans="plans" @subscribe="initiateSubscriptionFlow"/>
    </div>

    <!-- Email Modal -->
    <n-modal
        v-model:show="showEmailModal"
        :bordered="false"
        :close-on-esc="!isSubmitting"
        :mask-closable="!isSubmitting"
        :show-icon="false"
        :style="{
        maxWidth: '480px',
        width: '95%',
        background: isLight ? '#ffffff' : '#1a1a2e',
        borderColor: isLight ? '#e0e0e6' : 'rgba(255,255,255,0.08)',
        color: isLight ? '#1f2937' : '#f1f5f9'
      }"
        preset="card"
        title=""
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
              :style="{ background: selectedGateway === 'stripe' ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#0070ba,#003087)' }"
              class="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path v-if="selectedGateway === 'stripe'"
                    d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              <path v-else
                    d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-100">
              {{ t('subs.modal_title', {gateway: selectedGateway === 'stripe' ? 'Stripe' : 'PayPal'}) }}
            </p>
            <p class="text-xs text-slate-500">{{ t('subs.modal_plan', {name: selectedPlan?.name || ''}) }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Plan summary -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border border-white/5">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-slate-500 uppercase tracking-wider font-semibold">{{
                t('subs.selected_plan')
              }}</span>
            <span class="text-xs text-slate-400">{{
                selectedInterval === 'yearly' ? t('subs.billing_yearly') : t('subs.billing_monthly')
              }}</span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-bold text-slate-100">{{ selectedPlan?.name }}</span>
            <span class="text-2xl font-extrabold gradient-text">
              ${{ (displayPrice() / 100).toFixed(2) }}
              <span class="text-xs text-slate-500 font-medium">/ {{
                  selectedInterval === 'yearly' ? 'year' : 'month'
                }}</span>
            </span>
          </div>
          <p v-if="selectedInterval === 'yearly'" class="text-[10px] text-emerald-400 mt-2 font-semibold">
            {{ t('subs.yearly_save') }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{{
              t('subs.your_email')
            }}</label>
          <n-input
              v-model:value="customerEmail"
              :disabled="isSubmitting"
              placeholder="you@example.com"
              size="large"
              type="text"
              @keydown.enter="processSubscription"
          />
        </div>

        <div class="flex items-center gap-3 pt-2 justify-end">
          <n-button :disabled="isSubmitting" @click="showEmailModal = false">{{ t('common.cancel') }}</n-button>
          <n-button
              :class="selectedGateway === 'stripe' ? 'btn-stripe' : 'btn-paypal'"
              :disabled="!isValidEmail || isSubmitting"
              :loading="isSubmitting"
              type="primary"
              @click="processSubscription"
          >
            {{ t('subs.confirm_pay') }}
          </n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import {NButton, NInput, NModal, NSpin} from 'naive-ui'
import PricingGrid from "~/components/subscription/PricingGrid.vue";

const {t} = useI18n()

// Page configuration
useHead({
  title: computed(() => t('meta.subscriptions')),
  meta: [
    {name: 'description', content: computed(() => t('meta.sub_desc'))}
  ]
})

const message = useAppMessage()
const colorMode = useColorMode()

const isLight = computed(() => colorMode.value === 'light')
const showEmailModal = ref(false)
const customerEmail = ref('')
const selectedPlan = ref<any | null>(null)
const selectedGateway = ref('')
const selectedInterval = ref<'monthly' | 'yearly'>('monthly')
const isSubmitting = ref(false)
const activeSubscription = ref<any>(null)

onMounted(async () => {
  const email = localStorage.getItem('demo-email') || ''
  if (email) {
    try {
      const res = await $fetch<any>(`/api/subscriptions/latest?email=${encodeURIComponent(email)}`)
      if (res?.subscription) {
        activeSubscription.value = res.subscription
      }
    } catch (e) {
      console.warn('Failed to fetch latest subscription', e)
    }
  }
})

// Fetch plans from db backend
const {data: plansData, pending, error, refresh} = await useFetch<any>('/api/plans', {
  transform: (res) => res.plans || []
})

// Normalize plans features
const plans = computed(() => {
  if (!plansData.value) return []
  return plansData.value.map((plan: any) => {
    let featuresArray: string[] = []
    if (typeof plan.features === 'string') {
      try {
        featuresArray = JSON.parse(plan.features)
      } catch {
        featuresArray = []
      }
    } else if (Array.isArray(plan.features)) {
      featuresArray = plan.features
    }
    return {
      ...plan,
      features: featuresArray
    }
  })
})

const isValidEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(customerEmail.value)
})

// Trigger modal with selected plan + interval details
function initiateSubscriptionFlow(payload: { planId: number; gateway: string; interval?: string }) {
  const plan = plans.value.find((p: any) => p.id === payload.planId)
  if (!plan) return

  selectedPlan.value = plan
  selectedGateway.value = payload.gateway
  selectedInterval.value = payload.interval === 'yearly' ? 'yearly' : 'monthly'

  // Restore previously used email so users don't retype it
  if (!customerEmail.value && import.meta.client) {
    customerEmail.value = localStorage.getItem('demo-email') || ''
  }

  showEmailModal.value = true
}

// Resolve the correct Stripe price ID / PayPal plan ID per chosen interval
function resolveStripePriceId(): string {
  const p = selectedPlan.value
  if (!p) return ''
  return selectedInterval.value === 'yearly'
      ? (p.stripe_price_id_yearly || `price_${p.name.toLowerCase()}_yearly_demo`)
      : (p.stripe_price_id_monthly || p.stripe_price_id || `price_${p.name.toLowerCase()}_monthly_demo`)
}

function resolvePayPalPlanId(): string {
  const p = selectedPlan.value
  if (!p) return ''
  return selectedInterval.value === 'yearly'
      ? (p.paypal_plan_id_yearly || `P-${p.name.toUpperCase()}-YEARLY-DEMO`)
      : (p.paypal_plan_id_monthly || p.paypal_plan_id || `P-${p.name.toUpperCase()}-MONTHLY-DEMO`)
}

function displayPrice(): number {
  const p = selectedPlan.value
  if (!p) return 0
  return selectedInterval.value === 'yearly'
      ? (p.price_yearly ?? Math.round(p.price * 12 * 0.8))
      : (p.price_monthly ?? p.price)
}

// Persist email on successful submit
watch(customerEmail, (val) => {
  if (import.meta.client && isValidEmail.value) {
    localStorage.setItem('demo-email', val.trim())
  }
})

// Process Stripe / PayPal billing integrations
async function processSubscription() {
  if (!isValidEmail.value || !selectedPlan.value) return

  isSubmitting.value = true
  try {
    if (selectedGateway.value === 'stripe') {
      const response = await $fetch<any>('/api/stripe/create-subscription', {
        method: 'POST',
        body: {
          priceId: resolveStripePriceId(),
          customerEmail: customerEmail.value.trim(),
          planId: selectedPlan.value.id,
          interval: selectedInterval.value,
        },
      })
      if (response?.demoMode) {
        message.info(t('subs.demo_toast'), {duration: 1800})
      }
      if (response?.url) {
        window.location.href = response.url
      } else {
        throw new Error('Stripe returned empty redirect URL.')
      }
    } else if (selectedGateway.value === 'paypal') {
      const response = await $fetch<any>('/api/paypal/create-subscription', {
        method: 'POST',
        body: {
          planId: resolvePayPalPlanId(),
          customerEmail: customerEmail.value.trim(),
          dbPlanId: selectedPlan.value.id,
          interval: selectedInterval.value,
        },
      })
      if (response?.demoMode) {
        message.info(t('subs.demo_toast'), {duration: 1800})
      }
      if (response?.approveUrl) {
        window.location.href = response.approveUrl
      } else {
        throw new Error('PayPal returned empty approval URL.')
      }
    }
  } catch (err: any) {
    message.error(err.message || 'Failed to initialize subscription checkout.')
    isSubmitting.value = false
  }
}
</script>
