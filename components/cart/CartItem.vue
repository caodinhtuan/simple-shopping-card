<template>
  <div class="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.05] hover:border-purple-500/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
    <!-- Image / gradient -->
    <div
      class="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
      :style="{ background: getGradient(item.image) }"
    >
      <span class="text-3xl select-none drop-shadow-md">{{ getEmoji(item.image) }}</span>
    </div>

    <!-- Details -->
    <div class="flex-1 min-w-0 text-center sm:text-left">
      <h4 class="text-slate-100 font-semibold text-sm sm:text-base truncate">{{ item.name }}</h4>
      <p class="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
        ${{ formatPrice(item.price) }} each · {{ item.image }}
      </p>
    </div>

    <!-- Quantity -->
    <div class="flex items-center gap-1 p-1 rounded-[10px] bg-white/[0.04] border border-white/[0.08]">
      <button
        class="btn-reset w-7 h-7 rounded-[7px] text-slate-300 text-lg font-semibold flex items-center justify-center transition-all duration-200 hover:bg-purple-500/15 hover:text-purple-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
        :disabled="item.quantity <= 1"
        @click="$emit('update:quantity', item.quantity - 1)"
      >−</button>
      <span class="min-w-[28px] text-center text-slate-100 font-semibold text-sm tabular-nums">{{ item.quantity }}</span>
      <button
        class="btn-reset w-7 h-7 rounded-[7px] text-slate-300 text-lg font-semibold flex items-center justify-center transition-all duration-200 hover:bg-purple-500/15 hover:text-purple-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
        :disabled="item.quantity >= 99"
        @click="$emit('update:quantity', item.quantity + 1)"
      >+</button>
    </div>

    <!-- Line Total -->
    <div class="text-right min-w-[88px]">
      <p class="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Subtotal</p>
      <p class="text-lg font-bold gradient-text-purple">${{ formatPrice(item.price * item.quantity) }}</p>
    </div>

    <!-- Remove -->
    <button
      class="btn-reset w-8 h-8 rounded-lg text-slate-500 flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
      title="Remove item"
      @click="$emit('remove')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type {CartItem} from '~/stores/cart'

defineProps<{ item: CartItem }>()

defineEmits<{
  'update:quantity': [quantity: number]
  'remove': []
}>()

const categoryEmojis: Record<string, string> = {
  Audio: '🎧', Phones: '📱', Keyboards: '⌨️', Mice: '🖱️',
  Monitors: '🖥️', Cameras: '📷', Speakers: '🔊', Wearables: '⌚',
  Peripherals: '⌨️', Displays: '🖥️', Computers: '💻',
  Accessories: '🎒', Gaming: '🎮', default: '📦',
}

const categoryGradients: Record<string, string> = {
  Audio: 'linear-gradient(135deg, #7c3aed, #2563eb)',
  Phones: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
  Keyboards: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  Peripherals: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  Mice: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  Monitors: 'linear-gradient(135deg, #10b981, #06b6d4)',
  Displays: 'linear-gradient(135deg, #10b981, #06b6d4)',
  Cameras: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
  Speakers: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  Wearables: 'linear-gradient(135deg, #06b6d4, #10b981)',
  Computers: 'linear-gradient(135deg, #6366f1, #a855f7)',
  Accessories: 'linear-gradient(135deg, #6366f1, #a855f7)',
  Gaming: 'linear-gradient(135deg, #ef4444, #f59e0b)',
  default: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
}

function getEmoji(category: string): string {
  return categoryEmojis[category] || categoryEmojis.default
}
function getGradient(category: string): string {
  return categoryGradients[category] || categoryGradients.default
}
function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}
</script>
