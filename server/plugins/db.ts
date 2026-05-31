/**
 * Server plugin that initializes the SQLite database on server startup.
 */
export default defineNitroPlugin(() => {
  const db = getDb()
  console.log('[Plugin] Database initialized successfully.')
})
