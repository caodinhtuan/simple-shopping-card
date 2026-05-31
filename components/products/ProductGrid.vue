<template>
  <div>
    <div v-if="products.length === 0" class="flex items-center justify-center py-20">
      <n-empty description="No products found" size="large"/>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
          v-for="(product, index) in products"
          :key="product.id"
          :class="`stagger-${Math.min(index + 1, 8)}`"
          class="animate-in"
      >
        <ProductCard :product="product"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ProductCard from "~/components/products/ProductCard.vue";

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  category?: string
}

defineProps<{
  products: Product[]
}>()
</script>
