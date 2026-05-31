<template>
  <NuxtLink
    to="/cart"
    class="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
  >
    <svg
      class="w-5 h-5 transition-transform group-hover:scale-110"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>

    <Transition name="badge-pop">
      <span
        v-if="itemCount > 0"
        :key="itemCount"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-[10px] font-bold px-1 shadow-lg shadow-purple-500/30"
      >
        {{ itemCount > 99 ? '99+' : itemCount }}
      </span>
    </Transition>
  </NuxtLink>
</template>

<script setup lang="ts">
import {useCartStore} from '~/stores/cart'

const cartStore = useCartStore()
const itemCount = computed(() => cartStore.totalItems)
</script>
