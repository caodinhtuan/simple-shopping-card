<template>
  <div class="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
    <div :style="{ background: '#f59e0b', top: '-200px', left: '-100px' }" class="hero-glow"/>

    <div class="w-full max-w-xl glass-card p-8 md:p-12 text-center border-white/8 animate-in">
      <div
          class="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-[radial-gradient(circle,rgba(245,158,11,0.2),rgba(245,158,11,0.05))] ring-pulse-amber">
        <svg class="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
      </div>

      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
        {{ t('cancel.payment_title') }} <span class="gradient-text-orange">{{ t('cancel.payment_status') }}</span>
      </h1>
      <p class="text-slate-400 text-sm mb-8 leading-relaxed">
        {{ t('cancel.payment_desc') }}
      </p>

      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 text-left">
        <div v-if="orderNumber" class="mb-4 pb-4 border-b border-white/5">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-slate-500 font-medium">{{ t('success.order_number') }}</span>
            <span class="text-slate-200 font-mono font-bold">{{ orderNumber }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500 font-medium">{{ t('summary.total') }}</span>
            <span class="text-amber-400 font-bold text-base">${{ (totalAmount / 100).toFixed(2) }}</span>
          </div>
        </div>

        <p class="mb-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">{{ t('cancel.reasons_title') }}</p>
        <ul class="space-y-2 text-xs text-slate-500">
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>{{ t('cancel.reason1') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>{{ t('cancel.reason2') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>{{ t('cancel.reason3') }}</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <NuxtLink class="w-full sm:w-auto" to="/checkout">
          <n-button :style="{ borderRadius: '12px' }" class="btn-stripe w-full" size="large" type="primary">
            {{ t('cancel.try_again') }}
          </n-button>
        </NuxtLink>
        <NuxtLink class="w-full sm:w-auto" to="/products">
          <n-button :style="{ borderRadius: '12px' }" class="w-full" size="large">
            {{ t('checkout.browse') }}
          </n-button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
useHead({title: computed(() => t('meta.checkout_cancel'))})

const route = useRoute()
const orderId = computed(() => route.query.order_id ? String(route.query.order_id) : '')

const orderNumber = ref('')
const totalAmount = ref(0)

onMounted(async () => {
  if (orderId.value) {
    try {
      const { order } = await $fetch<any>(`/api/orders/${orderId.value}`)
      if (order) {
        orderNumber.value = order.order_number
        totalAmount.value = order.total_amount
      }
    } catch (e) {
      console.warn('Failed to resolve order details', e)
    }
  }
})
</script>
