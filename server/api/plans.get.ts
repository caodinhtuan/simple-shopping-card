/**
 * GET /api/plans
 *
 * Returns the subscription plans with:
 *  - features parsed from JSON
 *  - Stripe price IDs from .env (per interval) overriding DB values
 *  - PayPal plan IDs from .env (per interval) overriding DB values
 *
 * The frontend gets back both monthly and yearly variants for each plan,
 * so the pricing toggle can pick the right ID per interval.
 */

interface PlanRow {
  id: number
  name: string
  description: string
  price: number
  interval: string
  stripe_price_id: string
  paypal_plan_id: string
  features: string | string[]
  created_at: string
}

export default defineEventHandler(() => {
  const db = getDb()
  const config = useRuntimeConfig()

  const plans = db.prepare(`
    SELECT id, name, description, price, interval, stripe_price_id, paypal_plan_id, features, created_at
    FROM subscription_plans
    ORDER BY price ASC
  `).all() as PlanRow[]

  // Build a lookup by lowercased plan name so we can pull env-configured IDs.
  // env key shape: stripePrice<Name><Interval> e.g. stripePriceProMonthly
  const stripeIdsByKey: Record<string, string> = {
    starter_monthly: config.stripePriceStarterMonthly as string,
    starter_yearly: config.stripePriceStarterYearly as string,
    pro_monthly: config.stripePriceProMonthly as string,
    pro_yearly: config.stripePriceProYearly as string,
    enterprise_monthly: config.stripePriceEnterpriseMonthly as string,
    enterprise_yearly: config.stripePriceEnterpriseYearly as string,
  }
  const paypalIdsByKey: Record<string, string> = {
    starter_monthly: config.paypalPlanStarterMonthly as string,
    starter_yearly: config.paypalPlanStarterYearly as string,
    pro_monthly: config.paypalPlanProMonthly as string,
    pro_yearly: config.paypalPlanProYearly as string,
    enterprise_monthly: config.paypalPlanEnterpriseMonthly as string,
    enterprise_yearly: config.paypalPlanEnterpriseYearly as string,
  }

  const enriched = plans.map((plan) => {
    const features = typeof plan.features === 'string'
      ? safeParseFeatures(plan.features)
      : (plan.features as string[])

    const key = plan.name.trim().toLowerCase()

    const stripeMonthly =
      stripeIdsByKey[`${key}_monthly`] || plan.stripe_price_id || `price_${key}_monthly_demo`
    const stripeYearly =
      stripeIdsByKey[`${key}_yearly`] || `price_${key}_yearly_demo`
    const paypalMonthly =
      paypalIdsByKey[`${key}_monthly`] || plan.paypal_plan_id || `P-${key.toUpperCase()}-MONTHLY-DEMO`
    const paypalYearly =
      paypalIdsByKey[`${key}_yearly`] || `P-${key.toUpperCase()}-YEARLY-DEMO`

    return {
      ...plan,
      features,
      // Monthly is the canonical price stored in DB
      price_monthly: plan.price,
      // Yearly = 12× monthly with 20% discount, in cents
      price_yearly: Math.round(plan.price * 12 * 0.8),
      stripe_price_id_monthly: stripeMonthly,
      stripe_price_id_yearly: stripeYearly,
      paypal_plan_id_monthly: paypalMonthly,
      paypal_plan_id_yearly: paypalYearly,
    }
  })

  return { plans: enriched }
})

function safeParseFeatures(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
