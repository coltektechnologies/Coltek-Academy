import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/D5oD57BPAH4Derlxf2bOHu?mode=gi_t'

interface SendConfirmationBody {
  email: string
  firstName: string
  courseTitle: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendConfirmationBody = await request.json()
    const { email, firstName, courseTitle } = body

    if (!email || !firstName || !courseTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, courseTitle' },
        { status: 400 }
      )
    }

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(
        'Email not sent: SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env'
      )
      return NextResponse.json({
        success: true,
        message: 'Registration recorded. Email skipped (SMTP not configured).',
      })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Coltek Academy'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px; border-radius: 8px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Registration Successful!</h1>
  </div>
  
  <div style="padding: 24px 0;">
    <p>Hello ${firstName},</p>
    
    <p>Thank you for registering for <strong>${courseTitle}</strong> at ${siteName}. Your enrollment has been confirmed.</p>
    
    <h3 style="color: #0ea5e9;">What's next?</h3>
    <ul>
      <li>Access your course materials from your dashboard</li>
      <li>Join our student community on WhatsApp</li>
    </ul>
    
    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 12px; font-weight: 600;">Join the CADs WhatsApp Group</p>
      <p style="margin: 0 0 16px; color: #666; font-size: 14px;">Connect with fellow students and stay updated on course announcements.</p>
      <a href="${WHATSAPP_GROUP_LINK}" 
         style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Join WhatsApp Group
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy this link: ${WHATSAPP_GROUP_LINK}</p>
    
    <p>Best regards,<br>${siteName} Team</p>
  </div>
</body>
</html>
`

    const textContent = `
Hello ${firstName},

Thank you for registering for ${courseTitle} at ${siteName}. Your enrollment has been confirmed.

What's next?
- Access your course materials from your dashboard
- Join our student community on WhatsApp: ${WHATSAPP_GROUP_LINK}

Join the CADs WhatsApp Group to connect with fellow students and stay updated on course announcements.

Best regards,
${siteName} Team
`

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${siteName}" <${smtpUser}>`,
      to: email,
      subject: `Registration Confirmed - ${courseTitle}`,
      text: textContent,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, message: 'Confirmation email sent' })
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}
