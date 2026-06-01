/**
 * GET /api/orders/:id
 * Fetches details of a specific order.
 */
export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const sessionId = query.session_id as string
  const gateway = query.gateway as string

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' })
  }

  const db = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  // In a real-world scenario, we verify the session_id with the payment gateway
  // to ensure the user is authorized to view this receipt.
  if (sessionId && gateway === 'stripe') {
    const config = useRuntimeConfig()
    const hasStripeKey = config.stripeSecretKey && config.stripeSecretKey.startsWith('sk_')
    if (hasStripeKey) {
      try {
        const stripe = getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.metadata?.order_id !== String(order.id)) {
          throw createError({ statusCode: 403, statusMessage: 'Unauthorized session' })
        }
      } catch (e: any) {
        console.warn('[Order API] Stripe session verification failed:', e.message)
      }
    }
  }

  const getItems = db.prepare(`
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.name as product_name
      FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
  `)

  order.items = getItems.all(order.id)

  return { order }
})
