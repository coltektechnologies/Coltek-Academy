/**
 * Site-wide facts used by the header, footer and contact page.
 * Values come from the existing site content (contact page, footer, About page) — do not invent new ones.
 */

export const SITE_NAME = "Coltek Academy"

/** Short description, from the About page copy. */
export const SITE_TAGLINE =
  "The training arm of Coltek Technologies, equipping learners with practical coding and technology skills through hands-on learning and real-world projects."

export const CONTACT = {
  email: "info@coltektechnologies.io",
  phoneDisplay: "+233 549 361 771",
  phoneHref: "tel:+233549361771",
  hours: "Monday – Friday, 9:00 AM – 6:00 PM GMT",
  location: "Accra, Ghana",
  website: "https://www.coltektechnologies.io/",
}

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://web.facebook.com/coltektechnologies" },
  { label: "X (formerly Twitter)", href: "https://x.com/coltekdev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/coltek-technologies?originalSubdomain=gh" },
  { label: "Instagram", href: "https://www.instagram.com/coltektechnologies/" },
] as const

/** Primary navigation. `match` decides the active state. */
export const MAIN_NAV = [
  { label: "Home", href: "/", match: (path: string) => path === "/" },
  { label: "Courses", href: "/courses", match: (path: string) => path === "/courses" || path.startsWith("/courses/") },
  { label: "About", href: "/about", match: (path: string) => path === "/about" },
  { label: "Contact", href: "/contact", match: (path: string) => path === "/contact" },
]

/** Course categories that exist in the catalogue (each links to the filtered course list). */
export const PROGRAMME_CATEGORIES = [
  "Web",
  "UI/UX",
  "Mobile App",
  "Data Science",
  "Graphic Design",
  "Marketing",
  "Cloud Computing",
  "Cybersecurity",
  "Business",
]

/** The most important student action, used in the header and mobile menu. */
export const PRIMARY_ACTION = { label: "Enroll now", href: "/register" }
