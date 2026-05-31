<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="text-center mb-8 animate-in stagger-1">
      <h1 class="section-title text-3xl sm:text-4xl mb-2">
        <span class="gradient-text">Checkout</span>
      </h1>
      <p class="text-slate-400">Review your order and select a payment method</p>
    </div>

    <!-- Empty cart -->
    <div v-if="cartStore.cartItems.length === 0" class="flex items-center justify-center py-20 animate-in stagger-2">
      <div class="text-center">
        <div class="text-6xl mb-6">🤔</div>
        <n-result status="info" title="Nothing to checkout" description="Your cart is empty. Add some products first!">
          <template #footer>
            <NuxtLink to="/products">
              <n-button type="primary" class="btn-stripe" :style="{ borderRadius: '10px' }">
                Browse Products
              </n-button>
            </NuxtLink>
          </template>
        </n-result>
      </div>
    </div>

    <!-- Checkout Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <!-- Order Review -->
      <div class="animate-in stagger-2">
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-100">Order Review</h3>
            <span class="text-xs text-slate-500">{{ cartStore.totalItems }} item{{ cartStore.totalItems > 1 ? 's' : '' }}</span>
          </div>

          <TransitionGroup name="review" tag="div" class="space-y-3 mb-6">
            <div
              v-for="item in cartStore.cartItems"
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-colors"
            >
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                :style="{ background: getGradient(item.image) }"
              >
                {{ getEmoji(item.image) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-slate-200 text-sm font-medium truncate">{{ item.name }}</p>
                <p class="text-slate-500 text-xs">${{ formatPrice(item.price) }} × {{ item.quantity }}</p>
              </div>
              <p class="text-slate-200 font-semibold text-sm">${{ formatPrice(item.price * item.quantity) }}</p>
            </div>
          </TransitionGroup>

          <!-- Totals -->
          <div class="border-t border-white/5 pt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Subtotal</span>
              <span class="text-slate-300">${{ formatPrice(cartStore.totalPrice) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Tax (10%)</span>
              <span class="text-slate-300">${{ formatPrice(Math.round(cartStore.totalPrice * 0.1)) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-3 mt-1 border-t border-white/5">
              <span class="text-slate-100">Total</span>
              <span class="gradient-text">${{ formatPrice(Math.round(cartStore.totalPrice * 1.1)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment -->
      <div class="animate-in stagger-3">
        <div class="glass-card p-6">
          <h3 class="text-lg font-bold text-slate-100 mb-5">Customer Info</h3>
          <div class="mb-6">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <n-input
              v-model:value="customerEmail"
              type="text"
              size="large"
              placeholder="you@example.com"
              :disabled="isProcessing"
            />
            <p v-if="customerEmail && !isValidEmail" class="text-xs text-red-400 mt-1">Please enter a valid email address.</p>
          </div>

          <h3 class="text-lg font-bold text-slate-100 mb-4">Payment Method</h3>

          <div class="space-y-3">
            <div
              role="button"
              tabindex="0"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-[1.5px] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer select-none"
              :class="[
                selectedGateway === 'stripe'
                  ? 'bg-purple-500/[0.08] border-purple-500/50 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-purple-500/30',
                isProcessing && 'opacity-60 cursor-not-allowed pointer-events-none'
              ]"
              @click="!isProcessing && (selectedGateway = 'stripe')"
              @keydown.enter="!isProcessing && (selectedGateway = 'stripe')"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="text-sm font-semibold text-slate-200">Stripe</p>
                <p class="text-xs text-slate-500">Credit / debit card</p>
              </div>
              <div
                class="w-[18px] h-[18px] rounded-full border-2 shrink-0 relative transition-all duration-[250ms]"
                :class="selectedGateway === 'stripe' ? 'border-purple-400 bg-purple-500 after:content-[\'\'] after:absolute after:inset-[3px] after:rounded-full after:bg-white' : 'border-white/20'"
              />
            </div>

            <div
              role="button"
              tabindex="0"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-[1.5px] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer select-none"
              :class="[
                selectedGateway === 'paypal'
                  ? 'bg-purple-500/[0.08] border-purple-500/50 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-purple-500/30',
                isProcessing && 'opacity-60 cursor-not-allowed pointer-events-none'
              ]"
              @click="!isProcessing && (selectedGateway = 'paypal')"
              @keydown.enter="!isProcessing && (selectedGateway = 'paypal')"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: 'linear-gradient(135deg,#0070ba,#003087)' }">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="text-sm font-semibold text-slate-200">PayPal</p>
                <p class="text-xs text-slate-500">PayPal balance, bank or card</p>
              </div>
              <div
                class="w-[18px] h-[18px] rounded-full border-2 shrink-0 relative transition-all duration-[250ms]"
                :class="selectedGateway === 'paypal' ? 'border-purple-400 bg-purple-500 after:content-[\'\'] after:absolute after:inset-[3px] after:rounded-full after:bg-white' : 'border-white/20'"
              />
            </div>
          </div>

          <n-button
            block
            size="large"
            :class="selectedGateway === 'stripe' ? 'btn-stripe' : 'btn-paypal'"
            :disabled="!isValidEmail"
            :loading="isProcessing"
            :style="{ height: '52px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', marginTop: '24px' }"
            @click="proceed"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </template>
            Pay ${{ formatPrice(Math.round(cartStore.totalPrice * 1.1)) }} with {{ selectedGateway === 'stripe' ? 'Stripe' : 'PayPal' }}
          </n-button>

          <p class="text-center text-xs text-slate-600 mt-4">
            🔒 Your payment is processed securely. Test mode only — no real charges.
          </p>

          <NuxtLink
            to="/cart"
            class="block text-center text-slate-500 hover:text-slate-300 text-sm transition-colors mt-3"
          >
            ← Back to Cart
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NResult } from 'naive-ui'
import {useCartStore} from '~/stores/cart'

useHead({ title: 'Checkout — ShopPay' })

const cartStore = useCartStore()
const message = useAppMessage()

const customerEmail = ref('')
const selectedGateway = ref<'stripe' | 'paypal'>('stripe')
const isProcessing = ref(false)

const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value.trim()),
)

onMounted(() => {
  if (import.meta.client) {
    customerEmail.value = localStorage.getItem('demo-email') || ''
  }
})

const emojiMap: Record<string, string> = {
  Audio: '🎧', Phones: '📱', Keyboards: '⌨️', Mice: '🖱️',
  Monitors: '🖥️', Cameras: '📷', Speakers: '🔊', Wearables: '⌚',
  Peripherals: '⌨️', Displays: '🖥️', Computers: '💻', Accessories: '🎒',
  Gaming: '🎮',
}
const gradientMap: Record<string, string> = {
  Audio: 'linear-gradient(135deg,#7c3aed,#2563eb)',
  Phones: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
  Keyboards: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  Peripherals: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  Mice: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  Monitors: 'linear-gradient(135deg,#10b981,#06b6d4)',
  Displays: 'linear-gradient(135deg,#10b981,#06b6d4)',
  Cameras: 'linear-gradient(135deg,#f43f5e,#f59e0b)',
  Speakers: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
  Wearables: 'linear-gradient(135deg,#06b6d4,#10b981)',
  Computers: 'linear-gradient(135deg,#6366f1,#a855f7)',
  Accessories: 'linear-gradient(135deg,#6366f1,#a855f7)',
  Gaming: 'linear-gradient(135deg,#ef4444,#f59e0b)',
}

function getEmoji(c: string) { return emojiMap[c] || '📦' }
function getGradient(c: string) { return gradientMap[c] || 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }
function formatPrice(cents: number) { return (cents / 100).toFixed(2) }

async function proceed() {
  if (!isValidEmail.value || isProcessing.value) return
  isProcessing.value = true

  if (import.meta.client) {
    localStorage.setItem('demo-email', customerEmail.value.trim())
  }

  try {
    const endpoint =
      selectedGateway.value === 'stripe'
        ? '/api/stripe/create-checkout'
        : '/api/paypal/create-order'

    const res = await $fetch<any>(endpoint, {
      method: 'POST',
      body: {
        items: cartStore.cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        customerEmail: customerEmail.value.trim(),
      },
    })

    const redirect = res?.url || res?.approvalUrl
    if (!redirect) throw new Error('Gateway did not return a redirect URL.')

    if (res?.demoMode) {
      message.info('Demo mode — simulating gateway flow', { duration: 1800 })
    } else {
      message.loading(`Redirecting to ${selectedGateway.value === 'stripe' ? 'Stripe' : 'PayPal'}…`, { duration: 0 })
    }
    await new Promise((r) => setTimeout(r, 300))
    window.location.href = redirect
  } catch (err: any) {
    isProcessing.value = false
    message.error(err?.data?.statusMessage || err?.message || 'Payment failed. Please try again.')
  }
}
</script>
