import crypto from 'crypto'

interface OrderItemInput {
  productId: number
  quantity: number
}

interface CreateOrderBody {
  items: OrderItemInput[]
  customerEmail: string
  paymentGateway: 'stripe' | 'paypal'
}

/**
 * POST /api/orders
 * Creates a new order with items.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreateOrderBody>(event)

  // --- Validation ---
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Items array is required and must not be empty.',
    })
  }

  if (!body.customerEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer email is required.',
    })
  }

  if (!body.paymentGateway || !['stripe', 'paypal'].includes(body.paymentGateway)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payment gateway must be "stripe" or "paypal".',
    })
  }

  const db = getDb()

  // Generate a unique order number
  const orderNumber = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 5)}`

  // Look up products and calculate total
  const getProduct = db.prepare('SELECT id, price FROM products WHERE id = ?')
  let totalAmount = 0
  const resolvedItems: Array<{ productId: number; quantity: number; unitPrice: number }> = []

  for (const item of body.items) {
    const product = getProduct.get(item.productId) as { id: number; price: number } | undefined
    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: `Product with id ${item.productId} not found.`,
      })
    }

    const quantity = Math.max(1, Math.floor(item.quantity))
    totalAmount += product.price * quantity
    resolvedItems.push({
      productId: product.id,
      quantity,
      unitPrice: product.price,
    })
  }

  // Insert order and items in a transaction
  const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, status, total_amount, payment_gateway, customer_email)
      VALUES (?, 'pending', ?, ?, ?)
  `)

  const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
  `)

  const createOrderTx = db.transaction(() => {
    const result = insertOrder.run(orderNumber, totalAmount, body.paymentGateway, body.customerEmail)
    const orderId = result.lastInsertRowid as number

    for (const item of resolvedItems) {
      insertItem.run(orderId, item.productId, item.quantity, item.unitPrice)
    }

    return orderId
  })

  const orderId = createOrderTx()

  // Fetch the created order
  const order = db.prepare(`
      SELECT id,
             order_number,
             status,
             total_amount,
             payment_gateway,
             payment_id,
             customer_email,
             created_at
      FROM orders
      WHERE id = ?
  `).get(orderId)

  const items = db.prepare(`
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.name as product_name
      FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
  `).all(orderId)

  return {
    order: {
      ...(order as Record<string, any>),
      items,
    },
  }
})
