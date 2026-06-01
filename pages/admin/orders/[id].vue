<template>
  <div class="page-container max-w-4xl mx-auto">
    <!-- Back -->
    <div class="mb-6 animate-in stagger-1">
      <NuxtLink to="/admin"
        class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors group">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor"
          stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Back to Admin
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-24 gap-4">
      <n-spin size="large" stroke="#8b5cf6" />
      <p class="text-slate-500 text-sm">Loading invoice...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="glass-card p-12 text-center">
      <div class="text-5xl mb-4">⚠️</div>
      <p class="text-red-400 font-semibold">Order not found</p>
      <NuxtLink to="/admin" class="text-slate-500 hover:text-slate-300 text-sm mt-3 block">← Back to Admin</NuxtLink>
    </div>

    <template v-else-if="data">
      <!-- Invoice Header -->
      <div class="glass-card p-8 mb-6 border-white/8 animate-in stagger-2">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <!-- Left: Branding -->
          <div>
            <div class="flex items-center mb-3">
              <img
                src="/logo.png"
                alt="ShopPay"
                class="h-9 w-auto"
                style="filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) brightness(1.05);"
              />
            </div>
            <p class="text-slate-500 text-xs">Order Invoice</p>
            <p class="text-2xl font-extrabold font-mono text-slate-100 mt-1">{{ data.order.order_number }}</p>
          </div>

          <!-- Right: Status badge + meta -->
          <div class="text-left sm:text-right">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-3"
              :class="{
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': data.order.status === 'paid',
                'bg-amber-500/10 text-amber-400 border border-amber-500/20': data.order.status === 'pending',
                'bg-red-500/10 text-red-400 border border-red-500/20': data.order.status === 'cancelled',
              }">
              <span class="w-2 h-2 rounded-full"
                :class="{
                  'bg-emerald-400 animate-pulse': data.order.status === 'paid',
                  'bg-amber-400': data.order.status === 'pending',
                  'bg-red-400': data.order.status === 'cancelled',
                }" />
              {{ data.order.status.toUpperCase() }}
            </span>
            <p class="text-slate-500 text-xs">Date: <span class="text-slate-300">{{ formatDate(data.order.created_at) }}</span></p>
            <p class="text-slate-500 text-xs mt-1">Gateway:
              <span class="font-semibold"
                :class="data.order.payment_gateway === 'paypal' ? 'text-blue-400' : 'text-purple-400'">
                {{ data.gatewayInvoice?.provider }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in stagger-3">
        <!-- Left column: Line items + totals -->
        <div class="lg:col-span-2 flex flex-col gap-6">

          <!-- Line items -->
          <div class="glass-card border-white/8 overflow-hidden">
            <div class="px-6 py-4 border-b border-white/5">
              <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider">Items Ordered</h3>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/[0.04]">
                  <th class="text-left py-3 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Product</th>
                  <th class="text-center py-3 px-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">Qty</th>
                  <th class="text-right py-3 px-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">Unit</th>
                  <th class="text-right py-3 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data.order.items" :key="item.product_name"
                  class="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td class="py-4 px-6">
                    <p class="text-slate-200 font-medium">{{ item.product_name }}</p>
                    <p class="text-xs text-slate-600">{{ item.category }}</p>
                  </td>
                  <td class="py-4 px-4 text-center text-slate-400">{{ item.quantity }}</td>
                  <td class="py-4 px-4 text-right text-slate-400">${{ (item.unit_price / 100).toFixed(2) }}</td>
                  <td class="py-4 px-6 text-right font-semibold text-slate-200">
                    ${{ (item.unit_price * item.quantity / 100).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="px-6 py-4 border-t border-white/5 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Subtotal</span>
                <span class="text-slate-300">${{ (subtotal / 100).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Tax (10%)</span>
                <span class="text-slate-300">${{ (tax / 100).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-base font-bold pt-3 border-t border-white/5">
                <span class="text-slate-100">Total</span>
                <span class="gradient-text text-lg">${{ (data.order.total_amount / 100).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment ID / Transaction ref -->
          <div v-if="data.order.payment_id" class="glass-card border-white/8 p-5">
            <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Transaction Reference</p>
            <p class="font-mono text-xs text-slate-400 break-all">{{ data.order.payment_id }}</p>
          </div>
        </div>

        <!-- Right column: Customer + Gateway Invoice -->
        <div class="flex flex-col gap-6">

          <!-- Customer -->
          <div class="glass-card border-white/8 p-5">
            <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Customer</p>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/40 flex items-center justify-center text-purple-300 font-bold text-sm">
                {{ (data.gatewayInvoice?.payer_email || data.order.customer_email || '?')[0].toUpperCase() }}
              </div>
              <div>
                <p v-if="data.gatewayInvoice?.payer_name" class="text-slate-200 text-sm font-semibold">
                  {{ data.gatewayInvoice.payer_name }}
                </p>
                <p class="text-slate-400 text-xs break-all">
                  {{ data.gatewayInvoice?.payer_email || data.gatewayInvoice?.customer_email || data.order.customer_email }}
                </p>
              </div>
            </div>
          </div>

          <!-- Gateway Invoice Details -->
          <div class="glass-card border-white/8 p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-2 h-2 rounded-full"
                :style="{ background: data.order.payment_gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }" />
              <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                {{ data.gatewayInvoice?.provider }} Invoice
              </p>
            </div>

            <!-- Demo / Error notice -->
            <div v-if="data.gatewayInvoice?.demo || data.gatewayInvoice?.error"
              class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 mb-3">
              {{ data.gatewayInvoice?.error || 'Demo mode — configure real API keys to fetch live invoice data.' }}
            </div>

            <div v-else class="space-y-3">
              <!-- Stripe fields -->
              <template v-if="data.order.payment_gateway === 'stripe'">
                <div v-if="data.gatewayInvoice?.charge_id" class="flex flex-col gap-0.5">
                  <span class="text-xs text-slate-600 uppercase tracking-wider">Charge ID</span>
                  <span class="font-mono text-xs text-slate-400 break-all">{{ data.gatewayInvoice.charge_id }}</span>
                </div>
                <div v-if="data.gatewayInvoice?.card_brand" class="flex justify-between text-sm">
                  <span class="text-slate-500">Card</span>
                  <span class="text-slate-300 font-semibold capitalize">
                    {{ data.gatewayInvoice.card_brand }} ···· {{ data.gatewayInvoice.card_last4 }}
                  </span>
                </div>
                <div v-if="data.gatewayInvoice?.payment_method" class="flex justify-between text-sm">
                  <span class="text-slate-500">Method</span>
                  <span class="text-slate-300 capitalize">{{ data.gatewayInvoice.payment_method }}</span>
                </div>
                <div v-if="data.gatewayInvoice?.currency" class="flex justify-between text-sm">
                  <span class="text-slate-500">Currency</span>
                  <span class="text-slate-300">{{ data.gatewayInvoice.currency }}</span>
                </div>
                <a v-if="data.gatewayInvoice?.receipt_url" :href="data.gatewayInvoice.receipt_url" target="_blank"
                  class="flex items-center justify-center gap-2 w-full mt-4 py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/20 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  View Stripe Receipt
                </a>
              </template>

              <!-- PayPal fields -->
              <template v-if="data.order.payment_gateway === 'paypal'">
                <div v-if="data.gatewayInvoice?.paypal_order_id" class="flex flex-col gap-0.5">
                  <span class="text-xs text-slate-600 uppercase tracking-wider">PayPal Order ID</span>
                  <span class="font-mono text-xs text-slate-400 break-all">{{ data.gatewayInvoice.paypal_order_id }}</span>
                </div>
                <div v-if="data.gatewayInvoice?.capture_id" class="flex flex-col gap-0.5">
                  <span class="text-xs text-slate-600 uppercase tracking-wider">Capture ID</span>
                  <span class="font-mono text-xs text-slate-400 break-all">{{ data.gatewayInvoice.capture_id }}</span>
                </div>
                <div v-if="data.gatewayInvoice?.capture_status" class="flex justify-between text-sm">
                  <span class="text-slate-500">Capture</span>
                  <span class="text-emerald-400 font-semibold capitalize">{{ data.gatewayInvoice.capture_status }}</span>
                </div>
                <div v-if="data.gatewayInvoice?.currency" class="flex justify-between text-sm">
                  <span class="text-slate-500">Currency</span>
                  <span class="text-slate-300">{{ data.gatewayInvoice.currency }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { NSpin } from 'naive-ui'

const route = useRoute()
const orderId = route.params.id as string

useHead({ title: computed(() => `Order #${orderId} Invoice | ShopPay Admin`) })

const { data, pending, error } = await useFetch<any>(`/api/orders/${orderId}/invoice`)

const subtotal = computed(() => {
  if (!data.value?.order?.items) return 0
  return data.value.order.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
})

const tax = computed(() => data.value?.order?.total_amount - subtotal.value || 0)

function formatDate(raw: string) {
  if (!raw) return '—'
  return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
