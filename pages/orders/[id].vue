<template>
  <div class="page-container max-w-3xl mx-auto">
    <!-- Back -->
    <div class="mb-6 animate-in stagger-1">
      <NuxtLink to="/orders"
        class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors group">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor"
          stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        My Orders
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-24 gap-4">
      <n-spin size="large" stroke="#8b5cf6"/>
      <p class="text-slate-500 text-sm">Loading your order...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="glass-card p-16 text-center border-white/8">
      <div class="text-5xl mb-4">⚠️</div>
      <p class="text-red-400 font-semibold mb-2">Order not found</p>
      <NuxtLink to="/orders" class="text-slate-500 hover:text-slate-300 text-sm">← Back to My Orders</NuxtLink>
    </div>

    <template v-else-if="data">
      <!-- Invoice card -->
      <div class="glass-card border-white/8 overflow-hidden animate-in stagger-2">

        <!-- Top banner -->
        <div class="px-8 py-6 border-b border-white/5"
             :class="data.order.status === 'paid' ? 'bg-emerald-500/[0.04]' : 'bg-amber-500/[0.04]'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                   :class="data.order.status === 'paid' ? 'bg-emerald-500/20' : 'bg-amber-500/20'">
                <svg v-if="data.order.status === 'paid'" class="w-7 h-7 text-emerald-400" fill="none"
                     stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="m4.5 12.75 6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else class="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" stroke-width="2.5"
                     viewBox="0 0 24 24">
                  <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-0.5">
                  {{ data.order.status === 'paid' ? 'Payment Successful' : 'Order ' + data.order.status }}
                </p>
                <p class="font-mono font-extrabold text-slate-100 text-xl">{{ data.order.order_number }}</p>
                <p v-if="data.order.status === 'pending' && data.order.expires_at" class="text-amber-400/90 text-xs mt-1 flex items-center gap-1">
                  <span>⏰</span> {{ t('orders.expires_on', { time: formatDate(data.order.expires_at) }) }}
                </p>
              </div>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-3xl font-extrabold"
                 :class="data.order.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'">
                ${{ (data.order.total_amount / 100).toFixed(2) }}
              </p>
              <p class="text-slate-500 text-xs mt-0.5">{{ formatDate(data.order.created_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Payment method row -->
        <div class="px-8 py-4 border-b border-white/5 flex items-center gap-3 flex-wrap">
          <span class="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
                :class="data.order.payment_gateway === 'paypal'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'">
            <span class="w-1.5 h-1.5 rounded-full"
                  :style="{ background: data.order.payment_gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }"/>
            {{ data.gatewayInvoice?.provider }}
          </span>

          <!-- Card info (Stripe) -->
          <span v-if="data.gatewayInvoice?.card_brand"
                class="text-xs text-slate-400 flex items-center gap-1.5">
            <span class="font-semibold capitalize text-slate-300">{{ data.gatewayInvoice.card_brand }}</span>
            ···· {{ data.gatewayInvoice.card_last4 }}
          </span>

          <!-- Payer (PayPal) -->
          <span v-if="data.gatewayInvoice?.payer_name" class="text-xs text-slate-400">
            {{ data.gatewayInvoice.payer_name }}
          </span>

          <!-- Stripe receipt link -->
          <a v-if="data.gatewayInvoice?.receipt_url"
             :href="data.gatewayInvoice.receipt_url"
             target="_blank"
             class="ml-auto flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            View Receipt
          </a>
        </div>

        <!-- Real DB Invoice Info if Paid -->
        <div v-if="data.invoice" class="px-8 py-5 border-b border-white/5 bg-emerald-500/[0.01]">
          <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">{{ t('orders.linked_invoice') }}</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p class="text-slate-500 font-medium">{{ t('orders.invoice_number') }}</p>
              <p class="text-slate-200 font-mono font-bold mt-0.5">{{ data.invoice.invoice_number }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">{{ t('orders.billing_email') }}</p>
              <p class="text-slate-200 font-bold mt-0.5 truncate">{{ data.invoice.customer_email }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">{{ t('orders.payment_gateway') }}</p>
              <p class="text-slate-200 font-bold capitalize mt-0.5">{{ data.invoice.payment_gateway }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">{{ t('orders.transaction_id') }}</p>
              <p class="text-slate-200 font-mono font-bold truncate mt-0.5" :title="data.invoice.payment_id">
                {{ data.invoice.payment_id || 'N/A' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="px-8 py-5">
          <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Items</p>
          <div class="space-y-3">
            <div v-for="item in data.order.items" :key="item.product_name"
                 class="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                {{ categoryEmoji(item.category) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-slate-200 text-sm font-medium truncate">{{ item.product_name }}</p>
                <p class="text-slate-500 text-xs">{{ item.category }} · Qty {{ item.quantity }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-slate-200 font-semibold text-sm">${{ (item.unit_price * item.quantity / 100).toFixed(2) }}</p>
                <p class="text-slate-600 text-xs">${{ (item.unit_price / 100).toFixed(2) }} each</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="px-8 py-5 border-t border-white/5 space-y-2 bg-white/[0.01]">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Subtotal</span>
            <span class="text-slate-300">${{ (subtotal / 100).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Tax (10%)</span>
            <span class="text-slate-300">${{ (tax / 100).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-3 border-t border-white/5">
            <span class="text-slate-100">Total</span>
            <span class="gradient-text">${{ (data.order.total_amount / 100).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="flex flex-col sm:flex-row gap-3 mt-6 animate-in stagger-3">
        <!-- Pay Now / Retry payment if unpaid -->
        <div v-if="data.order.status === 'pending'" class="flex-1">
          <n-button 
            :loading="retrying"
            :style="{ borderRadius: '12px', height: '48px' }" 
            class="btn-stripe w-full" 
            type="primary"
            @click="handleRetryPayment"
          >
            {{ t('orders.pay_now') }}
          </n-button>
        </div>

        <NuxtLink v-else to="/products" class="flex-1">
          <n-button :style="{ borderRadius: '12px', height: '48px' }" class="btn-stripe w-full" type="primary">
            Continue Shopping
          </n-button>
        </NuxtLink>
        
        <NuxtLink to="/orders" class="flex-1">
          <n-button :style="{ borderRadius: '12px', height: '48px' }" class="w-full">
            All My Orders
          </n-button>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {NButton, NSpin} from 'naive-ui'

const { t } = useI18n()
const route = useRoute()
const orderId = route.params.id as string

useHead({ title: computed(() => `Order Detail | ShopPay`) })

const { data, pending, error, refresh } = await useFetch<any>(`/api/orders/${orderId}/invoice`)

onMounted(() => {
  refresh()
})

const retrying = ref(false)

async function handleRetryPayment() {
  if (!data.value?.order?.id) return
  retrying.value = true
  try {
    const res = await $fetch<any>('/api/stripe/retry-payment', {
      method: 'POST',
      body: { orderId: data.value.order.id }
    })
    if (res?.url) {
      window.location.href = res.url
    }
  } catch (err: any) {
    console.error(err)
    alert(err.message || 'Error occurred during payment retry.')
  } finally {
    retrying.value = false
  }
}

const subtotal = computed(() => {
  if (!data.value?.order?.items) return 0
  return data.value.order.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
})
const tax = computed(() => (data.value?.order?.total_amount ?? 0) - subtotal.value)

function formatDate(raw: string) {
  if (!raw) return '—'
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const emojiMap: Record<string, string> = {
  Audio: '🎧', Phones: '📱', Keyboards: '⌨️', Mice: '🖱️',
  Monitors: '🖥️', Cameras: '📷', Speakers: '🔊', Wearables: '⌚',
  Peripherals: '⌨️', Displays: '🖥️', Computers: '💻',
  Accessories: '🎒', Gaming: '🎮',
}
function categoryEmoji(cat: string) { return emojiMap[cat] || '📦' }
</script>
