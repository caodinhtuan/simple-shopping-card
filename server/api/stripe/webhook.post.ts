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

        console.log('[Stripe Webhook] Successful Payment Info:', JSON.stringify(session, null, 2))
        await logPayment('stripe', stripeEvent.type, session.id, session)

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

            // --- Generate Invoice PDF and Send Email ---
            try {
              const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
              if (order) {
                const items = db.prepare(`
                  SELECT oi.*, p.name, p.category 
                  FROM order_items oi
                  JOIN products p ON oi.product_id = p.id
                  WHERE oi.order_id = ?
                `).all(order.id) as any[]

                // --- Save invoice and details into SQLite ---
                const invoiceNumber = `INV-${order.order_number.replace('ORD-', '')}`
                const insertInvoice = db.prepare(`
                  INSERT INTO invoices (order_id, invoice_number, status, amount, payment_gateway, payment_id, customer_email, expires_at)
                  VALUES (?, ?, 'paid', ?, 'stripe', ?, ?, ?)
                `)
                const insertInvoiceDetail = db.prepare(`
                  INSERT INTO invoice_details (invoice_id, product_id, quantity, unit_price)
                  VALUES (?, ?, ?, ?)
                `)

                db.transaction(() => {
                  const exists = db.prepare('SELECT id FROM invoices WHERE order_id = ?').get(order.id)
                  if (!exists) {
                    const invResult = insertInvoice.run(
                      order.id,
                      invoiceNumber,
                      order.total_amount,
                      (session.payment_intent as string) || '',
                      order.customer_email,
                      order.expires_at
                    )
                    const invId = invResult.lastInsertRowid as number
                    for (const item of items) {
                      insertInvoiceDetail.run(invId, item.product_id, item.quantity, item.unit_price)
                    }
                  }
                })()

                const pdfBuffer = await generateInvoicePdf(order, items)
                await sendInvoiceEmail(order.customer_email, order.order_number, pdfBuffer)
              }
            } catch (err: any) {
              console.error('[Stripe Webhook] Failed to generate or send invoice:', err.message)
            }
          }
        }

        if (session.mode === 'subscription') {
          console.log(`[Stripe Webhook] Subscription checkout completed for ${session.customer_email}.`)
        }

        break
      }

      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription

        console.log('[Stripe Webhook] Successful Subscription Info:', JSON.stringify(subscription, null, 2))
        await logPayment('stripe', stripeEvent.type, subscription.id, subscription)

        // Resolve plan from the Stripe price ID
        const stripePriceId = subscription.items.data[0]?.price?.id
        let planId: number | undefined = undefined

        if (stripePriceId) {
          if (stripePriceId === config.stripePriceStarterMonthly || stripePriceId === config.stripePriceStarterYearly) planId = 1
          else if (stripePriceId === config.stripePriceProMonthly || stripePriceId === config.stripePriceProYearly) planId = 2
          else if (stripePriceId === config.stripePriceEnterpriseMonthly || stripePriceId === config.stripePriceEnterpriseYearly) planId = 3
          else {
            const plan = db.prepare('SELECT id FROM subscription_plans WHERE stripe_price_id = ?').get(stripePriceId) as { id: number } | undefined
            planId = plan?.id
          }
        }

        if (planId) {
          // Fetch customer email from Stripe
          let customerEmail = ''
          try {
            if (typeof subscription.customer === 'string') {
              const customer = await stripe.customers.retrieve(subscription.customer)
              if (!customer.deleted && customer.email) {
                customerEmail = customer.email
              }
            }
          } catch (e) {
            console.warn('[Stripe Webhook] Could not fetch customer email:', e)
          }

          upsertSubscription(db, subscription, planId, customerEmail)
        } else {
          console.warn(`[Stripe Webhook] No matching plan found for price: ${stripePriceId}`)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        await logPayment('stripe', stripeEvent.type, session.id, session)

        if (session.mode === 'payment') {
          const orderId = session.metadata?.order_id
          if (orderId) {
            db.prepare(`
                UPDATE orders
                SET status = 'cancelled'
                WHERE id = ? AND status = 'pending'
            `).run(orderId)
            console.log(`[Stripe Webhook] Order ${orderId} marked as cancelled (expired).`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        await logPayment('stripe', stripeEvent.type, subscription.id, subscription)

        // Resolve plan from the Stripe price ID
        const stripePriceId = subscription.items.data[0]?.price?.id
        let planId = 1
        if (stripePriceId) {
          if (stripePriceId === config.stripePriceStarterMonthly || stripePriceId === config.stripePriceStarterYearly) planId = 1
          else if (stripePriceId === config.stripePriceProMonthly || stripePriceId === config.stripePriceProYearly) planId = 2
          else if (stripePriceId === config.stripePriceEnterpriseMonthly || stripePriceId === config.stripePriceEnterpriseYearly) planId = 3
          else {
            const plan = db.prepare('SELECT id FROM subscription_plans WHERE stripe_price_id = ?').get(stripePriceId) as { id: number } | undefined
            if (plan) planId = plan.id
          }
        }

        let customerEmail = ''
        try {
          if (typeof subscription.customer === 'string') {
            const customer = await stripe.customers.retrieve(subscription.customer)
            if (!customer.deleted && customer.email) {
              customerEmail = customer.email
            }
          }
        } catch (e) {
          console.warn('[Stripe Webhook] Could not fetch customer email:', e)
        }

        upsertSubscription(db, subscription, planId, customerEmail)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        await logPayment('stripe', stripeEvent.type, subscription.id, subscription)

        db.prepare(`
            UPDATE subscriptions
            SET status = 'canceled'
            WHERE subscription_id = ?
        `).run(subscription.id)
        console.log(`[Stripe Webhook] Subscription ${subscription.id} deleted.`)
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

/**
 * Handles Webhook Race Condition gracefully via check-and-upsert logic.
 */
function upsertSubscription(db: any, subscription: any, planId: number, customerEmail: string) {
  const existing = db.prepare('SELECT id, status FROM subscriptions WHERE subscription_id = ?').get(subscription.id) as { id: number; status: string } | undefined

  const startTimestamp = subscription.current_period_start || subscription.billing_cycle_anchor || subscription.start_date || subscription.created || Math.floor(Date.now() / 1000)
  const endTimestamp = subscription.current_period_end || (startTimestamp + 30 * 24 * 60 * 60)

  const startIso = new Date(startTimestamp * 1000).toISOString()
  const endIso = new Date(endTimestamp * 1000).toISOString()

  if (existing) {
    // If the database has already been updated to 'active', do NOT downgrade it back to 'incomplete'
    const nextStatus = (existing.status === 'active' && subscription.status === 'incomplete') ? 'active' : subscription.status

    db.prepare(`
        UPDATE subscriptions
        SET status = ?,
            current_period_start = ?,
            current_period_end = ?
        WHERE id = ?
    `).run(nextStatus, startIso, endIso, existing.id)
    console.log(`[Stripe Webhook Concurrency] Subscription ${subscription.id} updated to status: ${nextStatus} (merged).`)
  } else {
    // Insert new record
    db.prepare(`
        INSERT INTO subscriptions (plan_id, status, payment_gateway, subscription_id, customer_email,
                                   current_period_start, current_period_end)
        VALUES (?, ?, 'stripe', ?, ?, ?, ?)
    `).run(
      planId,
      subscription.status,
      subscription.id,
      customerEmail,
      startIso,
      endIso
    )
    console.log(`[Stripe Webhook Concurrency] Subscription ${subscription.id} saved fresh with status: ${subscription.status}.`)
  }
}
