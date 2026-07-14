<template>
  <div class="page-container max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-10 animate-in stagger-1">
      <h1 class="section-title text-3xl sm:text-4xl mb-2">
        My <span class="gradient-text">Orders</span>
      </h1>
      <p class="text-slate-400 text-sm">Enter your email to view your order history</p>
    </div>

    <!-- Email Lookup -->
    <ClientOnly>
      <div class="glass-card p-6 mb-8 border-white/8 animate-in stagger-2">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <n-input
              v-model:value="emailInput"
              placeholder="your@email.com"
              size="large"
              type="text"
              :disabled="loading"
              @keydown.enter="lookup"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
            </n-input>
          </div>
          <n-button
            :disabled="!isValidEmail || loading"
            :loading="loading"
            :style="{ height: '42px', borderRadius: '10px', padding: '0 24px', fontWeight: '600' }"
            class="btn-stripe"
            type="primary"
            @click="lookup"
          >
            Look Up Orders
          </n-button>
        </div>
        <p v-if="emailInput && !isValidEmail" class="text-red-400 text-xs mt-2">Please enter a valid email address.</p>
      </div>

      <template #fallback>
        <!-- A beautiful styled placeholder/skeleton while loading on server -->
        <div class="glass-card p-6 mb-8 border-white/8 flex flex-col sm:flex-row gap-3">
          <div class="flex-1 h-[42px] bg-white/5 rounded-xl animate-pulse" />
          <div class="w-36 h-[42px] bg-white/5 rounded-xl animate-pulse" />
        </div>
      </template>
    </ClientOnly>

    <!-- Skeleton Loading State -->
    <div v-if="loading" class="space-y-4 animate-in stagger-3">
      <!-- Summary Bar Skeleton -->
      <div class="flex justify-between items-center mb-6">
        <div class="w-48 h-5 bg-white/5 rounded animate-pulse" />
        <div class="flex gap-4">
          <div class="w-16 h-10 bg-white/5 rounded animate-pulse" />
          <div class="w-16 h-10 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      
      <!-- List Skeletons -->
      <div v-for="i in 3" :key="i" class="glass-card border-white/8 p-5 space-y-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
            <div class="space-y-2">
              <div class="w-28 h-4 bg-white/5 rounded animate-pulse" />
              <div class="w-20 h-3 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-16 h-6 bg-white/5 rounded-full animate-pulse" />
            <div class="w-12 h-5 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div class="flex gap-2">
          <div class="w-20 h-5 bg-white/5 rounded-lg animate-pulse" />
          <div class="w-24 h-5 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Results -->
    <Transition name="fade-slide">
      <div v-if="result" class="animate-in stagger-3">

        <!-- No orders found -->
        <div v-if="result.orders.length === 0"
             class="glass-card p-16 text-center border-white/8">
          <div class="text-5xl mb-4">🔍</div>
          <h3 class="text-slate-200 font-bold text-lg mb-2">No orders found</h3>
          <p class="text-slate-500 text-sm">We couldn't find any orders for <span class="text-slate-300 font-medium">{{ result.email }}</span></p>
          <NuxtLink to="/products">
            <n-button :style="{ borderRadius: '10px', marginTop: '20px' }" class="btn-stripe" type="primary">
              Start Shopping
            </n-button>
          </NuxtLink>
        </div>

        <template v-else>
          <!-- Summary bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p class="text-slate-400 text-sm">
                Orders for <span class="text-slate-200 font-semibold">{{ result.email }}</span>
              </p>
            </div>
            <div class="flex gap-4">
              <div class="text-center">
                <p class="text-2xl font-extrabold text-purple-400">{{ result.orders.length }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wider">Orders</p>
              </div>
              <div class="w-px bg-white/10"/>
              <div class="text-center">
                <p class="text-2xl font-extrabold text-emerald-400">${{ (result.totalSpent / 100).toFixed(2) }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wider">Total Spent</p>
              </div>
            </div>
          </div>

          <!-- Orders list -->
          <div class="space-y-4">
            <div
              v-for="order in result.orders"
              :key="order.id"
              class="glass-card border-white/8 overflow-hidden hover:border-purple-500/30 transition-all duration-200 cursor-pointer group"
              @click="$router.push(`/orders/${order.id}`)"
            >
              <!-- Order header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/[0.04]">
                <div class="flex items-center gap-4">
                  <!-- Gateway icon -->
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       :style="{ background: order.payment_gateway === 'paypal' ? 'linear-gradient(135deg,#0070ba,#003087)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }">
                    <svg v-if="order.payment_gateway === 'stripe'" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                    </svg>
                    <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="font-mono font-bold text-slate-100 text-sm">{{ order.order_number }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(order.created_at) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <!-- Status badge -->
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
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
                    {{ order.status === 'paid' ? 'Paid' : order.status === 'pending' ? 'Pending' : 'Cancelled' }}
                  </span>
                  <!-- Total -->
                  <span class="font-bold text-slate-100 text-base">${{ (order.total_amount / 100).toFixed(2) }}</span>
                  <!-- Arrow -->
                  <svg class="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors group-hover:translate-x-1 transform duration-200"
                       fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <!-- Items list -->
              <div class="px-5 py-3 flex flex-wrap gap-2">
                <span v-for="item in order.items" :key="item.product_name"
                      class="inline-flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1 text-slate-400">
                  <span class="w-1 h-1 rounded-full bg-slate-600"/>
                  {{ item.product_name }} ×{{ item.quantity }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { NInput, NButton } from 'naive-ui'

useHead({ title: 'My Orders | ShopPay' })

const emailInput = ref('')
const loading = ref(false)
const result = ref<any>(null)

// Pre-fill from localStorage
onMounted(() => {
  if (import.meta.client) {
    emailInput.value = localStorage.getItem('demo-email') || ''
  }
})

const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()),
)

async function lookup() {
  if (!isValidEmail.value || loading.value) return
  loading.value = true
  result.value = null
  try {
    result.value = await $fetch<any>('/api/orders/history', {
      params: { email: emailInput.value.trim() },
    })
  } catch (e: any) {
    useAppMessage().error(e?.data?.statusMessage || 'Failed to load orders')
  } finally {
    loading.value = false
  }
}

function formatDate(raw: string) {
  if (!raw) return '—'
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.fade-slide-enter-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(12px); }
</style>
