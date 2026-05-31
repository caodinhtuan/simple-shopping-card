/**
 * GET /api/products
 * Returns all products from the database.
 */
export default defineEventHandler(() => {
  const db = getDb()

  const products = db.prepare(`
    SELECT id, name, description, price, image_url, category, stripe_price_id, created_at
    FROM products
    ORDER BY id ASC
  `).all() as any[]

  const mapped = products.map((p) => ({ ...p }))

  return { products: mapped }
})
