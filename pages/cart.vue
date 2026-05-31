<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="mb-8 animate-in stagger-1">
      <h1 class="section-title text-3xl sm:text-4xl mb-2">
        <span class="gradient-text">Shopping Cart</span>
      </h1>
      <p class="text-slate-400">
        <template v-if="cartStore.totalItems > 0">
          {{ cartStore.totalItems }} item{{ cartStore.totalItems > 1 ? 's' : '' }} in your cart
        </template>
        <template v-else>Your cart is empty</template>
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.cartItems.length === 0" class="flex items-center justify-center py-20 animate-in stagger-2">
      <div class="text-center">
        <div class="text-6xl mb-6 animate-float">🛒</div>
        <n-empty description="Your cart is empty" size="large">
          <template #extra>
            <NuxtLink to="/products">
              <n-button type="primary" class="btn-stripe mt-4" :style="{ borderRadius: '10px' }">
                Continue Shopping
              </n-button>
            </NuxtLink>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- Cart Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in stagger-2">
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-4">
        <TransitionGroup name="list" tag="div" class="space-y-4">
          <CartItem
            v-for="item in cartStore.cartItems"
            :key="item.id"
            :item="item"
            @update:quantity="(qty) => cartStore.updateQuantity(item.id, qty)"
            @remove="cartStore.removeItem(item.id)"
          />
        </TransitionGroup>

        <!-- Clear cart button -->
        <div class="flex justify-end mt-4">
          <n-button quaternary type="error" size="small" @click="handleClearCart">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </template>
            Clear Cart
          </n-button>
        </div>
      </div>

      <!-- Cart Summary -->
      <div>
        <CartSummary
          :items="cartStore.cartItems"
          :total="cartStore.totalPrice"
          @checkout="openCheckoutModal"
        />
      </div>
    </div>

    <!-- Email Capture Modal -->
    <n-modal
      v-model:show="showEmailModal"
      :mask-closable="!isSubmitting"
      :close-on-esc="!isSubmitting"
      preset="card"
      :bordered="false"
      :style="{ maxWidth: '460px', width: '95%', background: '#1a1a2e', borderColor: 'rgba(255,255,255,0.08)' }"
      title=""
      :show-icon="false"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :style="{ background: pendingGateway === 'stripe' ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#0070ba,#003087)' }"
          >
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path v-if="pendingGateway === 'stripe'" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              <path v-else d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-100">
              Continue with {{ pendingGateway === 'stripe' ? 'Stripe' : 'PayPal' }}
            </p>
            <p class="text-xs text-slate-500">We'll send a receipt to this address</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <n-input
            v-model:value="customerEmail"
            type="text"
            placeholder="you@example.com"
            size="large"
            :disabled="isSubmitting"
            @keydown.enter="proceed"
          />
        </div>

        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
          <span class="text-slate-500">Order Total</span>
          <span class="text-slate-100 font-bold text-base">${{ ((cartStore.totalPrice * 1.1) / 100).toFixed(2) }}</span>
        </div>

        <div class="flex items-center gap-3 pt-2 justify-end">
          <n-button :disabled="isSubmitting" @click="showEmailModal = false">Cancel</n-button>
          <n-button
            type="primary"
            :class="pendingGateway === 'stripe' ? 'btn-stripe' : 'btn-paypal'"
            :disabled="!isValidEmail || isSubmitting"
            :loading="isSubmitting"
            @click="proceed"
          >
            Continue to {{ pendingGateway === 'stripe' ? 'Stripe' : 'PayPal' }}
          </n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

useHead({ title: 'Cart — ShopPay' })

const cartStore = useCartStore()
const message = useAppMessage()
const dialog = useAppDialog()

const showEmailModal = ref(false)
const pendingGateway = ref<'stripe' | 'paypal'>('stripe')
const customerEmail = ref('')
const isSubmitting = ref(false)

const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value.trim()),
)

function handleClearCart() {
  dialog.warning({
    title: 'Clear Cart',
    content: 'Are you sure you want to remove all items from your cart?',
    positiveText: 'Clear All',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      cartStore.clearCart()
      message.success('Cart cleared')
    },
  })
}

function openCheckoutModal(gateway: 'stripe' | 'paypal') {
  if (cartStore.cartItems.length === 0) {
    message.warning('Your cart is empty')
    return
  }
  pendingGateway.value = gateway
  if (!customerEmail.value && import.meta.client) {
    customerEmail.value = localStorage.getItem('demo-email') || ''
  }
  showEmailModal.value = true
}

async function proceed() {
  if (!isValidEmail.value || isSubmitting.value) return
  isSubmitting.value = true

  if (import.meta.client) {
    localStorage.setItem('demo-email', customerEmail.value.trim())
  }

  try {
    const endpoint =
      pendingGateway.value === 'stripe'
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
    if (!redirect) throw new Error('No redirect URL returned by gateway.')

    if (res?.demoMode) {
      message.info('Demo mode — simulating gateway flow', { duration: 1800 })
    }
    window.location.href = redirect
  } catch (err: any) {
    isSubmitting.value = false
    message.error(err?.data?.statusMessage || err?.message || 'Checkout failed. Please try again.')
  }
}
</script>
