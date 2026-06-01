<template>
  <footer class="border-t border-white/5 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div
                class="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span class="text-lg font-bold gradient-text">ShopPay</span>
          </div>
          <p class="text-slate-500 text-sm leading-relaxed">
            {{ t('footer.desc') }}
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">{{ t('footer.links') }}</h4>
          <div class="flex flex-col gap-2">
            <NuxtLink class="text-slate-500 hover:text-purple-400 text-sm transition-colors" to="/products">
              {{ t('nav.products') }}
            </NuxtLink>
            <NuxtLink class="text-slate-500 hover:text-purple-400 text-sm transition-colors" to="/subscriptions">
              {{ t('nav.subscriptions') }}
            </NuxtLink>
            <NuxtLink class="text-slate-500 hover:text-purple-400 text-sm transition-colors" to="/cart">
              {{ t('cart.title') }}
            </NuxtLink>
          </div>
        </div>

        <!-- Payment Methods -->
        <div>
          <h4 class="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">{{ t('footer.powered') }}</h4>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path
                    d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
              <span class="text-slate-400 text-xs font-medium">Stripe</span>
            </div>
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path
                    d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
              </svg>
              <span class="text-slate-400 text-xs font-medium">PayPal</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-slate-600 text-xs">
          {{ t('footer.rights', { year: new Date().getFullYear() }) }}
        </p>
        <div class="flex items-center gap-4">
          <span class="text-slate-600 text-xs">{{ t('footer.demo_warn') }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
const { t } = useI18n()
</script>
