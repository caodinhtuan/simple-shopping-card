import fs from 'node:fs/promises'
import path from 'node:path'

export async function logPayment(provider: 'stripe' | 'paypal', eventType: string, id: string, data: any) {
  try {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const dateStr = `${dd}-${mm}-${yyyy}`

    // Sanitize ID and Event just in case
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeEvent = eventType.replace(/[^a-zA-Z0-9_-]/g, '_')

    // Group by ID: Create a folder specifically for this ID
    const dir = path.join(process.cwd(), 'storage', 'payment', provider, dateStr, safeId)
    await fs.mkdir(dir, { recursive: true })

    const filePath = path.join(dir, `${safeEvent}.json`)
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[${provider.toUpperCase()} Webhook] Log written to ${filePath}`)
  } catch (err) {
    console.error(`[${provider.toUpperCase()} Logger] Error writing log:`, err)
  }
}
