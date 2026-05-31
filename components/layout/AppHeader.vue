<template>
  <header class="sticky top-0 z-50 glass-strong">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110">
            S
          </div>
          <span class="text-xl font-bold gradient-text">ShopPay</span>
        </NuxtLink>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              $route.path === item.path
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Right side: Cart + Mobile menu -->
        <div class="flex items-center gap-3">
          <CartBadge />

          <!-- Mobile menu button -->
          <button
            class="btn-reset md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            @click="showMobileMenu = !showMobileMenu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!showMobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <Transition name="slide">
        <div v-if="showMobileMenu" class="md:hidden pb-4 border-t border-white/5 mt-2 pt-3">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1"
            :class="[
              $route.path === item.path
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
            @click="showMobileMenu = false"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import CartBadge from '~/components/layout/CartBadge.vue'

const showMobileMenu = ref(false)

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Subscriptions', path: '/subscriptions' },
]
</script>
