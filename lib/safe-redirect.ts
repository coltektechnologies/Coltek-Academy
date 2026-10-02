/**
 * Only allow redirects to paths on this site (e.g. "/register?course=1").
 * Absolute URLs, protocol-relative ("//evil.com") and backslash tricks fall back to `fallback`.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback
  const target = value.trim()
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback
  return target
}
