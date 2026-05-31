<template>
  <div class="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] cursor-pointer transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-purple-500/25 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35),0_0_60px_rgba(139,92,246,0.1)]">
    <!-- Product image / gradient -->
    <div class="relative h-48 flex items-center justify-center overflow-hidden" :style="{ background: gradientBg }">
      <!-- Animated mesh overlay -->
      <div class="absolute inset-0 opacity-30 mix-blend-overlay" :style="{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 40%)' }" />

      <span class="text-7xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 select-none drop-shadow-lg">
        {{ productEmoji }}
      </span>

      <!-- Dark overlay on hover -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a1a]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <!-- Category tag -->
      <span
        v-if="product.category"
        class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md"
      >
        {{ product.category }}
      </span>

      <!-- "In cart" badge -->
      <Transition name="badge-pop">
        <span
          v-if="quantityInCart > 0"
          class="absolute top-3 right-3 min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-[11px] font-bold shadow-lg shadow-purple-500/30"
        >
          {{ quantityInCart }}
        </span>
      </Transition>
    </div>

    <!-- Body -->
    <div class="p-5">
      <h3 class="text-base font-semibold text-slate-100 mb-1 group-hover:text-purple-300 transition-colors line-clamp-1">
        {{ product.name }}
      </h3>
      <p class="text-xs text-slate-500 mb-5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
        {{ product.description }}
      </p>

      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">{{ t('products.price_label') }}</p>
          <span class="text-xl font-extrabold gradient-text-purple">${{ formatPrice(product.price) }}</span>
        </div>
        <n-button
          type="primary"
          size="medium"
          class="transition-all duration-300"
          :class="justAdded
            ? '!bg-gradient-to-br !from-emerald-500 !to-emerald-600 !shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
            : 'btn-stripe'"
          :style="{ borderRadius: '10px' }"
          @click="handleAddToCart"
        >
          <template #icon>
            <Transition name="fade-icon" mode="out-in">
              <svg v-if="!justAdded" key="plus" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <svg v-else key="check" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </Transition>
          </template>
          <span class="text-xs">{{ justAdded ? t('products.added') : t('products.add_to_cart') }}</span>
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useCartStore} from '~/stores/cart'

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  category?: string
}

const props = defineProps<{ product: Product }>()

const { t } = useI18n()
const message = useAppMessage()
const cartStore = useCartStore()

const categoryEmojis: Record<string, string> = {
  Audio: '🎧', Phones: '📱', Keyboards: '⌨️', Mice: '🖱️',
  Monitors: '🖥️', Cameras: '📷', Speakers: '🔊', Wearables: '⌚',
  Peripherals: '⌨️', Displays: '🖥️', Computers: '💻',
  Accessories: '🎒', Gaming: '🎮',
}

const categoryGradients: Record<string, string> = {
  Audio: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
  Phones: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
  Keyboards: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  Peripherals: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  Mice: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  Monitors: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  Displays: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  Cameras: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
  Speakers: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  Wearables: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
  Computers: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  Accessories: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  Gaming: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
}

const productEmoji = computed(() => categoryEmojis[props.product.category || ''] || '📦')
const gradientBg = computed(() => categoryGradients[props.product.category || ''] || 'linear-gradient(135deg, #8b5cf6, #06b6d4)')

const quantityInCart = computed(() => {
  const item = cartStore.cartItems.find((i) => i.id === props.product.id)
  return item?.quantity || 0
})

const justAdded = ref(false)

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

function handleAddToCart() {
  cartStore.addItem({
    id: props.product.id,
    name: props.product.name,
    price: props.product.price,
    image: props.product.category || 'default',
  })

  justAdded.value = true
  message.success(`${props.product.name} added to cart`, { duration: 1800 })

  setTimeout(() => {
    justAdded.value = false
  }, 1500)
}
</script>
