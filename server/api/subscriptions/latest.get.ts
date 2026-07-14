export default defineEventHandler((event) => {
  const query = getQuery(event)
  const email = query.email ? String(query.email) : ''
  const db = getDb()

  if (!email) return { subscription: null }

  const sub = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price, p.interval
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.customer_email = ?
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(email)

  return { subscription: sub || null }
})
