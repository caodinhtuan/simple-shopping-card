import crypto from 'crypto'

interface CartItemInput {
  id: number
  quantity: number
}

interface CreateCheckoutBody {
  items: CartItemInput[]
  customerEmail?: string
}

/**
 * POST /api/stripe/create-checkout
 *
 * Cart → Stripe Checkout (one-time payment).
 * Accepts lean cart payload, looks up products, creates an order in the DB,
 * then opens a Stripe Checkout Session.
 *
 * Falls back to a demo-mode redirect when no real Stripe key is configured.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreateCheckoutBody>(event)

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw createError({statusCode: 400, statusMessage: 'Cart is empty.'})
  }

  const config = useRuntimeConfig()
  const db = getDb()

  // --- Resolve products from DB ---
  const getProduct = db.prepare('SELECT id, name, price, category FROM products WHERE id = ?')
  const resolved: Array<{ id: number; name: string; price: number; quantity: number; category: string }> = []
  let totalAmount = 0

  for (const item of body.items) {
    const product = getProduct.get(item.id) as
      | { id: number; name: string; price: number; category: string }
      | undefined

    if (!product) {
      throw createError({statusCode: 404, statusMessage: `Product #${item.id} not found.`})
    }
    const quantity = Math.max(1, Math.floor(item.quantity))
    totalAmount += product.price * quantity
    resolved.push({...product, quantity})
  }

  // 10% tax — same as the UI shows
  const taxAmount = Math.round(totalAmount * 0.1)
  const grandTotal = totalAmount + taxAmount
  const customerEmail = body.customerEmail || 'guest@shoppay.demo'

  const expireMinutes = Number(process.env.STRIPE_LINK_EXPIRE_MINUTES) || 30
  const expiresAtTimestamp = Math.floor(Date.now() / 1000) + (expireMinutes * 60)
  const expiresAtIso = new Date(Date.now() + (expireMinutes * 60 * 1000)).toISOString()

  // --- Create pending order ---
  const orderNumber = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, status, total_amount, payment_gateway, customer_email, expires_at)
      VALUES (?, 'pending', ?, 'stripe', ?, ?)
  `)
  const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
  `)

  const orderId = db.transaction(() => {
    const result = insertOrder.run(orderNumber, grandTotal, customerEmail, expiresAtIso)
    const oid = result.lastInsertRowid as number
    for (const it of resolved) {
      insertItem.run(oid, it.id, it.quantity, it.price)
    }
    return oid
  })()

  // --- Demo-mode fallback (no real Stripe key) ---
  const hasStripeKey = config.stripeSecretKey && config.stripeSecretKey.startsWith('sk_')
  if (!hasStripeKey) {
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&order_id=${orderId}&amount=${grandTotal}&type=payment`,
      sessionId: `demo_${orderNumber}`,
      demoMode: true,
      orderId,
      orderNumber,
    }
  }

  // --- Real Stripe Checkout Session ---
  try {
    const stripe = getStripe()
    const lineItems = resolved.map((p) => ({
      price_data: {
        currency: 'usd',
        product_data: {name: p.name, description: `${p.category} • ShopPay`},
        unit_amount: p.price,
      },
      quantity: p.quantity,
    }))

    // Add tax as a separate line item to match the UI total
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {name: 'Sales Tax (10%)', description: 'Demo tax line item'},
          unit_amount: taxAmount,
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: lineItems,
      expires_at: expiresAtTimestamp,
      metadata: {order_id: String(orderId), order_number: orderNumber},
      success_url: `${config.public.baseUrl}/checkout/success?gateway=stripe&order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.baseUrl}/checkout/cancel?order_id=${orderId}`,
    })

    return {
      url: session.url,
      sessionId: session.id,
      orderId,
      orderNumber,
    }
  } catch (error: any) {
    console.error('[Stripe] Create checkout error:', error.message)
    // Graceful fallback to demo mode when Stripe rejects
    return {
      url: `${config.public.baseUrl}/demo/gateway?gateway=stripe&order_id=${orderId}&amount=${grandTotal}&type=payment&fallback=1`,
      sessionId: `demo_${orderNumber}`,
      demoMode: true,
      orderId,
      orderNumber,
    }
  }
})
