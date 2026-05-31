interface CaptureOrderBody {
  orderId: string    // PayPal order ID
  dbOrderId: number  // Database order ID
}

/**
 * POST /api/paypal/capture-order
 * Captures a previously approved PayPal order and updates the DB.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureOrderBody>(event)

  if (!body.orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PayPal order ID is required.',
    })
  }

  if (!body.dbOrderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Database order ID is required.',
    })
  }

  try {
    const captureResult = await paypalRequest<any>(
      `/v2/checkout/orders/${body.orderId}/capture`,
      'POST',
    )

    // Update the order in the database
    const db = getDb()
    db.prepare(`
      UPDATE orders
      SET status = 'paid', payment_id = ?
      WHERE id = ?
    `).run(body.orderId, body.dbOrderId)

    console.log(`[PayPal] Order ${body.dbOrderId} captured and marked as paid (PayPal ID: ${body.orderId}).`)

    return {
      status: captureResult.status,
      orderId: captureResult.id,
      payer: captureResult.payer,
    }
  } catch (error: any) {
    console.error('[PayPal] Capture order error:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to capture PayPal order: ${error.message}`,
    })
  }
})
