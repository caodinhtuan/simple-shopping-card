<template>
  <div>
    <!-- Billing toggle pill -->
    <div class="flex items-center justify-center mb-12">
      <div class="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] backdrop-blur-md box-border">
        <button
          type="button"
          class="btn-reset flex-1 min-w-[140px] relative z-[1] px-[22px] py-[10px] rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 leading-none whitespace-nowrap transition-[color,background,box-shadow] duration-300 ease-out"
          :class="!isYearly
            ? 'text-slate-100 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(6,182,212,0.18))] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35),0_4px_12px_rgba(139,92,246,0.15)]'
            : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.02] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.03]'"
          @click="isYearly = false"
        >
          {{ t('subs.monthly') }}
        </button>
        <button
          type="button"
          class="btn-reset flex-1 min-w-[140px] relative z-[1] px-[22px] py-[10px] rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 leading-none whitespace-nowrap transition-[color,background,box-shadow] duration-300 ease-out"
          :class="isYearly
            ? 'text-slate-100 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(6,182,212,0.18))] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35),0_4px_12px_rgba(139,92,246,0.15)]'
            : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.02] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.03]'"
          @click="isYearly = true"
        >
          {{ t('subs.yearly') }}
          <span class="px-1.5 py-px rounded-full text-[9px] font-extrabold tracking-wider text-white bg-gradient-to-br from-emerald-500 to-emerald-600">
            {{ t('subs.save') }}
          </span>
        </button>
      </div>
    </div>

    <!-- Pricing grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
      <div
        v-for="(plan, index) in displayPlans"
        :key="`${plan.id}-${isYearly ? 'y' : 'm'}`"
        class="animate-in"
        :class="`stagger-${index + 1}`"
      >
        <PricingCard
          :plan="plan"
          :popular="index === 1"
          @subscribe="(payload) => $emit('subscribe', { ...payload, interval: isYearly ? 'yearly' : 'monthly' })"
        />
      </div>
    </div>

    <!-- Reassurance footer -->
    <div class="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        {{ t('subs.cancel_anytime') }}
      </div>
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {{ t('subs.secure_billing') }}
      </div>
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        {{ t('subs.scale') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PricingCard from '~/components/subscription/PricingCard.vue'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  interval?: string
  features: string[]
  stripe_price_id?: string
  paypal_plan_id?: string
}

const props = defineProps<{ plans: Plan[] }>()

defineEmits<{
  subscribe: [payload: { planId: number; gateway: string; interval?: string }]
}>()

const { t } = useI18n()
const isYearly = ref(false)

interface EnrichedPlan extends Plan {
  price_monthly?: number
  price_yearly?: number
  stripe_price_id_monthly?: string
  stripe_price_id_yearly?: string
  paypal_plan_id_monthly?: string
  paypal_plan_id_yearly?: string
}

const displayPlans = computed<Plan[]>(() => {
  return props.plans.map((p) => {
    const ep = p as EnrichedPlan
    if (!isYearly.value) {
      return { ...p, price: ep.price_monthly ?? p.price, interval: 'month' }
    }
    return {
      ...p,
      price: ep.price_yearly ?? Math.round(p.price * 12 * 0.8),
      interval: 'year',
    }
  })
})
</script>
