/**
 * GET /api/orders/history?email=xxx
 * Returns all orders for a specific customer email.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const email = (query.email as string || '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email is required.' })
  }

  const db = getDb()

  const orders = db.prepare(`
    SELECT id, order_number, status, total_amount, payment_gateway, payment_id, created_at
    FROM orders
    WHERE LOWER(customer_email) = ?
    ORDER BY created_at DESC
  `).all(email) as any[]

  const getItems = db.prepare(`
    SELECT oi.quantity, oi.unit_price, p.name as product_name, p.category
    FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `)

  const ordersWithItems = orders.map(o => ({
    ...o,
    items: getItems.all(o.id),
  }))

  return {
    email,
    orders: ordersWithItems,
    totalSpent: orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0),
  }
})
