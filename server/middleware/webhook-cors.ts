/**
 * server/middleware/webhook-cors.ts
 *
 * Allows PayPal and Stripe to POST webhook events to this server
 * from external origins (e.g. ngrok forwarded requests).
 *
 * Nuxt 3 enables CORS/CSRF origin checking by default for non-GET routes,
 * which causes 403 Forbidden when PayPal/Stripe servers hit the endpoint.
 * This middleware explicitly allows webhook routes to bypass that check.
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const isWebhook =
    url.pathname === '/api/stripe/webhook' ||
    url.pathname === '/api/paypal/webhook'

  if (!isWebhook) return

  // Set CORS headers so external servers (PayPal, Stripe) can POST freely
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': [
      'content-type',
      'stripe-signature',
      'paypal-transmission-id',
      'paypal-transmission-time',
      'paypal-cert-url',
      'paypal-auth-algo',
      'paypal-transmission-sig',
      'ngrok-skip-browser-warning',
    ].join(', '),
    // Tell ngrok free tier to skip the browser warning interstitial page
    'ngrok-skip-browser-warning': 'true',
  })

  // Handle preflight OPTIONS quickly
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
  }
})
