<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="text-center mb-10 animate-in stagger-1">
      <h1 class="section-title text-3xl sm:text-4xl mb-3">
        <span class="gradient-text">{{ t('products.title') }}</span>
      </h1>
      <p class="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
        {{ t('products.subtitle') }}
      </p>
    </div>

    <!-- Filter Bar -->
    <div v-if="!pending && !error" class="mb-8 animate-in stagger-2">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div class="flex-1">
          <n-input
            v-model:value="searchQuery"
            :placeholder="t('products.search_placeholder')"
            size="large"
            clearable
          >
            <template #prefix>
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </template>
          </n-input>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn-reset px-3.5 py-2 rounded-[10px] text-[13px] font-medium whitespace-nowrap border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            :class="selectedCategory === ''
              ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-200 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]'
              : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.12]'"
            @click="selectedCategory = ''"
          >
            {{ t('products.filter_all') }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            class="btn-reset px-3.5 py-2 rounded-[10px] text-[13px] font-medium whitespace-nowrap border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            :class="selectedCategory === cat
              ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-200 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]'
              : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.12]'"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <p v-if="filteredProducts.length !== products.length" class="text-xs text-slate-500 mt-3">
        {{ t('products.showing', { n: filteredProducts.length, total: products.length }) }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="h-[360px] rounded-2xl border border-white/[0.05] skeleton-shimmer" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-20">
      <n-result
        status="error"
        :title="t('products.error_title')"
        :description="error.message || ''"
      >
        <template #footer>
          <n-button type="primary" @click="refresh()">{{ t('products.try_again') }}</n-button>
        </template>
      </n-result>
    </div>

    <!-- Empty filter result -->
    <div v-else-if="filteredProducts.length === 0" class="flex items-center justify-center py-20 animate-in">
      <div class="text-center">
        <div class="text-5xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-slate-200 mb-1">{{ t('products.empty_title') }}</h3>
        <p class="text-sm text-slate-500 mb-4">{{ t('products.empty_desc') }}</p>
        <n-button size="small" @click="clearFilters">{{ t('products.empty_action') }}</n-button>
      </div>
    </div>

    <!-- Products grid -->
    <div v-else class="animate-in stagger-3">
      <ProductGrid :products="filteredProducts" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NResult } from 'naive-ui'
import ProductGrid from '~/components/products/ProductGrid.vue'

const { t } = useI18n()
useHead({ title: 'Products — ShopPay' })

const searchQuery = ref('')
const selectedCategory = ref('')

const { data: products, pending, error, refresh } = await useFetch<any[]>('/api/products', {
  transform: (res: any) => res.products || [],
  default: () => [],
})

const categories = computed(() => {
  const set = new Set<string>()
  for (const p of products.value || []) {
    if (p.category) set.add(p.category)
  }
  return Array.from(set).sort()
})

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return (products.value || []).filter((p: any) => {
    if (selectedCategory.value && p.category !== selectedCategory.value) return false
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  })
})

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
}
</script>
