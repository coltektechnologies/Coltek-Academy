import nodemailer from 'nodemailer'

/** SMTP transport from environment variables, or null when SMTP is not configured. */
export function getMailTransport() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

export function getMailFrom() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Coltek Academy'
  return process.env.SMTP_FROM || `"${siteName}" <${process.env.SMTP_USER}>`
}

/** Escape user-supplied text before interpolating it into an HTML email. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
