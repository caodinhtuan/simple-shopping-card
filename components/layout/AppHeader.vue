<template>
  <header class="sticky top-0 z-50 glass-strong">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <NuxtLink class="flex items-center gap-2 group" to="/">
          <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110">
            S
          </div>
          <span class="text-xl font-bold gradient-text">ShopPay</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :class="[
              $route.path === item.path
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
              :to="item.path"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <PreferencesMenu/>
          <CartBadge/>

          <button
              class="btn-reset md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              @click="showMobileMenu = !showMobileMenu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!showMobileMenu" d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" stroke-linejoin="round"
                    stroke-width="2"/>
              <path v-else d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>

      <Transition name="slide">
        <div v-if="showMobileMenu" class="md:hidden pb-4 border-t border-white/5 mt-2 pt-3">
          <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :class="[
              $route.path === item.path
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
              :to="item.path"
              class="block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1"
              @click="showMobileMenu = false"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script lang="ts" setup>
import CartBadge from '~/components/layout/CartBadge.vue'
import PreferencesMenu from '~/components/layout/PreferencesMenu.vue'

const showMobileMenu = ref(false)
const {t} = useI18n()

const navItems = computed(() => [
  {label: t('nav.home'), path: '/'},
  {label: t('nav.products'), path: '/products'},
  {label: t('nav.subscriptions'), path: '/subscriptions'},
])
</script>
