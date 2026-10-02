import Image from "next/image"
import { Linkedin, Twitter } from "lucide-react"
import { SectionHeader } from "@/components/academy/section-header"
import { team } from "@/lib/team"

const socialLink =
  "flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function TeamSection() {
  return (
    <section id="leadership" aria-labelledby="team-heading" className="scroll-mt-20 py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="team-heading"
          eyebrow="Leadership"
          title="The people behind Coltek Academy"
          description="Driven by passion and experience, our leadership team blends technology, education, and innovation to shape impactful learning experiences at Coltek Academy."
        />
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <li key={member.id}>
              <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={member.image}
                  alt={`Portrait of ${member.name}`}
                  fill
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <h3 className="mt-5 text-lg font-semibold leading-snug text-foreground">{member.name}</h3>
              <p className="text-sm font-medium text-accent">{member.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
              {(member.linkedin || member.twitter) && (
                <div className="mt-3 -ml-2 flex gap-1">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className={socialLink}>
                      <Linkedin className="size-4" aria-hidden="true" />
                      <span className="sr-only">{member.name} on LinkedIn (opens in a new tab)</span>
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" className={socialLink}>
                      <Twitter className="size-4" aria-hidden="true" />
                      <span className="sr-only">{member.name} on X (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
