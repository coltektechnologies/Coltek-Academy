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
