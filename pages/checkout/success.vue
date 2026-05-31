<template>
  <div class="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
    <div class="hero-glow hero-glow-cyan" />

    <!-- Confetti -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div v-for="n in 50" :key="n" :style="getConfetti(n)" />
    </div>

    <div class="w-full max-w-xl glass-card p-8 md:p-12 text-center border-white/8 relative z-10 animate-in">
      <!-- Animated checkmark ring -->
      <div
        class="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative bg-[radial-gradient(circle,rgba(16,185,129,0.2),rgba(16,185,129,0.05))] ring-pulse-emerald before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:border-2 before:border-emerald-500/20 before:ring-expand-emerald"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-12 h-12 text-emerald-400 check-draw">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
        Payment <span class="gradient-text-emerald">Successful!</span>
      </h1>
      <p class="text-slate-400 text-sm mb-2">
        Thank you for your purchase. Your transaction was processed successfully.
      </p>
      <p v-if="isDemoMode" class="text-amber-400/80 text-xs mb-8">
        💡 Demo mode — no real charge was made
      </p>
      <p v-else class="mb-8" />

      <!-- Details Card -->
      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 text-left space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Payment Gateway</span>
          <span class="text-slate-200 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :style="{ background: gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }" />
            {{ gatewayName }}
          </span>
        </div>

        <div v-if="orderNumber" class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Order Number</span>
          <span class="text-slate-200 font-mono font-bold">{{ orderNumber }}</span>
        </div>

        <div v-if="customerEmail" class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Receipt Sent To</span>
          <span class="text-slate-200 font-medium truncate ml-3">{{ customerEmail }}</span>
        </div>

        <div v-if="totalAmount" class="flex items-center justify-between text-sm pt-3 border-t border-white/5">
          <span class="text-slate-500 font-medium">Total Paid</span>
          <span class="text-emerald-400 font-bold text-base">${{ (totalAmount / 100).toFixed(2) }}</span>
        </div>

        <div v-if="orderItems.length" class="pt-3 border-t border-white/5 space-y-2">
          <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Items</p>
          <div v-for="(item, i) in orderItems" :key="i" class="flex items-center justify-between text-xs">
            <span class="text-slate-300 truncate flex-1">{{ item.product_name }}</span>
            <span class="text-slate-500 ml-3">×{{ item.quantity }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <NuxtLink to="/products" class="w-full sm:w-auto">
          <n-button type="primary" size="large" class="btn-stripe w-full" :style="{ borderRadius: '12px' }">
            Continue Shopping
          </n-button>
        </NuxtLink>
        <NuxtLink to="/" class="w-full sm:w-auto">
          <n-button size="large" class="w-full" :style="{ borderRadius: '12px' }">
            Go Home
          </n-button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

useHead({ title: 'Order Completed — ShopPay' })

const route = useRoute()
const cartStore = useCartStore()

const gateway = computed(() => String(route.query.gateway || 'stripe'))
const isDemoMode = computed(() => route.query.demo === '1')
const gatewayName = computed(() =>
  gateway.value === 'paypal' ? 'PayPal' : 'Stripe',
)
const orderId = computed(() => route.query.order_id ? String(route.query.order_id) : '')
const sessionId = computed(() => route.query.session_id ? String(route.query.session_id) : '')

const orderNumber = ref('')
const customerEmail = ref('')
const totalAmount = ref(0)
const orderItems = ref<any[]>([])

onMounted(async () => {
  cartStore.clearCart()

  if (orderId.value) {
    try {
      const ordersData = await $fetch<any>('/api/orders')
      const matched = ordersData.orders?.find(
        (o: any) => String(o.id) === orderId.value || o.order_number === orderId.value,
      )
      if (matched) {
        orderNumber.value = matched.order_number
        customerEmail.value = matched.customer_email
        totalAmount.value = matched.total_amount
        orderItems.value = matched.items || []
      }
    } catch (e) {
      console.warn('Failed to resolve order details', e)
    }
  } else if (sessionId.value) {
    orderNumber.value = `STR-${sessionId.value.slice(8, 14).toUpperCase()}`
  }
})

function getConfetti(index: number) {
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']
  const c = colors[Math.floor(Math.random() * colors.length)]
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 4 + Math.random() * 4
  const scale = 0.5 + Math.random() * 0.8
  return {
    position: 'absolute',
    backgroundColor: c,
    left: `${left}%`,
    top: '-20px',
    width: '8px',
    height: '8px',
    borderRadius: index % 2 === 0 ? '50%' : '0%',
    opacity: 0.7,
    transform: `scale(${scale})`,
    animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
  }
}
</script>
