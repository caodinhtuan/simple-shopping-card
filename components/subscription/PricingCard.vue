<template>
  <div
      :class="popular
      ? 'scale-[1.03] border-purple-400 dark:border-purple-500/40 bg-gradient-to-br from-purple-50 to-cyan-50 dark:bg-[linear-gradient(165deg,rgba(139,92,246,0.08),rgba(6,182,212,0.04)_60%,transparent)] shadow-xl shadow-purple-500/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_60px_rgba(139,92,246,0.15)] hover:scale-[1.04] hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.4),0_0_80px_rgba(139,92,246,0.25)]'
      : 'border-slate-300 dark:border-white/[0.06] dark:bg-white/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/25 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.3),0_0_60px_rgba(139,92,246,0.1)]'"
      class="relative overflow-hidden rounded-[20px] border transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-white dark:bg-transparent dark:backdrop-blur-2xl"
  >
    <!-- Gradient border overlay for popular plan -->
    <div
        v-if="popular"
        class="pointer-events-none absolute inset-[-1px] rounded-[20px] z-[1] p-[1px] bg-[linear-gradient(135deg,rgba(139,92,246,0.5),rgba(6,182,212,0.5),rgba(236,72,153,0.5))]"
        style="
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        -webkit-mask-composite: xor;
      "
    />

    <!-- Popular Badge / Ribbon -->
    <div
        v-if="popular"
        class="absolute top-0 left-0 right-0 z-[2] py-1.5 px-4 text-center bg-[length:200%_100%] bg-[linear-gradient(90deg,#8b5cf6,#06b6d4,#ec4899)] animate-[shift-bg_4s_ease_infinite]"
    >
      <span
          class="text-[11px] font-extrabold tracking-[0.1em] uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
        {{ t('subs.popular') }}
      </span>
    </div>

    <div :class="popular ? 'pt-12' : ''" class="p-7">
      <!-- Plan name -->
      <div class="flex items-baseline justify-between mb-1">
        <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ plan.name }}</h3>
        <span v-if="plan.id" class="text-[10px] text-slate-500 font-mono">#{{ plan.id }}</span>
      </div>
      <p class="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed min-h-[2.75rem]">{{
          plan.description
        }}</p>

      <!-- Price -->
      <div class="mb-6">
        <div class="flex items-baseline gap-1">
          <span class="text-sm text-slate-500">$</span>
          <span :class="popular ? 'gradient-text' : 'text-slate-900 dark:text-slate-100'"
                class="text-5xl font-extrabold">
            {{ formatPriceWhole(plan.price) }}
          </span>
          <span class="text-base font-semibold text-slate-600 dark:text-slate-300">.{{
              formatPriceCents(plan.price)
            }}</span>
          <span class="text-slate-500 text-sm ml-1">/{{ plan.interval || 'month' }}</span>
        </div>
      </div>

      <!-- Features -->
      <ul class="space-y-2.5 mb-7 min-h-[200px]">
        <li
            v-for="(feature, index) in plan.features"
            :key="index"
            class="flex items-start gap-2.5 text-sm"
        >
          <div
              class="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor"
                 stroke-width="3" viewBox="0 0 24 24">
              <path d="m4.5 12.75 6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-slate-700 dark:text-slate-300 leading-snug">{{ feature }}</span>
        </li>
      </ul>

      <!-- Subscribe buttons -->
      <div class="space-y-2.5">
        <n-button
            :class="popular ? 'btn-stripe' : ''"
            :style="{ height: '44px', borderRadius: '12px', fontWeight: '600' }"
            :type="popular ? 'primary' : 'default'"
            block
            size="large"
            @click="$emit('subscribe', { planId: plan.id, gateway: 'stripe' })"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path
                  d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
          </template>
          {{ isReSubscribe ? t('subs.resubscribe_stripe') : t('subs.subscribe_stripe') }}
        </n-button>

        <n-button
            :style="{ height: '44px', borderRadius: '12px', fontWeight: '600' }"
            block
            class="btn-paypal"
            size="large"
            @click="$emit('subscribe', { planId: plan.id, gateway: 'paypal' })"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path
                  d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
          </template>
          {{ isReSubscribe ? t('subs.resubscribe_paypal') : t('subs.subscribe_paypal') }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {NButton} from 'naive-ui'

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

defineProps<{
  plan: Plan
  popular?: boolean
  isReSubscribe?: boolean
}>()

defineEmits<{
  subscribe: [payload: { planId: number; gateway: string }]
}>()

const {t} = useI18n()

function formatPriceWhole(cents: number): string {
  return String(Math.floor(cents / 100))
}

function formatPriceCents(cents: number): string {
  return String(cents % 100).padStart(2, '0')
}
</script>
