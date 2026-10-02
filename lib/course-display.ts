import type { Course } from '@/lib/types'

/**
 * Presentation helpers for course data. They only format what the data supports —
 * they never invent values (see CLAUDE.md §5).
 */

// Courses that are announced but not yet open, kept in sync with the course APIs
export const UPCOMING_COURSE_SLUGS = [
  'cybersecurity-essentials',
  'data-science-machine-learning',
  'cloud-computing-aws',
  'project-management-professional',
]

export function isCourseUpcoming(course: Pick<Course, 'slug'> & { upcoming?: boolean }): boolean {
  return course.upcoming === true || UPCOMING_COURSE_SLUGS.includes(course.slug || '')
}

/** "Coming soon" for upcoming courses, "Free" for zero price, otherwise GH₵ amount. */
export function formatCoursePrice(course: Pick<Course, 'price' | 'slug'> & { upcoming?: boolean }): string {
  if (isCourseUpcoming(course)) return 'Coming soon'
  if (typeof course.price !== 'number' || course.price <= 0) return 'Free'
  return `GH₵${course.price.toLocaleString()}`
}

/**
 * Human-readable duration. Text values that include a unit ("10 weeks") are shown as-is.
 * Bare numbers are not shown: stored values mix units, so the unit cannot be trusted.
 */
export function formatCourseDuration(duration: unknown): string | null {
  if (typeof duration === 'string') {
    const value = duration.trim()
    return /[a-z]/i.test(value) ? value : null
  }
  return null
}

/** Learning mode (e.g. "Online", "In person") only when the course record provides one. */
export function getCourseMode(course: Record<string, unknown>): string | null {
  for (const key of ['mode', 'deliveryMode', 'learningMode']) {
    const value = course[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

/** Learning modes an admin can choose for a course. */
export const COURSE_MODES = ['Online', 'In person'] as const
export type CourseMode = (typeof COURSE_MODES)[number]

/** Units an admin can choose for a course duration. Stored as text, e.g. "10 weeks". */
export const DURATION_UNITS = ['hours', 'days', 'weeks', 'months'] as const
export type DurationUnit = (typeof DURATION_UNITS)[number]

/**
 * Split a stored duration into amount + unit for editing.
 * Legacy numeric values (no unit saved) return the number with an empty unit so the admin must choose one.
 */
export function parseCourseDuration(duration: unknown): { amount: string; unit: DurationUnit | '' } {
  if (typeof duration === 'number') {
    return { amount: duration > 0 ? String(duration) : '', unit: '' }
  }
  if (typeof duration === 'string') {
    const match = duration.trim().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/i)
    if (match) {
      const word = match[2].toLowerCase()
      const unit = DURATION_UNITS.find((u) => u === word || u.slice(0, -1) === word) ?? ''
      return { amount: match[1], unit }
    }
  }
  return { amount: '', unit: '' }
}

/** Build the stored duration text, using the singular unit for 1 ("1 week", "10 weeks"). */
export function buildCourseDuration(amount: string, unit: DurationUnit | ''): string {
  const value = Number(amount)
  if (!unit || !Number.isFinite(value) || value <= 0) return ''
  return `${amount.trim()} ${value === 1 ? unit.slice(0, -1) : unit}`
}
