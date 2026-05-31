interface CreateSubscriptionBody {
  priceId: string
  customerEmail: string
  planId?: number
  interval?: 'monthly' | 'yearly'
}

/**
 * POST /api/stripe/create-subscription
 *
 * Creates a Stripe Checkout Session in subscription mode.
 * Falls back to demo-mode when:
 *  - No Stripe secret key is configured
 *  - The price ID is one of the seeded demo IDs (won't exist in Stripe Dashboard)
 *  - Stripe rejects the price for any reason
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreateSubscriptionBody>(event)

  if (!body.priceId) {
    throw createError({ statusCode: 400, statusMessage: 'Price ID is required.' })
  }

  if (!body.customerEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Customer email is required.' })
  }

  const config = useRuntimeConfig()
  const hasStripeKey = config.stripeSecretKey && config.stripeSecretKey.startsWith('sk_')
  const isDemoPrice = body.priceId.includes('_demo') || body.priceId.endsWith('_demo')

  const interval = body.interval || 'monthly'
  const planParam = body.planId ? `&plan_id=${body.planId}` : ''
  const intervalParam = `&interval=${interval}`

  // --- Demo fallback path ---
  if (!hasStripeKey || isDemoPrice) {
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&type=subscription&price_id=${encodeURIComponent(body.priceId)}&email=${encodeURIComponent(body.customerEmail)}${planParam}${intervalParam}`,
      sessionId: `demo_sub_${Date.now()}`,
      demoMode: true,
    }
  }

  // --- Real Stripe subscription ---
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: body.customerEmail,
      line_items: [{ price: body.priceId, quantity: 1 }],
      metadata: {
        plan_id: body.planId ? String(body.planId) : '',
        interval,
      },
      success_url: `${config.public.baseUrl}/subscription/success?gateway=stripe&interval=${interval}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.baseUrl}/subscription/cancel`,
    })

    return { url: session.url, sessionId: session.id, demoMode: false }
  } catch (error: any) {
    console.error('[Stripe] Create subscription error:', error.message)
    // Fall back to demo flow if Stripe rejects
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&type=subscription&price_id=${encodeURIComponent(body.priceId)}&email=${encodeURIComponent(body.customerEmail)}${planParam}${intervalParam}&fallback=1`,
      sessionId: `demo_sub_${Date.now()}`,
      demoMode: true,
    }
  }
})
