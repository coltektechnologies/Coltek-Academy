import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { CONTACT } from "@/lib/site"

// Shared contact facts (lib/site.ts) — same values as the footer
const contactMethods = [
  { icon: Mail, title: "Email us", details: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Phone, title: "Call us", details: CONTACT.phoneDisplay, href: CONTACT.phoneHref },
  { icon: MapPin, title: "Location", details: CONTACT.location, href: CONTACT.website, linkLabel: "Coltek Technologies website" },
  { icon: Clock, title: "Office hours", details: CONTACT.hours },
]

export function ContactInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Contact Information</h2>
        <p className="text-muted-foreground">
          Choose the most convenient way to reach us. Our support team is always ready to assist you.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contactMethods.map((method) => (
          <li key={method.title} className="min-w-0 bg-card border border-border rounded-xl p-5">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3">
              <method.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
            {method.href && !method.linkLabel ? (
              <a href={method.href} className="wrap-anywhere text-sm font-medium text-primary underline-offset-4 hover:underline">
                {method.details}
              </a>
            ) : (
              <p className="text-foreground text-sm">{method.details}</p>
            )}
            {method.linkLabel && (
              <a
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-accent underline-offset-4 hover:underline"
              >
                {method.linkLabel}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </li>
        ))}
      </ul>

      {/* City-level map: only "Accra, Ghana" is confirmed — use the street address once the owner provides it */}
      <figure className="overflow-hidden rounded-xl border border-border bg-card">
        <iframe
          title={`Map of ${CONTACT.location}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT.location)}&output=embed`}
          className="block h-64 w-full border-0 sm:h-72"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <MapPin className="size-4 text-accent" aria-hidden="true" />
            {CONTACT.location}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Open in Google Maps
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </figcaption>
      </figure>
    </div>
  )
}
