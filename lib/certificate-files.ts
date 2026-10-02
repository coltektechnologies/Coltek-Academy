/**
 * Client helpers for certificate files (admin and student pages).
 */

/** Certificate URLs are stored as relative paths; old records may hold a full URL with another domain. */
export function normalizeCertUrl(url: string | undefined | null): string {
  if (!url) return ''
  try {
    if (url.startsWith('http')) return new URL(url).pathname
  } catch {
    // Not a valid URL, use as-is
  }
  return url
}

export function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.endsWith('.pdf') || lower.includes('application/pdf')
}

/** Download a certificate file; falls back to opening it in a new tab. */
export async function downloadCertificateFile(rawUrl: string, fileName: string): Promise<void> {
  const url = normalizeCertUrl(rawUrl)
  if (!url) return
  try {
    const response = await fetch(url.includes('?') ? `${url}&download=1` : `${url}?download=1`)
    if (!response.ok) throw new Error('Failed to download')
    const blobUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
