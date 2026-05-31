/**
 * POST /api/paypal/webhook
 * Handles incoming PayPal webhook events.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)

  if (!body || !body.event_type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid webhook payload.',
    })
  }

  // In production, verify the webhook signature using PayPal's API
  // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature_post
  // For now, we log and process the event.
  const config = useRuntimeConfig()
  if (config.paypalWebhookId) {
    // Optional: Verify webhook signature via PayPal API
    try {
      const transmissionId = getHeader(event, 'paypal-transmission-id')
      const transmissionTime = getHeader(event, 'paypal-transmission-time')
      const certUrl = getHeader(event, 'paypal-cert-url')
      const authAlgo = getHeader(event, 'paypal-auth-algo')
      const transmissionSig = getHeader(event, 'paypal-transmission-sig')

      if (transmissionId && transmissionSig) {
        const verificationResult = await paypalRequest<any>(
          '/v1/notifications/verify-webhook-signature',
          'POST',
          {
            auth_algo: authAlgo,
            cert_url: certUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: config.paypalWebhookId,
            webhook_event: body,
          },
        )

        if (verificationResult.verification_status !== 'SUCCESS') {
          console.warn('[PayPal Webhook] Signature verification failed.')
          throw createError({
            statusCode: 400,
            statusMessage: 'Webhook signature verification failed.',
          })
        }
      }
    } catch (error: any) {
      console.error('[PayPal Webhook] Verification error:', error.message)
      // In development, you may choose to continue processing
    }
  }

  const db = getDb()

  try {
    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const resource = body.resource
        const paypalPlanId = resource?.plan_id
        const subscriptionId = resource?.id
        const subscriberEmail = resource?.subscriber?.email_address || ''

        // Look up the plan in the DB
        const plan = db.prepare(
          'SELECT id FROM subscription_plans WHERE paypal_plan_id = ?',
        ).get(paypalPlanId) as { id: number } | undefined

        if (plan) {
          const startTime = resource?.billing_info?.last_payment?.time
            || resource?.start_time
            || new Date().toISOString()

          // Check if subscription already exists
          const existing = db.prepare(
            'SELECT id FROM subscriptions WHERE subscription_id = ? AND payment_gateway = ?',
          ).get(subscriptionId, 'paypal')

          if (!existing) {
            db.prepare(`
              INSERT INTO subscriptions (plan_id, status, payment_gateway, subscription_id, customer_email, current_period_start)
              VALUES (?, 'active', 'paypal', ?, ?, ?)
            `).run(plan.id, subscriptionId, subscriberEmail, startTime)

            console.log(`[PayPal Webhook] Subscription ${subscriptionId} activated for plan ${plan.id}.`)
          } else {
            db.prepare(`
              UPDATE subscriptions SET status = 'active' WHERE subscription_id = ? AND payment_gateway = 'paypal'
            `).run(subscriptionId)

            console.log(`[PayPal Webhook] Subscription ${subscriptionId} status updated to active.`)
          }
        } else {
          console.warn(`[PayPal Webhook] No matching plan for PayPal plan ID: ${paypalPlanId}`)
        }

        break
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = body.resource
        const captureId = resource?.id
        const customId = resource?.custom_id // We can set this to our order ID

        // Try to find order by payment_id (PayPal order ID stored during capture)
        // or by custom_id if set
        if (customId) {
          db.prepare(`
            UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'
          `).run(customId)

          console.log(`[PayPal Webhook] Payment captured for order ${customId} (capture: ${captureId}).`)
        } else {
          console.log(`[PayPal Webhook] Payment capture completed (capture: ${captureId}), no custom_id to match.`)
        }

        break
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${body.event_type}`)
    }
  } catch (error: any) {
    console.error(`[PayPal Webhook] Error processing ${body.event_type}:`, error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook handler failed.',
    })
  }

  return { received: true }
})
