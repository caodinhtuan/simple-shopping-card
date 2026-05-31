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
    throw createError({ statusCode: 400, statusMessage: 'orderId is required.' })
  }

  const db = getDb()
  const result = db.prepare(`
    UPDATE orders
       SET status = 'paid',
           payment_gateway = COALESCE(NULLIF(payment_gateway, ''), ?),
           payment_id = COALESCE(NULLIF(payment_id, ''), ?)
     WHERE id = ?
  `).run(body.gateway || 'stripe', body.paymentId || `demo_${Date.now()}`, body.orderId)

  return { ok: true, updated: result.changes }
})
