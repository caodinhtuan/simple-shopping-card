<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-bold text-slate-100 mb-4">Payment Method</h3>
    <n-tabs
      :value="gateway"
      type="segment"
      animated
      @update:value="(val: string) => $emit('select', val)"
    >
      <n-tab-pane name="stripe" tab="💳 Stripe">
        <div class="pt-4">
          <StripeCheckoutButton
            :disabled="disabled"
            :loading="loading"
            @click="$emit('select', 'stripe')"
          />
          <p class="text-slate-500 text-xs mt-3 text-center">
            Pay securely with credit/debit card via Stripe
          </p>
        </div>
      </n-tab-pane>
      <n-tab-pane name="paypal" tab="🅿️ PayPal">
        <div class="pt-4">
          <PayPalCheckoutButton
            :disabled="disabled"
            :loading="loading"
            @click="$emit('select', 'paypal')"
          />
          <p class="text-slate-500 text-xs mt-3 text-center">
            Pay securely with your PayPal account
          </p>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import StripeCheckoutButton from "~/components/checkout/StripeCheckoutButton.vue";

defineProps<{
  gateway: string
  disabled?: boolean
  loading?: boolean
}>()

defineEmits<{
  select: [gateway: string]
}>()
</script>
