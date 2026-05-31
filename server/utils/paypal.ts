/**
 * Returns the PayPal API base URL depending on the configured mode.
 */
export function getPayPalBaseUrl(): string {
  const config = useRuntimeConfig()
  return config.paypalMode === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

/**
 * Fetches an OAuth 2.0 access token from PayPal using client credentials.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const config = useRuntimeConfig()
  const baseUrl = getPayPalBaseUrl()

  const clientId = config.public.paypalClientId
  const clientSecret = config.paypalClientSecret

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal client credentials. Set NUXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`PayPal OAuth failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Makes an authenticated request to the PayPal REST API.
 */
export async function paypalRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, any>,
): Promise<T> {
  const baseUrl = getPayPalBaseUrl()
  const accessToken = await getPayPalAccessToken()

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options)

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`PayPal API error (${response.status}) ${method} ${endpoint}: ${errorBody}`)
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
