<template>
  <div class="page-container">
    <!-- Header -->
    <div class="text-center mb-10 animate-in stagger-1">
      <h1 class="section-title text-3xl sm:text-4xl mb-2">
        <span class="gradient-text">Admin</span> Dashboard
      </h1>
      <p class="text-slate-400">Orders & Subscriptions overview</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-in stagger-2">
      <div v-for="stat in stats" :key="stat.label"
           class="glass-card p-5 flex flex-col gap-2 border-white/8">
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase tracking-wider text-slate-500 font-semibold">{{ stat.label }}</span>
          <span class="text-xl">{{ stat.icon }}</span>
        </div>
        <p class="text-2xl font-extrabold" :class="stat.color">{{ stat.value }}</p>
        <p class="text-xs text-slate-600">{{ stat.sub }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 animate-in stagger-3">
      <button
        v-for="tab in tabs" :key="tab.key"
        @click="activeTab = tab.key"
        :class="activeTab === tab.key
          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
          : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/20'"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200"
      >
        <span>{{ tab.icon }}</span>
        {{ tab.label }}
        <span class="ml-1 px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === tab.key ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-slate-500'">
          {{ tab.key === 'orders' ? data?.orders?.length : data?.subscriptions?.length }}
        </span>
      </button>
    </div>

    <!-- Orders Table -->
    <div v-if="activeTab === 'orders'" class="animate-in stagger-4">
      <div v-if="!data?.orders?.length" class="glass-card p-12 text-center text-slate-500">
        No orders yet.
      </div>
      <div v-else class="glass-card border-white/8 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/5">
                <th class="text-left py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Order</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Customer</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Items</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Gateway</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                <th class="text-right py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Total</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Date</th>
                <th class="py-4 px-4"/>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in data.orders" :key="order.id"
                  class="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  @click="$router.push(`/admin/orders/${order.id}`)">
                <td class="py-4 px-5">
                  <span class="font-mono font-bold text-slate-200 text-xs">{{ order.order_number }}</span>
                  <p class="text-xs text-slate-600 mt-0.5">#{{ order.id }}</p>
                </td>
                <td class="py-4 px-4 text-slate-400 text-xs max-w-[160px] truncate">{{ order.customer_email }}</td>
                <td class="py-4 px-4">
                  <div class="flex flex-col gap-0.5">
                    <span v-for="item in order.items" :key="item.product_name"
                          class="text-xs text-slate-400 truncate max-w-[140px]">
                      {{ item.product_name }} ×{{ item.quantity }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="flex items-center gap-1.5 text-xs font-semibold"
                        :class="order.payment_gateway === 'paypal' ? 'text-blue-400' : 'text-purple-400'">
                    <span class="w-1.5 h-1.5 rounded-full"
                          :style="{ background: order.payment_gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }"/>
                    {{ order.payment_gateway === 'paypal' ? 'PayPal' : 'Stripe' }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        :class="{
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': order.status === 'paid',
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20': order.status === 'pending',
                          'bg-red-500/10 text-red-400 border border-red-500/20': order.status === 'cancelled',
                        }">
                    <span class="w-1.5 h-1.5 rounded-full"
                          :class="{
                            'bg-emerald-400': order.status === 'paid',
                            'bg-amber-400': order.status === 'pending',
                            'bg-red-400': order.status === 'cancelled',
                          }"/>
                    {{ order.status }}
                  </span>
                </td>
                <td class="py-4 px-5 text-right">
                  <span class="font-bold text-slate-100">${{ (order.total_amount / 100).toFixed(2) }}</span>
                </td>
                <td class="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                  {{ formatDate(order.created_at) }}
                </td>
                <td class="py-4 px-4">
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-purple-400 font-semibold whitespace-nowrap flex items-center gap-1">
                    View →
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Subscriptions Table -->
    <div v-if="activeTab === 'subscriptions'" class="animate-in stagger-4">
      <div v-if="!data?.subscriptions?.length" class="glass-card p-12 text-center text-slate-500">
        No subscriptions yet.
      </div>
      <div v-else class="glass-card border-white/8 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/5">
                <th class="text-left py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Subscription ID</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Customer</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Plan</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Gateway</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Period Start</th>
                <th class="text-left py-4 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in data.subscriptions" :key="sub.id"
                  class="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td class="py-4 px-5">
                  <span class="font-mono text-xs text-slate-300">{{ sub.subscription_id }}</span>
                </td>
                <td class="py-4 px-4 text-slate-400 text-xs max-w-[160px] truncate">{{ sub.customer_email }}</td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-200">{{ sub.plan_name }}</span>
                    <span class="text-xs text-slate-500">${{ (sub.plan_price / 100).toFixed(0) }}/mo</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="flex items-center gap-1.5 text-xs font-semibold"
                        :class="sub.payment_gateway === 'paypal' ? 'text-blue-400' : 'text-purple-400'">
                    <span class="w-1.5 h-1.5 rounded-full"
                          :style="{ background: sub.payment_gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }"/>
                    {{ sub.payment_gateway === 'paypal' ? 'PayPal' : 'Stripe' }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        :class="{
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': sub.status === 'active',
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20': sub.status === 'pending',
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20': sub.status === 'cancelled',
                        }">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse"
                          :class="{
                            'bg-emerald-400': sub.status === 'active',
                            'bg-amber-400': sub.status === 'pending',
                            'bg-slate-400': sub.status === 'cancelled',
                          }"/>
                    {{ sub.status }}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                  {{ sub.current_period_start ? formatDate(sub.current_period_start) : '—' }}
                </td>
                <td class="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                  {{ formatDate(sub.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-20">
      <n-spin size="large" stroke="#8b5cf6" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NSpin } from 'naive-ui'

useHead({ title: 'Admin — Orders & Subscriptions | ShopPay' })

const activeTab = ref<'orders' | 'subscriptions'>('orders')

const tabs = [
  { key: 'orders', label: 'Orders', icon: '🛍️' },
  { key: 'subscriptions', label: 'Subscriptions', icon: '🔄' },
]

const { data, pending } = await useFetch<any>('/api/admin/overview')

const stats = computed(() => [
  {
    label: 'Total Revenue',
    value: `$${((data.value?.stats?.totalRevenue || 0) / 100).toFixed(2)}`,
    icon: '💰',
    color: 'text-emerald-400',
    sub: 'from paid orders',
  },
  {
    label: 'Paid Orders',
    value: data.value?.stats?.paidOrders || 0,
    icon: '🛍️',
    color: 'text-purple-400',
    sub: `of ${data.value?.stats?.totalOrders || 0} total`,
  },
  {
    label: 'Active Subs',
    value: data.value?.stats?.activeSubscriptions || 0,
    icon: '🔄',
    color: 'text-cyan-400',
    sub: 'recurring revenue',
  },
  {
    label: 'MRR',
    value: `$${computeMRR()}`,
    icon: '📈',
    color: 'text-amber-400',
    sub: 'monthly recurring',
  },
])

function computeMRR() {
  if (!data.value?.subscriptions) return '0.00'
  const mrr = data.value.subscriptions
    .filter((s: any) => s.status === 'active')
    .reduce((sum: number, s: any) => sum + (s.plan_price || 0), 0)
  return (mrr / 100).toFixed(2)
}

function formatDate(raw: string) {
  if (!raw) return '—'
  const d = new Date(raw)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
