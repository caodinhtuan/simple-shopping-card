import { ref } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'

export function useStripe() {
  const stripe = ref<Stripe | null>(null)
  const isLoading = ref(false)

  async function initStripe() {
    if (stripe.value) return stripe.value

    const config = useRuntimeConfig()
    const publishableKey = config.public.stripePublishableKey as string

    if (!publishableKey) {
      console.warn('Stripe publishable key is not configured')
      return null
    }

    isLoading.value = true
    try {
      stripe.value = await loadStripe(publishableKey)
      return stripe.value
    } catch (error) {
      console.error('Failed to load Stripe:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    stripe,
    isLoading,
    initStripe,
  }
}
