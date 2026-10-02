import Link from "next/link"
import Image from "next/image"
import { Clock, ExternalLink, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react"
import { CONTACT, MAIN_NAV, PROGRAMME_CATEGORIES, SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/site"

const SOCIAL_ICONS = {
  Facebook,
  "X (formerly Twitter)": Twitter,
  LinkedIn: Linkedin,
  Instagram,
} as const

const STUDENT_LINKS = [
  { label: "Log in", href: "/login" },
  { label: "Create an account", href: "/signup" },
  { label: "My dashboard", href: "/dashboard" },
  { label: "My certificates", href: "/certificates" },
]

const linkClass =
  "rounded-sm text-sm text-primary-foreground/80 transition-colors duration-150 hover:text-primary-foreground hover:underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60"
const headingClass = "text-sm font-semibold uppercase tracking-wide text-primary-foreground"

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={headingClass}>
      {children}
      {/* Logo-teal rule under each heading */}
      <span aria-hidden="true" className="mt-2 block h-0.5 w-8 rounded-full bg-brand-teal" />
    </h2>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-4 space-y-3">{children}</ul>
    </nav>
  )
}

/** Global site footer (DESIGN_SYSTEM.md §16). */
export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div aria-hidden="true" className="h-1 bg-brand-gradient" />
      <div className="container-page py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Academy information */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Link
              href="/"
              aria-label={`${SITE_NAME}, home`}
              className="inline-block rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60"
            >
              <Image src="/coltek-academy-logo-white.svg" alt="" width={117} height={40} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/80">{SITE_TAGLINE}</p>
            <a href={CONTACT.website} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-flex items-center gap-1.5 ${linkClass}`}>
              Coltek Technologies
              <ExternalLink className="size-3.5 text-brand-teal" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <ul className="mt-6 flex gap-1" aria-label="Social media">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.label]
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-11 items-center justify-center rounded-md text-primary-foreground/80 transition-colors hover:bg-brand-teal hover:text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60"
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="sr-only">
                        {SITE_NAME} on {social.label} (opens in a new tab)
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Academy">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#how-to-join" className={linkClass}>
                  How to enroll
                </Link>
              </li>
            </FooterColumn>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Programmes">
              {PROGRAMME_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link href={`/courses?category=${encodeURIComponent(category)}`} className={linkClass}>
                    {category}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Students">
              {STUDENT_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          <div className="lg:col-span-3">
            <FooterHeading>Contact</FooterHeading>
            <address className="mt-4 space-y-3 text-sm not-italic text-primary-foreground/80">
              <p className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-teal" aria-hidden="true" />
                <a href={`mailto:${CONTACT.email}`} className={`wrap-anywhere ${linkClass}`}>
                  {CONTACT.email}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-teal" aria-hidden="true" />
                <a href={CONTACT.phoneHref} className={linkClass}>
                  {CONTACT.phoneDisplay}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-teal" aria-hidden="true" />
                <span>{CONTACT.hours}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-teal" aria-hidden="true" />
                <span>{CONTACT.location}</span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-primary-foreground/20 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-primary-foreground/70">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
