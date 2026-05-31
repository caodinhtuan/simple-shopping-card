/**
 * GET /api/orders
 * Returns all orders with their associated items.
 */
export default defineEventHandler(() => {
  const db = getDb()

  const orders = db.prepare(`
      SELECT id,
             order_number,
             status,
             total_amount,
             payment_gateway,
             payment_id,
             customer_email,
             created_at
      FROM orders
      ORDER BY created_at DESC
  `).all() as Array<Record<string, any>>

  const getItems = db.prepare(`
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.name as product_name
      FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
  `)

  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: getItems.all(order.id).map((item: any) => ({...item})),
  }))

  return {orders: ordersWithItems}
})
