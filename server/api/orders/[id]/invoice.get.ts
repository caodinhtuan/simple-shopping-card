/**
 * GET /api/orders/:id/invoice
 *
 * Fetches enriched invoice data for a given order by pulling
 * additional info from Stripe or PayPal depending on the payment gateway.
 *
 * Returns:
 *  - order + items from DB
 *  - gateway-specific invoice info (charge, receipt_url, payer info, etc.)
 */
export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' })
  }

  const db = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const getItems = db.prepare(`
    SELECT oi.quantity, oi.unit_price, p.name as product_name, p.category
    FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `)
  order.items = getItems.all(order.id)

  const config = useRuntimeConfig()
  let gatewayInvoice: Record<string, any> = {}

  // ── Stripe ──────────────────────────────────────────────────────────────
  if (order.payment_gateway === 'stripe') {
    const hasKey = config.stripeSecretKey?.startsWith('sk_')
    if (hasKey && order.payment_id) {
      try {
        const stripe = getStripe()

        // payment_id on stripe orders is the Stripe PaymentIntent or Session ID.
        // Try to retrieve as PaymentIntent first (stored by webhook), then Session.
        let charge: any = null
        let receiptUrl: string | null = null
        let stripeEmail: string | null = null
        let paymentMethodDetails: any = null

        try {
          // Attempt: retrieve the PaymentIntent directly
          const pi = await stripe.paymentIntents.retrieve(order.payment_id, {
            expand: ['latest_charge'],
          })
          charge = (pi as any).latest_charge
          receiptUrl = charge?.receipt_url ?? null
          stripeEmail = pi.receipt_email ?? order.customer_email
          paymentMethodDetails = charge?.payment_method_details
        } catch {
          // Fallback: retrieve by checkout session (payment_id may be session id)
          try {
            const session = await stripe.checkout.sessions.retrieve(order.payment_id, {
              expand: ['payment_intent.latest_charge'],
            })
            const pi = session.payment_intent as any
            charge = pi?.latest_charge
            receiptUrl = charge?.receipt_url ?? null
            stripeEmail = session.customer_email ?? order.customer_email
            paymentMethodDetails = charge?.payment_method_details
          } catch {
            // Neither worked — use DB data only
          }
        }

        gatewayInvoice = {
          provider: 'Stripe',
          receipt_url: receiptUrl,
          customer_email: stripeEmail,
          payment_method: paymentMethodDetails?.type ?? null,
          card_brand: paymentMethodDetails?.card?.brand ?? null,
          card_last4: paymentMethodDetails?.card?.last4 ?? null,
          charge_id: charge?.id ?? null,
          currency: charge?.currency?.toUpperCase() ?? 'USD',
        }
      } catch (e: any) {
        console.warn('[Invoice] Stripe fetch error:', e.message)
        gatewayInvoice = { provider: 'Stripe', error: 'Could not fetch Stripe invoice' }
      }
    } else {
      gatewayInvoice = { provider: 'Stripe', demo: true }
    }
  }

  // ── PayPal ───────────────────────────────────────────────────────────────
  if (order.payment_gateway === 'paypal') {
    const hasCreds =
      config.public.paypalClientId &&
      config.paypalClientSecret &&
      !String(config.public.paypalClientId).includes('xxxxx')

    if (hasCreds && order.payment_id) {
      try {
        // order.payment_id stores the PayPal Order ID (set during capture)
        const paypalOrder = await paypalRequest<any>(`/v2/checkout/orders/${order.payment_id}`, 'GET')
        const capture = paypalOrder?.purchase_units?.[0]?.payments?.captures?.[0]

        gatewayInvoice = {
          provider: 'PayPal',
          paypal_order_id: paypalOrder.id,
          status: paypalOrder.status,
          payer_email: paypalOrder.payer?.email_address ?? order.customer_email,
          payer_name: [
            paypalOrder.payer?.name?.given_name,
            paypalOrder.payer?.name?.surname,
          ].filter(Boolean).join(' ') || null,
          capture_id: capture?.id ?? null,
          currency: capture?.amount?.currency_code ?? 'USD',
          capture_status: capture?.status ?? null,
        }
      } catch (e: any) {
        console.warn('[Invoice] PayPal fetch error:', e.message)
        gatewayInvoice = { provider: 'PayPal', error: 'Could not fetch PayPal invoice' }
      }
    }
  }

  // ── Query real database invoice if exists ───────────────────────────────
  const dbInvoice = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(order.id) as any
  if (dbInvoice) {
    const getInvoiceItems = db.prepare(`
      SELECT id_detail.*, p.name as product_name, p.category
      FROM invoice_details id_detail
      LEFT JOIN products p ON id_detail.product_id = p.id
      WHERE id_detail.invoice_id = ?
    `)
    dbInvoice.items = getInvoiceItems.all(dbInvoice.id)
  }

  return { order, gatewayInvoice, invoice: dbInvoice || null }
})
