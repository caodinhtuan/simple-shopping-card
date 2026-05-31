import type Stripe from 'stripe'

/**
 * POST /api/stripe/webhook
 * Handles incoming Stripe webhook events.
 * Uses readRawBody for signature verification.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = getStripe()

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing request body.',
    })
  }

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing stripe-signature header.',
    })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret,
    )
  } catch (error: any) {
    console.error('[Stripe Webhook] Signature verification failed:', error.message)
    throw createError({
      statusCode: 400,
      statusMessage: `Webhook signature verification failed: ${error.message}`,
    })
  }

  const db = getDb()

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment') {
          // One-time payment completed — update order status
          const orderId = session.metadata?.order_id
          if (orderId) {
            db.prepare(`
                UPDATE orders
                SET status     = 'paid',
                    payment_id = ?
                WHERE id = ?
            `).run(session.payment_intent as string, orderId)

            console.log(`[Stripe Webhook] Order ${orderId} marked as paid (payment_intent: ${session.payment_intent}).`)
          }
        }

        if (session.mode === 'subscription') {
          console.log(`[Stripe Webhook] Subscription checkout completed for ${session.customer_email}.`)
        }

        break
      }

      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription

        // Resolve plan from the Stripe price ID
        const stripePriceId = subscription.items.data[0]?.price?.id
        const plan = db.prepare(
          'SELECT id FROM subscription_plans WHERE stripe_price_id = ?',
        ).get(stripePriceId) as { id: number } | undefined

        if (plan) {
          db.prepare(`
              INSERT INTO subscriptions (plan_id, status, payment_gateway, subscription_id, customer_email,
                                         current_period_start, current_period_end)
              VALUES (?, ?, 'stripe', ?, ?, ?, ?)
          `).run(
            plan.id,
            subscription.status,
            subscription.id,
            (subscription as any).customer_email || '',
            new Date((subscription as any).current_period_start * 1000).toISOString(),
            new Date((subscription as any).current_period_end * 1000).toISOString(),
          )

          console.log(`[Stripe Webhook] Subscription ${subscription.id} saved for plan ${plan.id}.`)
        } else {
          console.warn(`[Stripe Webhook] No matching plan found for price: ${stripePriceId}`)
        }

        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${stripeEvent.type}`)
    }
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event ${stripeEvent.type}:`, error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook handler failed.',
    })
  }

  return {received: true}
})
