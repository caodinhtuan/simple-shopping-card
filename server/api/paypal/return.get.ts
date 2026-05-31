/**
 * GET /api/paypal/return
 *
 * PayPal redirects the buyer here after they approve the one-time order.
 * We capture the order (server-side), update the DB, then redirect to the
 * success page. This makes the PayPal one-time flow symmetric with Stripe.
 *
 * Query: ?token=PAYPAL_ORDER_ID&PayerID=PAYER_ID&order_id=DB_ORDER_ID
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const paypalOrderId = String(query.token || '')   // PayPal passes order id as "token"
  const dbOrderId = query.order_id ? Number(query.order_id) : 0

  const config = useRuntimeConfig()
  const base = config.public.baseUrl

  // If something's missing, route to cancel page rather than fail silently
  if (!paypalOrderId || !dbOrderId) {
    return sendRedirect(event, `${base}/checkout/cancel?reason=missing_params`, 302)
  }

  try {
    // Capture the order — this is where PayPal actually moves the money
    const captureResult = await paypalRequest<any>(
      `/v2/checkout/orders/${paypalOrderId}/capture`,
      'POST',
    )

    const isCompleted = captureResult.status === 'COMPLETED'

    if (isCompleted) {
      const db = getDb()
      db.prepare(`
          UPDATE orders
          SET status          = 'paid',
              payment_id      = ?,
              payment_gateway = 'paypal'
          WHERE id = ?
      `).run(paypalOrderId, dbOrderId)

      console.log(`[PayPal] Order ${dbOrderId} captured successfully (${paypalOrderId}).`)
      return sendRedirect(event, `${base}/checkout/success?gateway=paypal&order_id=${dbOrderId}`, 302)
    }

    // Status pending / declined etc.
    return sendRedirect(event, `${base}/checkout/cancel?gateway=paypal&reason=capture_${captureResult.status?.toLowerCase()}`, 302)
  } catch (error: any) {
    console.error('[PayPal Return] Capture error:', error.message)
    return sendRedirect(event, `${base}/checkout/cancel?gateway=paypal&reason=capture_failed`, 302)
  }
})
