import nodemailer from 'nodemailer'

/**
 * Sends an email with the invoice PDF attached.
 */
export async function sendInvoiceEmail(toEmail: string, orderNumber: string, pdfBuffer: Buffer): Promise<void> {
  const host = process.env.APP_MAIL_HOST || 'sandbox.smtp.mailtrap.io'
  const port = Number(process.env.APP_MAIL_PORT) || 2525
  const user = process.env.APP_MAIL_USER || ''
  const pass = process.env.APP_MAIL_PASSWORD || ''
  const secure = process.env.APP_MAIL_SECURE === 'true'

  if (!user || !pass) {
    console.warn('[Mailer] SMTP credentials not set. Skipping real email send, logging instead.')
    console.log(`[Mailer Mock] Email to: ${toEmail}, Subject: Invoice for order ${orderNumber}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })

  const mailOptions = {
    from: '"ShopPay Store" <no-reply@shoppay.demo>',
    to: toEmail,
    subject: `Your Invoice for Order ${orderNumber} - ShopPay`,
    text: `Hello,\n\nThank you for your payment. Please find your invoice attached to this email.\n\nBest regards,\nThe ShopPay Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1e293b;">Thank you for your purchase!</h2>
        <p>Your order <strong>${orderNumber}</strong> has been successfully paid.</p>
        <p>We have attached the PDF invoice for your records.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>The ShopPay Team</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${orderNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[Mailer] Email sent successfully to ${toEmail}. Message ID: ${info.messageId}`)
  } catch (error: any) {
    console.error('[Mailer] Error sending email:', error.message)
    throw error
  }
}
