/**
 * GET /api/admin/overview
 * Returns all orders and subscriptions with joined data for the admin dashboard.
 */
export default defineEventHandler(() => {
  const db = getDb()

  // Orders with items
  const orders = db.prepare(`
    SELECT o.id, o.order_number, o.status, o.total_amount,
           o.payment_gateway, o.payment_id, o.customer_email, o.created_at
    FROM orders o
    ORDER BY o.created_at DESC
  `).all() as any[]

  const getItems = db.prepare(`
    SELECT oi.quantity, oi.unit_price, p.name as product_name
    FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `)

  const ordersWithItems = orders.map(o => ({
    ...o,
    items: getItems.all(o.id),
  }))

  // Subscriptions with plan info
  const subscriptions = db.prepare(`
    SELECT s.id, s.plan_id, s.status, s.payment_gateway,
           s.subscription_id, s.customer_email,
           s.current_period_start, s.current_period_end, s.created_at,
           sp.name as plan_name, sp.price as plan_price
    FROM subscriptions s
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ORDER BY s.created_at DESC
  `).all()

  // Stats
  const totalRevenue = orders
    .filter(o => o.status === 'paid')
    .reduce((sum: number, o: any) => sum + o.total_amount, 0)

  const activeSubsCount = (subscriptions as any[]).filter(s => s.status === 'active').length
  const paidOrdersCount = orders.filter(o => o.status === 'paid').length

  return {
    orders: ordersWithItems,
    subscriptions,
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      paidOrders: paidOrdersCount,
      activeSubscriptions: activeSubsCount,
    },
  }
})
