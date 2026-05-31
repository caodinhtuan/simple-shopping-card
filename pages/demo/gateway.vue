<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Ambient background glows -->
    <div class="hero-glow hero-glow-purple" />
    <div class="hero-glow hero-glow-cyan" />

    <!-- Floating notice ribbon -->
    <div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-amber-300 shadow-lg shadow-amber-500/10">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Sandbox Simulator — No Real Charge
    </div>

    <Transition name="fade-scale" mode="out-in">
      <!-- STRIPE GATEWAY -->
      <div
        v-if="!processing && gateway === 'stripe'"
        key="stripe-form"
        class="w-full max-w-md glass-card p-8 relative z-10 border-white/8"
      >
        <!-- Gateway logo + amount -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: 'linear-gradient(135deg,#635bff,#3a3493)' }">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Stripe Checkout</p>
              <p class="text-sm text-slate-300 font-medium">ShopPay Demo</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Amount</p>
            <p class="text-xl font-bold gradient-text-purple">${{ formattedAmount }}</p>
          </div>
        </div>

        <!-- Card-form mock -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Card Number</label>
            <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-slate-200 tracking-widest text-sm flex items-center justify-between">
              <span>4242 4242 4242 4242</span>
              <span class="flex gap-1">
                <span class="w-6 h-4 rounded bg-gradient-to-br from-yellow-400 to-orange-500" />
                <span class="w-6 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-500" />
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expiry</label>
              <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-slate-200 text-sm">12 / 28</div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CVC</label>
              <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-slate-200 text-sm">123</div>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cardholder</label>
            <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm">Demo Customer</div>
          </div>
        </div>

        <n-button
          block
          size="large"
          class="btn-stripe"
          :style="{ height: '52px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }"
          @click="processPayment"
        >
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </template>
          Pay ${{ formattedAmount }}
        </n-button>

        <button
          class="btn-reset mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          @click="cancelPayment"
        >
          Cancel and return
        </button>
      </div>

      <!-- PAYPAL GATEWAY -->
      <div
        v-else-if="!processing && gateway === 'paypal'"
        key="paypal-form"
        class="w-full max-w-md glass-card p-8 relative z-10 border-white/8"
      >
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: 'linear-gradient(135deg,#003087,#0070ba)' }">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
              </svg>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">PayPal</p>
              <p class="text-sm text-slate-300 font-medium">ShopPay Demo</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Amount</p>
            <p class="text-xl font-bold bg-[linear-gradient(135deg,#0070ba,#06b6d4)] bg-clip-text text-transparent">
              ${{ formattedAmount }}
            </p>
          </div>
        </div>

        <div class="mb-6 p-5 rounded-xl bg-white/5 border border-white/8 text-center">
          <p class="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Logged in as</p>
          <p class="text-sm font-bold text-slate-200">demo-buyer@shoppay.com</p>
          <p class="text-xs text-slate-500 mt-1">Verified PayPal Sandbox Account</p>
        </div>

        <div class="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">VISA</div>
            <div class="flex-1">
              <p class="text-sm text-slate-200 font-medium">Visa Card</p>
              <p class="text-xs text-slate-500">•••• •••• •••• 4242</p>
            </div>
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>

        <n-button
          block
          size="large"
          class="btn-paypal"
          :style="{ height: '52px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }"
          @click="processPayment"
        >
          Authorize &amp; {{ isSubscription ? 'Subscribe' : 'Pay' }} ${{ formattedAmount }}
        </n-button>

        <button
          class="btn-reset mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          @click="cancelPayment"
        >
          Cancel transaction
        </button>
      </div>

      <!-- Processing State -->
      <div
        v-else
        key="processing"
        class="w-full max-w-md glass-card p-12 text-center relative z-10 border-white/8"
      >
        <div class="relative w-24 h-24 mx-auto mb-6">
          <div class="absolute inset-0 rounded-full border-4 border-white/5" />
          <div class="absolute inset-0 rounded-full border-4 border-transparent animate-spin" :style="ringStyle" />
          <div class="absolute inset-0 flex items-center justify-center">
            <svg v-if="gateway === 'stripe'" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            <svg v-else class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
          </div>
        </div>

        <h2 class="text-xl font-bold text-slate-100 mb-2">{{ processingMessage }}</h2>
        <p class="text-sm text-slate-500">Securing transaction with {{ gateway === 'stripe' ? 'Stripe' : 'PayPal' }}…</p>

        <div class="mt-8 flex justify-center gap-2">
          <div
            v-for="n in 3"
            :key="n"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="step >= n
              ? 'bg-[linear-gradient(135deg,#8b5cf6,#06b6d4)] shadow-[0_0_12px_rgba(139,92,246,0.5)] scale-[1.3]'
              : 'bg-white/10'"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {useCartStore} from '~/stores/cart'

definePageMeta({ layout: false })

useHead({
  title: 'Gateway Simulator — ShopPay',
})

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const gateway = computed(() => String(route.query.gateway || 'stripe'))
const type = computed(() => String(route.query.type || 'payment'))
const orderId = computed(() => route.query.order_id ? String(route.query.order_id) : '')
const amount = computed(() => Number(route.query.amount || 0))
const planId = computed(() => route.query.plan_id ? String(route.query.plan_id) : '')
const interval = computed(() => String(route.query.interval || 'monthly'))

const isSubscription = computed(() => type.value === 'subscription')

const fallbackAmount = ref(0)
onMounted(async () => {
  if (isSubscription.value && !amount.value && planId.value) {
    try {
      const res = await $fetch<any>('/api/plans')
      const found = (res.plans || []).find((p: any) => String(p.id) === planId.value)
      if (found) {
        fallbackAmount.value = interval.value === 'yearly'
          ? (found.price_yearly ?? Math.round(found.price * 12 * 0.8))
          : (found.price_monthly ?? found.price)
      }
    } catch {
      fallbackAmount.value = 2999
    }
  }
})

const displayAmount = computed(() => amount.value || fallbackAmount.value || 2999)
const formattedAmount = computed(() => (displayAmount.value / 100).toFixed(2))

const processing = ref(false)
const step = ref(0)
const processingMessages = [
  'Authenticating…',
  'Authorizing payment…',
  'Confirming with bank…',
  'Finalizing transaction…',
]
const processingMessage = ref(processingMessages[0])

const ringStyle = computed(() => ({
  borderTopColor: gateway.value === 'stripe' ? '#8b5cf6' : '#0070ba',
  borderRightColor: gateway.value === 'stripe' ? '#a78bfa' : '#06b6d4',
}))

async function processPayment() {
  processing.value = true

  for (let i = 0; i < processingMessages.length; i++) {
    step.value = i + 1
    processingMessage.value = processingMessages[i]
    await new Promise((r) => setTimeout(r, 700))
  }

  if (orderId.value) {
    try {
      await $fetch('/api/orders/mark-paid', {
        method: 'POST',
        body: { orderId: Number(orderId.value), gateway: gateway.value },
      })
    } catch (e) {
      console.warn('[Demo] Mark-paid failed', e)
    }
  }

  if (type.value === 'payment') {
    cartStore.clearCart()
  }

  await new Promise((r) => setTimeout(r, 400))
  if (isSubscription.value) {
    await router.replace({
      path: '/subscription/success',
      query: {
        gateway: gateway.value,
        demo: '1',
        plan_id: planId.value,
        interval: interval.value,
      },
    })
  } else {
    await router.replace({
      path: '/checkout/success',
      query: { gateway: gateway.value, order_id: orderId.value, demo: '1' },
    })
  }
}

function cancelPayment() {
  if (isSubscription.value) {
    router.replace('/subscription/cancel')
  } else {
    router.replace({ path: '/checkout/cancel', query: { order_id: orderId.value } })
  }
}
</script>
