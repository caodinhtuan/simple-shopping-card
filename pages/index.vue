<template>
  <div class="relative overflow-hidden">
    <!-- Ambient background glows -->
    <div class="hero-glow hero-glow-purple" />
    <div class="hero-glow hero-glow-cyan" />
    <div class="hero-glow hero-glow-pink" />

    <!-- Grid overlay -->
    <div
      class="pointer-events-none absolute inset-0 opacity-50 bg-[length:60px_60px] bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
    />

    <div class="container mx-auto px-4 py-16 lg:py-24 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] relative z-10">
      <!-- Eyebrow -->
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-in">
        <span class="relative flex w-2 h-2">
          <span class="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75" />
          <span class="relative w-2 h-2 rounded-full bg-purple-400" />
        </span>
        Vue 3 · Nuxt 3 · Naive UI · TailwindCSS
      </div>

      <!-- Headline -->
      <h1 class="text-center text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 animate-in stagger-1">
        Next-Gen
        <span class="gradient-text whitespace-nowrap">Payment Integration</span>
        <br class="hidden sm:block" />
        Demo Built for Show
      </h1>

      <!-- Subhead -->
      <p class="text-center text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mb-10 animate-in stagger-2">
        A production-ready reference implementation for <span class="text-purple-300 font-semibold">Stripe</span>
        and <span class="text-cyan-300 font-semibold">PayPal</span>. Supports
        one-time cart checkouts and recurring subscription billing — end-to-end.
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row items-center gap-3 mb-16 animate-in stagger-3">
        <NuxtLink to="/products">
          <n-button type="primary" size="large" class="btn-stripe" :style="{ height: '52px', padding: '0 28px', borderRadius: '12px', fontSize: '15px' }">
            <div class="flex items-center gap-2">
              Start Shopping
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </n-button>
        </NuxtLink>
        <NuxtLink to="/subscriptions">
          <n-button size="large" :style="{ height: '52px', padding: '0 28px', borderRadius: '12px', fontSize: '15px' }">
            View Subscriptions
          </n-button>
        </NuxtLink>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-16 animate-in stagger-4">
        <NuxtLink
          to="/products"
          class="group relative block overflow-hidden p-7 rounded-[20px] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.05] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_60px_rgba(139,92,246,0.1)] before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:bg-[linear-gradient(135deg,transparent,rgba(139,92,246,0.4),transparent)] before:opacity-0 before:transition-opacity before:duration-[400ms] hover:before:opacity-100 before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:[-webkit-mask-composite:xor]"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] mb-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:-rotate-6 bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            🛒
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2 group-hover:text-purple-300 transition-colors">
            One-Time Payments
          </h2>
          <p class="text-slate-400 leading-relaxed mb-6 text-sm">
            Browse 8 curated tech products, build a cart with quantity controls, and complete checkout via Stripe or PayPal.
            Includes order persistence, webhook handlers, and a polished success flow.
          </p>
          <div class="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <span>Enter Shop</span>
            <span class="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/subscriptions"
          class="group relative block overflow-hidden p-7 rounded-[20px] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.05] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.1)] before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:bg-[linear-gradient(135deg,transparent,rgba(6,182,212,0.4),transparent)] before:opacity-0 before:transition-opacity before:duration-[400ms] hover:before:opacity-100 before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:[-webkit-mask-composite:xor]"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] mb-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:-rotate-6 bg-[linear-gradient(135deg,#06b6d4,#0e7490)] shadow-[0_8px_24px_rgba(6,182,212,0.3)]"
          >
            🔄
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2 group-hover:text-cyan-300 transition-colors">
            Recurring Subscriptions
          </h2>
          <p class="text-slate-400 leading-relaxed mb-6 text-sm">
            Three subscription tiers — Starter, Pro, Enterprise — with monthly/yearly toggle, feature comparison, and full
            recurring billing flows via Stripe Subscriptions and PayPal Billing.
          </p>
          <div class="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <span>View Pricing</span>
            <span class="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Stat row -->
      <div class="glass-card p-6 sm:p-8 w-full max-w-5xl animate-in stagger-5">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div class="px-1">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-purple">2</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Payment Gateways</p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-cyan">2</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Billing Modes</p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-emerald">8</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Tech Products</p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-pink">3</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Pricing Tiers</p>
          </div>
        </div>
      </div>

      <!-- Tech Stack Strip -->
      <div class="mt-12 animate-in stagger-6 w-full max-w-5xl">
        <p class="text-center text-xs text-slate-600 uppercase tracking-wider font-semibold mb-4">
          Built with the modern stack
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <span
            v-for="tech in techStack"
            :key="tech"
            class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/[0.06] transition-all duration-200 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-slate-100 hover:-translate-y-px"
          >
            {{ tech }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'ShopPay — Payment Integration Demo',
  meta: [
    { name: 'description', content: 'Production-ready demo of Stripe & PayPal payment integration with shopping cart and subscription billing flows.' },
  ],
})

const techStack = [
  '⚡ Nuxt 3',
  '💚 Vue 3',
  '🎨 Naive UI',
  '🌊 TailwindCSS',
  '🍍 Pinia',
  '💳 Stripe API',
  '🅿️ PayPal REST',
  '📦 SQLite',
]
</script>
