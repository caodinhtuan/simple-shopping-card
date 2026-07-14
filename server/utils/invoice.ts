import PDFDocument from 'pdfkit'

/**
 * Generates an invoice PDF using pdfkit and returns it as a Buffer.
 */
export function generateInvoicePdf(order: any, items: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const buffers: Buffer[] = []

      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', (err) => reject(err))

      // --- Header / Brand ---
      doc.fillColor('#1e293b').fontSize(24).text('ShopPay Inc.', 50, 50)
      doc.fontSize(10).fillColor('#64748b').text('123 Commerce Way, Tech City', 50, 80)
      doc.text('support@shoppay.demo', 50, 95)

      // Invoice metadata (top right)
      doc.fillColor('#1e293b').fontSize(18).text('INVOICE', 400, 50, { align: 'right' })
      doc.fontSize(10).fillColor('#64748b')
      doc.text(`Invoice #: ${order.order_number || 'N/A'}`, 400, 75, { align: 'right' })
      doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}`, 400, 90, { align: 'right' })
      doc.text(`Status: Paid`, 400, 105, { align: 'right' })

      doc.moveDown(3)

      // --- Bill To ---
      const billToY = 140
      doc.fillColor('#1e293b').fontSize(12).text('Bill To:', 50, billToY)
      doc.fontSize(10).fillColor('#475569')
      doc.text(order.customer_email || 'guest@shoppay.demo', 50, billToY + 18)

      doc.moveDown(2)

      // --- Table Headers ---
      const tableTop = 210
      doc.fillColor('#f8fafc').rect(50, tableTop, 500, 20).fill()
      doc.fillColor('#475569').fontSize(10)
      doc.text('Item Description', 60, tableTop + 5)
      doc.text('Price', 300, tableTop + 5, { width: 80, align: 'right' })
      doc.text('Qty', 390, tableTop + 5, { width: 40, align: 'center' })
      doc.text('Total', 450, tableTop + 5, { width: 90, align: 'right' })

      // --- Table Rows ---
      let currentY = tableTop + 20
      let subtotal = 0

      items.forEach((item) => {
        const itemTotal = item.unit_price * item.quantity
        subtotal += itemTotal

        // Draw light grey separator line
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, currentY + 20).lineTo(550, currentY + 20).stroke()

        doc.fillColor('#1e293b')
        doc.text(item.name || 'Product', 60, currentY + 6)
        doc.text(`$${(item.unit_price / 100).toFixed(2)}`, 300, currentY + 6, { width: 80, align: 'right' })
        doc.text(String(item.quantity), 390, currentY + 6, { width: 40, align: 'center' })
        doc.text(`$${(itemTotal / 100).toFixed(2)}`, 450, currentY + 6, { width: 90, align: 'right' })

        currentY += 20
      })

      // Add tax row
      const taxAmount = Math.round(subtotal * 0.1)
      const grandTotal = subtotal + taxAmount

      currentY += 10

      // Subtotal
      doc.fillColor('#475569')
      doc.text('Subtotal:', 350, currentY, { width: 100, align: 'right' })
      doc.fillColor('#1e293b')
      doc.text(`$${(subtotal / 100).toFixed(2)}`, 450, currentY, { width: 90, align: 'right' })

      // Tax (10%)
      currentY += 18
      doc.fillColor('#475569')
      doc.text('Sales Tax (10%):', 350, currentY, { width: 100, align: 'right' })
      doc.fillColor('#1e293b')
      doc.text(`$${(taxAmount / 100).toFixed(2)}`, 450, currentY, { width: 90, align: 'right' })

      // Grand Total
      currentY += 22
      doc.strokeColor('#94a3b8').lineWidth(1.5).moveTo(350, currentY).lineTo(550, currentY).stroke()

      currentY += 6
      doc.fillColor('#1e293b').fontSize(12)
      doc.text('Total Paid:', 350, currentY, { width: 100, align: 'right' })
      doc.text(`$${(grandTotal / 100).toFixed(2)}`, 450, currentY, { width: 90, align: 'right' })

      // --- Footer ---
      doc.fontSize(10).fillColor('#94a3b8').text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
