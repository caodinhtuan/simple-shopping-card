interface MarkActiveBody {
  planId: number
  gateway: 'stripe' | 'paypal'
  email: string
  subscriptionId?: string
}

/**
 * POST /api/subscriptions/mark-active
 * Demo-mode endpoint that creates an active subscription.
 * In real flows the webhook would do this — this is used by the
 * gateway simulator so the DB is populated correctly for demo testing.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<MarkActiveBody>(event)

  if (!body.planId) {
    throw createError({statusCode: 400, statusMessage: 'planId is required.'})
  }
  if (!body.email) {
    throw createError({statusCode: 400, statusMessage: 'email is required.'})
  }

  const db = getDb()
  const subId = body.subscriptionId || `demo_sub_${Date.now()}`
  
  // Create subscription record
  const result = db.prepare(`
    INSERT INTO subscriptions (
      plan_id, 
      status, 
      payment_gateway, 
      subscription_id, 
      customer_email, 
      current_period_start
    )
    VALUES (?, 'active', ?, ?, ?, ?)
  `).run(
    body.planId,
    body.gateway || 'stripe',
    subId,
    body.email,
    new Date().toISOString()
  )

  return {ok: true, subscriptionId: subId}
})
