interface RetryPaymentBody {
  orderId: number
}

/**
 * POST /api/stripe/retry-payment
 *
 * For a failed or pending order, creates a new Stripe Checkout Session.
 * Falls back to demo mode if no real Stripe key is configured.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<RetryPaymentBody>(event)

  if (!body.orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing order ID.' })
  }

  const config = useRuntimeConfig()
  const db = getDb()

  // 1. Retrieve the order
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(body.orderId) as any
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  }

  // Check if order is already paid
  if (order.status === 'paid') {
    throw createError({ statusCode: 400, statusMessage: 'Order is already paid.' })
  }

  // 2. Resolve items belonging to the order
  const items = db.prepare(`
    SELECT oi.*, p.name, p.category 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id) as any[]

  if (!items || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Order has no items.' })
  }

  // Calculating tax and total amount
  let calculatedSubtotal = 0
  for (const item of items) {
    calculatedSubtotal += item.unit_price * item.quantity
  }
  const taxAmount = Math.round(calculatedSubtotal * 0.1)
  const grandTotal = calculatedSubtotal + taxAmount

  // --- Demo-mode fallback ---
  const hasStripeKey = config.stripeSecretKey && config.stripeSecretKey.startsWith('sk_')
  if (!hasStripeKey) {
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&order_id=${order.id}&amount=${grandTotal}&type=payment`,
      sessionId: `demo_${order.order_number}`,
      demoMode: true,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  }

  // --- Real Stripe Checkout Session ---
  try {
    const stripe = getStripe()
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `${item.category || 'Product'} • ShopPay`,
        },
        unit_amount: item.unit_price,
      },
      quantity: item.quantity,
    }))

    // Add sales tax line item to match
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Sales Tax (10%)', description: 'Tax line item' },
          unit_amount: taxAmount,
        },
        quantity: 1,
      })
    }

    const expireMinutes = Number(process.env.STRIPE_LINK_EXPIRE_MINUTES) || 30
    const expiresAtTimestamp = Math.floor(Date.now() / 1000) + (expireMinutes * 60)
    const expiresAtIso = new Date(Date.now() + (expireMinutes * 60 * 1000)).toISOString()

    // Cập nhật lại thời gian hết hạn mới của đơn hàng trong Database
    db.prepare('UPDATE orders SET expires_at = ? WHERE id = ?').run(expiresAtIso, order.id)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: order.customer_email,
      line_items: lineItems,
      expires_at: expiresAtTimestamp,
      metadata: {
        order_id: String(order.id),
        order_number: order.order_number,
      },
      success_url: `${config.public.baseUrl}/checkout/success?gateway=stripe&order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.baseUrl}/checkout/cancel?order_id=${order.id}`,
    })

    return {
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  } catch (error: any) {
    console.error('[Stripe Retry] Create checkout error:', error.message)
    // Graceful fallback to demo mode
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&order_id=${order.id}&amount=${grandTotal}&type=payment&fallback=1`,
      sessionId: `demo_${order.order_number}`,
      demoMode: true,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  }
})
