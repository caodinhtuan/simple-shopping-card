<template>
  <div class="cart-summary glass-card p-6 lg:sticky lg:top-24">
    <h3 class="text-lg font-bold text-slate-100 mb-1">{{ t('summary.title') }}</h3>
    <p class="text-xs text-slate-500 mb-6">
      {{ itemCount }}
      {{
        itemCount > 1 ? t('cart.items_count', {n: itemCount}).split(' ').slice(1).join(' ') : t('cart.item_count_single').split(' ').slice(1).join(' ')
      }}
    </p>

    <div class="space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400">{{ t('summary.subtotal') }}</span>
        <span class="text-slate-200 font-semibold tabular-nums">${{ formatPrice(subtotal) }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400">{{ t('summary.tax') }}</span>
        <span class="text-slate-200 font-semibold tabular-nums">${{ formatPrice(tax) }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400">{{ t('summary.shipping') }}</span>
        <span class="text-emerald-400 font-semibold text-xs uppercase tracking-wider">{{ t('summary.free') }}</span>
      </div>

      <div class="my-3 border-t border-white/5"/>

      <div class="flex items-baseline justify-between">
        <span class="text-slate-100 font-bold text-base">{{ t('summary.total') }}</span>
        <span class="text-3xl font-extrabold gradient-text tabular-nums">${{ formatPrice(grandTotal) }}</span>
      </div>
    </div>

    <!-- Checkout buttons -->
    <div class="mt-6 space-y-2.5">
      <n-button
          :style="{ height: '50px', borderRadius: '12px', fontSize: '14px' }"
          block
          class="btn-stripe"
          size="large"
          @click="$emit('checkout', 'stripe')"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path
                d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
        </template>
        {{ t('summary.pay_stripe') }}
      </n-button>

      <n-button
          :style="{ height: '50px', borderRadius: '12px', fontSize: '14px' }"
          block
          class="btn-paypal"
          size="large"
          @click="$emit('checkout', 'paypal')"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path
                d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
        </template>
        {{ t('summary.pay_paypal') }}
      </n-button>

      <div class="text-center text-xs text-slate-600 pt-2">{{ t('summary.or') }}</div>

      <NuxtLink to="/checkout">
        <n-button
            :style="{ height: '40px', borderRadius: '10px', fontSize: '12px' }"
            block
            quaternary
            size="medium"
        >
          {{ t('summary.go_checkout') }}
        </n-button>
      </NuxtLink>
    </div>

    <!-- Trust badges -->
    <div class="mt-6 pt-5 border-t border-white/5 flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2"
             viewBox="0 0 24 24">
          <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
        {{ t('summary.secure') }}
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2"
             viewBox="0 0 24 24">
          <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
        {{ t('summary.verified') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {CartItem} from '~/stores/cart'

const props = defineProps<{
  items: CartItem[]
  total: number
}>()

defineEmits<{
  checkout: [gateway: 'stripe' | 'paypal']
}>()

const {t} = useI18n()

const itemCount = computed(() => props.items.reduce((sum, item) => sum + item.quantity, 0))
const subtotal = computed(() => props.total)
const tax = computed(() => Math.round(props.total * 0.1))
const grandTotal = computed(() => subtotal.value + tax.value)

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}
</script>
