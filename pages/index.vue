<template>
  <div class="relative overflow-hidden">
    <!-- Ambient background glows -->
    <div class="hero-glow hero-glow-purple"/>
    <div class="hero-glow hero-glow-cyan"/>
    <div class="hero-glow hero-glow-pink"/>

    <!-- Grid overlay -->
    <div
        class="pointer-events-none absolute inset-0 opacity-50 bg-[length:60px_60px] bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
    />

    <div
        class="container mx-auto px-4 py-16 lg:py-24 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] relative z-10">
      <!-- Eyebrow -->
      <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-in">
        <span class="relative flex w-2 h-2">
          <span class="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75"/>
          <span class="relative w-2 h-2 rounded-full bg-purple-400"/>
        </span>
        {{ t('home.eyebrow') }}
      </div>

      <!-- Headline -->
      <h1 class="text-center text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 animate-in stagger-1">
        {{ t('home.title_part1') }}
        <span class="gradient-text whitespace-nowrap">{{ t('home.title_part2') }}</span>
        <br class="hidden sm:block"/>
        {{ t('home.title_part3') }}
      </h1>

      <!-- Subhead -->
      <p class="text-center text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mb-10 animate-in stagger-2">
        <span
            v-html="t('home.subhead', { stripe: '<span class=\'text-purple-600 dark:text-purple-300 font-semibold\'>Stripe</span>', paypal: '<span class=\'text-cyan-600 dark:text-cyan-300 font-semibold\'>PayPal</span>' })"/>
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row items-center gap-3 mb-16 animate-in stagger-3">
        <NuxtLink to="/products">
          <n-button :style="{ height: '52px', padding: '0 28px', borderRadius: '12px', fontSize: '15px' }" class="btn-stripe" size="large"
                    type="primary">
            <div class="flex items-center gap-2">
              {{ t('home.cta_shop') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </n-button>
        </NuxtLink>
        <NuxtLink to="/subscriptions">
          <n-button :style="{ height: '52px', padding: '0 28px', borderRadius: '12px', fontSize: '15px' }" size="large">
            {{ t('home.cta_subs') }}
          </n-button>
        </NuxtLink>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-16 animate-in stagger-4">
        <NuxtLink
            class="group relative block overflow-hidden p-7 rounded-[20px] border transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-white border-[#e0e0e6] shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-purple-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:backdrop-blur-2xl dark:hover:bg-white/[0.05] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_60px_rgba(139,92,246,0.1)]"
            to="/products"
        >
          <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] mb-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:-rotate-6 bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            🛒
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
            {{ t('home.card1_title') }}
          </h2>
          <p class="text-slate-400 leading-relaxed mb-6 text-sm">
            {{ t('home.card1_desc') }}
          </p>
          <div class="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
            <span>{{ t('home.card1_cta') }}</span>
            <span class="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
          </div>
        </NuxtLink>

        <NuxtLink
            class="group relative block overflow-hidden p-7 rounded-[20px] border transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-white border-[#e0e0e6] shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-cyan-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:backdrop-blur-2xl dark:hover:bg-white/[0.05] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.1)]"
            to="/subscriptions"
        >
          <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] mb-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:-rotate-6 bg-[linear-gradient(135deg,#06b6d4,#0e7490)] shadow-[0_8px_24px_rgba(6,182,212,0.3)]"
          >
            🔄
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
            {{ t('home.card2_title') }}
          </h2>
          <p class="text-slate-400 leading-relaxed mb-6 text-sm">
            {{ t('home.card2_desc') }}
          </p>
          <div class="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-sm">
            <span>{{ t('home.card2_cta') }}</span>
            <span class="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Stat row -->
      <div class="glass-card p-6 sm:p-8 w-full max-w-5xl animate-in stagger-5">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div class="px-1">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-purple">2</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
              {{ t('home.stat_gateways') }}
            </p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-cyan">2</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{{ t('home.stat_modes') }}</p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-emerald">8</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
              {{ t('home.stat_products') }}
            </p>
          </div>
          <div class="px-1 border-l-0 md:border-l border-white/5">
            <p class="text-3xl sm:text-4xl font-extrabold gradient-text-pink">3</p>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{{ t('home.stat_tiers') }}</p>
          </div>
        </div>
      </div>

      <!-- Tech Stack Strip -->
      <div class="mt-12 animate-in stagger-6 w-full max-w-5xl">
        <p class="text-center text-xs text-slate-600 uppercase tracking-wider font-semibold mb-4">
          {{ t('home.stack_label') }}
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

<script lang="ts" setup>
import {NButton} from 'naive-ui'

const {t} = useI18n()

useHead({
  title: computed(() => t('meta.home')),
  meta: [
    {
      name: 'description',
      content: computed(() => t('meta.home_desc'))
    },
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
