import { ExternalLink } from "lucide-react"

/** Story + mission. Copy is the Academy's own About/Mission text, de-duplicated. */
export function MissionSection() {
  return (
    <>
      <section aria-labelledby="story-heading" className="border-t border-border py-16 md:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold text-accent">Our story</p>
            <h2
              id="story-heading"
              className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
            >
              Why Coltek Academy exists
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground lg:col-span-8">
            <p>
              At Coltek Academy, we believe that practical technology education should be accessible to everyone,
              regardless of background or location. We exist to equip learners with in-demand coding and digital skills
              through hands-on, industry-focused training.
            </p>
            <p>
              Whether you are starting your tech journey, transitioning into a new career, or strengthening your existing
              skills, Coltek Academy provides the guidance, tools and mentorship needed to succeed in today&apos;s digital
              world.
            </p>
            <div className="border-l-4 border-brand-teal pl-6">
              <h3 className="text-base font-semibold text-foreground">Part of Coltek Technologies</h3>
              <p className="mt-2 text-base">
                As the training arm of Coltek Technologies, we design our curriculum around real-world challenges and
                current industry needs.
              </p>
              <a
                href="https://www.coltektechnologies.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-sm text-base font-medium text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                Visit Coltek Technologies
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="mission-heading" className="bg-primary py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Bright teal is decorative only (DESIGN_SYSTEM.md §3); the label itself uses light text for contrast */}
          <span aria-hidden="true" className="mx-auto block h-1 w-12 rounded-full bg-brand-teal" />
          <h2 id="mission-heading" className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
            Our mission
          </h2>
          <p className="mt-6 text-2xl font-semibold leading-snug text-primary-foreground text-balance sm:text-3xl lg:text-4xl">
            To equip learners with in-demand coding and digital skills through hands-on, industry-focused training —
            accessible to everyone, regardless of background or location.
          </p>
        </div>
      </section>
    </>
  )
}
