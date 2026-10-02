import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml, getMailFrom, getMailTransport } from '@/lib/mailer'

// Published contact address (shown on /contact); override with CONTACT_EMAIL
const DEFAULT_CONTACT_EMAIL = 'info@coltektechnologies.io'

const SUBJECTS: Record<string, string> = {
  general: 'General Inquiry',
  courses: 'Course Information',
  support: 'Technical Support',
  billing: 'Billing & Payments',
  partnership: 'Partnership Opportunities',
  feedback: 'Feedback & Suggestions',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Best-effort per-instance rate limit: 5 messages per IP per 10 minutes
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const recentSubmissions = new Map<string, number[]>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const timestamps = (recentSubmissions.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT) {
    recentSubmissions.set(ip, timestamps)
    return true
  }
  recentSubmissions.set(ip, [...timestamps, now])
  return false
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()

  // Honeypot field: real users never fill it in
  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const fieldErrors: Record<string, string> = {}
  if (!name || name.length > 100) fieldErrors.name = 'Please enter your name (max 100 characters).'
  if (!EMAIL_PATTERN.test(email) || email.length > 200) fieldErrors.email = 'Please enter a valid email address.'
  if (!SUBJECTS[subject]) fieldErrors.subject = 'Please select a topic.'
  if (message.length < 10 || message.length > 5000) fieldErrors.message = 'Please enter a message between 10 and 5000 characters.'
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: 'Please correct the highlighted fields.', fieldErrors }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 })
  }

  const transport = getMailTransport()
  if (!transport) {
    console.error('Contact form: SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)')
    return NextResponse.json(
      { error: 'Messages cannot be sent right now. Please email us directly.' },
      { status: 503 }
    )
  }

  const subjectLabel = SUBJECTS[subject]
  try {
    await transport.sendMail({
      from: getMailFrom(),
      to: process.env.CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subjectLabel} — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nTopic: ${subjectLabel}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Topic:</strong> ${escapeHtml(subjectLabel)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    })
  } catch (error) {
    console.error('Contact form: failed to send message', error)
    return NextResponse.json(
      { error: 'Your message could not be sent. Please try again or email us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
