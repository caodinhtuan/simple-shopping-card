<template>
  <div class="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
    <div class="hero-glow hero-glow-cyan"/>

    <!-- Confetti -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div v-for="n in 50" :key="n" :style="getConfetti(n)"/>
    </div>

    <div class="w-full max-w-xl glass-card p-8 md:p-12 text-center border-white/8 relative z-10 animate-in">
      <div
          class="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative bg-[radial-gradient(circle,rgba(6,182,212,0.2),rgba(6,182,212,0.05))] ring-pulse-cyan before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:border-2 before:border-cyan-500/20 before:ring-expand-cyan"
      >
        <svg class="w-12 h-12 text-cyan-400 check-draw" fill="none" stroke="currentColor" stroke-width="2.5"
             viewBox="0 0 24 24">
          <path d="m4.5 12.75 6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
        Subscription <span class="gradient-text-cyan">Activated!</span>
      </h1>
      <p class="text-slate-400 text-sm mb-2">
        Your subscription tier has been authorized and activated. Welcome aboard!
      </p>
      <p v-if="isDemoMode" class="text-amber-400/80 text-xs mb-8">
        💡 Demo mode — no recurring charge was scheduled
      </p>
      <p v-else class="mb-8"/>

      <!-- Plan Info -->
      <div v-if="plan"
           class="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6 mb-6 text-left">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Plan</p>
          <span
              class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            Active · {{ interval }}
          </span>
        </div>
        <p class="text-2xl font-bold gradient-text mb-1">{{ plan.name }}</p>
        <p class="text-slate-400 text-xs mb-4">{{ plan.description }}</p>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-extrabold text-slate-100">${{ (displayPrice / 100).toFixed(2) }}</span>
          <span class="text-slate-500 text-sm">/{{ interval === 'yearly' ? 'year' : 'month' }}</span>
        </div>
      </div>

      <!-- Details -->
      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 text-left space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Gateway</span>
          <span class="text-slate-200 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
            <span :style="{ background: gateway === 'paypal' ? '#0070ba' : '#8b5cf6' }" class="w-2 h-2 rounded-full"/>
            {{ gatewayName }}
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Subscription ID</span>
          <span class="text-slate-200 font-mono font-semibold text-xs">{{ subscriptionId }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 font-medium">Next billing</span>
          <span class="text-slate-200 font-medium">{{ nextBilling }}</span>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <NuxtLink class="w-full sm:w-auto" to="/subscriptions">
          <n-button :style="{ borderRadius: '12px' }" class="btn-stripe w-full" size="large" type="primary">
            View Plans
          </n-button>
        </NuxtLink>
        <NuxtLink class="w-full sm:w-auto" to="/">
          <n-button :style="{ borderRadius: '12px' }" class="w-full" size="large">
            Go Home
          </n-button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
useHead({title: computed(() => t('meta.sub_success'))})

const route = useRoute()

const gateway = computed(() => String(route.query.gateway || (route.query.session_id ? 'stripe' : 'paypal')))
const isDemoMode = computed(() => route.query.demo === '1')
const gatewayName = computed(() => gateway.value === 'paypal' ? 'PayPal' : 'Stripe')

const planId = computed(() => route.query.plan_id ? String(route.query.plan_id) : '')
const interval = computed(() => String(route.query.interval || 'monthly'))

const subscriptionId = computed(() => {
  if (route.query.session_id) return 'sub_' + String(route.query.session_id).slice(8, 22).toUpperCase()
  return `SUB-${Date.now().toString(36).toUpperCase().slice(-8)}`
})

const nextBilling = computed(() => {
  const d = new Date()
  if (interval.value === 'yearly') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
})

const plan = ref<any | null>(null)
const displayPrice = computed(() => {
  if (!plan.value) return 0
  return interval.value === 'yearly'
      ? (plan.value.price_yearly ?? Math.round(plan.value.price * 12 * 0.8))
      : (plan.value.price_monthly ?? plan.value.price)
})

const message = useAppMessage()

onMounted(async () => {
  message.success('Subscription activated successfully', {duration: 3500})


  if (planId.value) {
    try {
      const res = await $fetch<any>('/api/plans')
      const found = (res.plans || []).find((p: any) => String(p.id) === planId.value)
      if (found) plan.value = found
    } catch (e) {
      console.warn('Failed to fetch plan details', e)
    }
  }
})

function getConfetti(index: number) {
  const colors = ['#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#a855f7']
  const c = colors[Math.floor(Math.random() * colors.length)]
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 4 + Math.random() * 4
  const scale = 0.5 + Math.random() * 0.8
  return {
    position: 'absolute' as const,
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
