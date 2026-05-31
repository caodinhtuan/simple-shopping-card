import crypto from 'crypto'

interface CartItemInput {
  id: number
  quantity: number
}

interface CreatePayPalOrderBody {
  items: CartItemInput[]
  customerEmail?: string
}

/**
 * POST /api/paypal/create-order
 *
 * Cart → PayPal one-time payment.
 * Accepts lean cart payload, looks up products, creates an order in the DB,
 * then opens a PayPal order with an approve URL.
 *
 * Falls back to demo mode when PayPal credentials are absent.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreatePayPalOrderBody>(event)

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cart is empty.' })
  }

  const config = useRuntimeConfig()
  const db = getDb()

  // --- Resolve products from DB ---
  const getProduct = db.prepare('SELECT id, name, price FROM products WHERE id = ?')
  const resolved: Array<{ id: number; name: string; price: number; quantity: number }> = []
  let subtotal = 0

  for (const item of body.items) {
    const product = getProduct.get(item.id) as { id: number; name: string; price: number } | undefined
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: `Product #${item.id} not found.` })
    }
    const quantity = Math.max(1, Math.floor(item.quantity))
    subtotal += product.price * quantity
    resolved.push({ ...product, quantity })
  }

  const taxAmount = Math.round(subtotal * 0.1)
  const grandTotal = subtotal + taxAmount
  const customerEmail = body.customerEmail || 'guest@shoppay.demo'

  // --- Create pending order ---
  const orderNumber = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, status, total_amount, payment_gateway, customer_email)
    VALUES (?, 'pending', ?, 'paypal', ?)
  `)
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `)

  const orderId = db.transaction(() => {
    const result = insertOrder.run(orderNumber, grandTotal, customerEmail)
    const oid = result.lastInsertRowid as number
    for (const it of resolved) {
      insertItem.run(oid, it.id, it.quantity, it.price)
    }
    return oid
  })()

  // --- Demo-mode fallback (no real PayPal credentials) ---
  const hasPayPalCreds =
    config.public.paypalClientId &&
    config.paypalClientSecret &&
    !String(config.public.paypalClientId).includes('xxxxx') &&
    !String(config.paypalClientSecret).includes('xxxxx')

  if (!hasPayPalCreds) {
    return {
      approvalUrl: `${config.public.baseUrl}/demo/gateway?gateway=paypal&order_id=${orderId}&amount=${grandTotal}&type=payment`,
      orderId,
      orderNumber,
      paypalOrderId: `DEMO-${orderNumber}`,
      demoMode: true,
    }
  }

  // --- Real PayPal create order ---
  try {
    const totalDollars = (grandTotal / 100).toFixed(2)
    const subtotalDollars = (subtotal / 100).toFixed(2)
    const taxDollars = (taxAmount / 100).toFixed(2)

    const purchaseItems = resolved.map((it) => ({
      name: it.name.slice(0, 127),
      quantity: String(it.quantity),
      unit_amount: { currency_code: 'USD', value: (it.price / 100).toFixed(2) },
    }))

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(orderId),
          custom_id: String(orderId),
          amount: {
            currency_code: 'USD',
            value: totalDollars,
            breakdown: {
              item_total: { currency_code: 'USD', value: subtotalDollars },
              tax_total: { currency_code: 'USD', value: taxDollars },
            },
          },
          items: purchaseItems,
        },
      ],
      application_context: {
        brand_name: 'ShopPay Demo',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${config.public.baseUrl}/api/paypal/return?order_id=${orderId}`,
        cancel_url: `${config.public.baseUrl}/checkout/cancel?order_id=${orderId}`,
      },
    }

    const paypalOrder = await paypalRequest<any>('/v2/checkout/orders', 'POST', orderPayload)
    const approveLink = paypalOrder.links?.find((l: any) => l.rel === 'approve')

    // Persist the PayPal order id for later capture
    db.prepare('UPDATE orders SET payment_id = ? WHERE id = ?').run(paypalOrder.id, orderId)

    return {
      approvalUrl: approveLink?.href,
      orderId,
      orderNumber,
      paypalOrderId: paypalOrder.id,
      demoMode: false,
    }
  } catch (error: any) {
    console.error('[PayPal] Create order error:', error.message)
    // Graceful fallback
    return {
      approvalUrl: `${config.public.baseUrl}/demo/gateway?gateway=paypal&order_id=${orderId}&amount=${grandTotal}&type=payment&fallback=1`,
      orderId,
      orderNumber,
      paypalOrderId: `DEMO-${orderNumber}`,
      demoMode: true,
    }
  }
})
