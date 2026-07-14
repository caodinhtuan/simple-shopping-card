interface MarkPaidBody {
  orderId: number
  gateway: 'stripe' | 'paypal'
  paymentId?: string
}

/**
 * POST /api/orders/mark-paid
 * Demo-mode endpoint that flips a pending order to "paid".
 * In real flows the webhook would do this — this is used by the
 * gateway simulator so the success page can render real DB data.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<MarkPaidBody>(event)

  if (!body.orderId) {
    throw createError({statusCode: 400, statusMessage: 'orderId is required.'})
  }

  const db = getDb()
  const result = db.prepare(`
      UPDATE orders
      SET status          = 'paid',
          payment_gateway = COALESCE(NULLIF(payment_gateway, ''), ?),
          payment_id      = COALESCE(NULLIF(payment_id, ''), ?)
      WHERE id = ?
  `).run(body.gateway || 'stripe', body.paymentId || `demo_${Date.now()}`, body.orderId)

  // --- Generate Invoice PDF and Send Email for Demo/Sandbox testing ---
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(body.orderId) as any
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
        VALUES (?, ?, 'paid', ?, ?, ?, ?, ?)
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
            body.gateway || 'stripe',
            body.paymentId || `demo_${Date.now()}`,
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
    console.error('[Demo Mark-Paid] Failed to generate or send invoice:', err.message)
  }

  return {ok: true, updated: result.changes}
})
