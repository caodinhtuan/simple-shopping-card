<template>
  <div class="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
    <div class="hero-glow" :style="{ background: '#f59e0b', top: '-200px', left: '-100px' }" />

    <div class="w-full max-w-xl glass-card p-8 md:p-12 text-center border-white/8 animate-in">
      <div class="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-[radial-gradient(circle,rgba(245,158,11,0.2),rgba(245,158,11,0.05))] ring-pulse-amber">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-12 h-12 text-amber-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
        Subscription <span class="gradient-text-orange">Cancelled</span>
      </h1>
      <p class="text-slate-400 text-sm mb-8 leading-relaxed">
        The subscription authorization was cancelled. No subscription was created and no charges were made.
      </p>

      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 text-left">
        <p class="mb-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">What happened?</p>
        <ul class="space-y-2 text-xs text-slate-500">
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>You exited Stripe Checkout or PayPal approval screens.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>The selected payment method couldn't be authorized for recurring billing.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">•</span>
            <span>The secure session closed or timed out.</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <NuxtLink to="/subscriptions" class="w-full sm:w-auto">
          <n-button type="primary" size="large" class="btn-stripe w-full" :style="{ borderRadius: '12px' }">
            Back to Plans
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
useHead({ title: 'Subscription Cancelled — ShopPay' })
</script>
