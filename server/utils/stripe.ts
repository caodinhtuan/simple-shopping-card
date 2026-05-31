import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

/**
 * Returns the singleton Stripe instance, initialized with the
 * secret key from runtimeConfig.
 */
export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const config = useRuntimeConfig()

  if (!config.stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in runtime config. Please set the environment variable.')
  }

  stripeInstance = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  return stripeInstance
}
