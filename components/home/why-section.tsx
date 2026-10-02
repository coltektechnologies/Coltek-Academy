import Link from "next/link"
import { ArrowRight, Building2, Hammer, ListChecks, MessageCircle } from "lucide-react"
import { SectionHeader } from "@/components/academy/section-header"
import { LiveStats } from "@/components/home/stats-section"

// Advantages grounded in how the Academy actually works (About page, course data, enrollment flow)
const reasons = [
  {
    icon: Building2,
    title: "Part of a working technology company",
    description:
      "Coltek Academy is the training arm of Coltek Technologies, so the curriculum is shaped by real industry work and current needs.",
  },
  {
    icon: Hammer,
    title: "Practical from the start",
    description:
      "You learn by working on practical projects that build problem-solving ability, confidence and job-ready experience.",
  },
  {
    icon: ListChecks,
    title: "A clear, structured curriculum",
    description: "Every course is organised into modules and lessons, so you always know what comes next.",
  },
  {
    icon: MessageCircle,
    title: "A community to learn with",
    description: "Enrolled students join the Coltek Academy student group on WhatsApp for announcements and peer support.",
  },
]

export function WhySection() {
  return (
    <section aria-labelledby="why-heading" className="bg-muted py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-7">
          <SectionHeader
            id="why-heading"
            eyebrow="Why Coltek Academy"
            title="Training built around real technology work"
            className="mb-8 md:mb-10"
          />
          <ul className="space-y-8">
            {reasons.map((reason) => (
              <li key={reason.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <reason.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold leading-snug text-foreground">{reason.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{reason.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Meet the leadership team
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="lg:col-span-5 lg:self-center">
          <div className="rounded-xl bg-primary p-8 sm:p-10">
            <h3 id="stats-heading" className="text-lg font-semibold text-primary-foreground">
              Coltek Academy in numbers
            </h3>
            <p className="mt-1 text-sm text-primary-foreground/80">Live figures from our enrollment and certificate records.</p>
            <LiveStats className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8" />
          </div>
        </div>
      </div>
    </section>
  )
}
