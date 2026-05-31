interface CreatePayPalSubscriptionBody {
  planId: string       // PayPal plan ID (e.g. P-PRO-DEMO)
  customerEmail: string
  dbPlanId?: number    // optional DB plan id
  interval?: 'monthly' | 'yearly'
}

/**
 * POST /api/paypal/create-subscription
 *
 * Creates a PayPal subscription via REST API.
 * Falls back to demo-mode when credentials or plan IDs are not real.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreatePayPalSubscriptionBody>(event)

  if (!body.planId) {
    throw createError({ statusCode: 400, statusMessage: 'PayPal plan ID is required.' })
  }
  if (!body.customerEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Customer email is required.' })
  }

  const config = useRuntimeConfig()
  const hasPayPalCreds =
    config.public.paypalClientId &&
    config.paypalClientSecret &&
    !String(config.public.paypalClientId).includes('xxxxx') &&
    !String(config.paypalClientSecret).includes('xxxxx')

  const isDemoPlan = body.planId.includes('DEMO')
  const interval = body.interval || 'monthly'
  const planParam = body.dbPlanId ? `&plan_id=${body.dbPlanId}` : ''
  const intervalParam = `&interval=${interval}`

  // --- Demo fallback path ---
  if (!hasPayPalCreds || isDemoPlan) {
    return {
      approveUrl: `${config.public.baseUrl}/demo/gateway?gateway=paypal&type=subscription&paypal_plan=${encodeURIComponent(body.planId)}&email=${encodeURIComponent(body.customerEmail)}${planParam}${intervalParam}`,
      subscriptionId: `DEMO-SUB-${Date.now()}`,
      demoMode: true,
    }
  }

  // --- Real PayPal subscription ---
  try {
    const subscriptionPayload = {
      plan_id: body.planId,
      subscriber: { email_address: body.customerEmail },
      custom_id: body.dbPlanId ? String(body.dbPlanId) : '',
      application_context: {
        brand_name: 'ShopPay Demo',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${config.public.baseUrl}/subscription/success?gateway=paypal&interval=${interval}`,
        cancel_url: `${config.public.baseUrl}/subscription/cancel`,
      },
    }

    const subscription = await paypalRequest<any>('/v1/billing/subscriptions', 'POST', subscriptionPayload)
    const approveLink = subscription.links?.find((l: any) => l.rel === 'approve')

    return {
      approveUrl: approveLink?.href,
      subscriptionId: subscription.id,
      demoMode: false,
    }
  } catch (error: any) {
    console.error('[PayPal] Create subscription error:', error.message)
    return {
      approveUrl: `${config.public.baseUrl}/demo/gateway?gateway=paypal&type=subscription&paypal_plan=${encodeURIComponent(body.planId)}&email=${encodeURIComponent(body.customerEmail)}${planParam}${intervalParam}&fallback=1`,
      subscriptionId: `DEMO-SUB-${Date.now()}`,
      demoMode: true,
    }
  }
})
