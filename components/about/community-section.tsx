import { Award, HeartHandshake, MessageCircle } from "lucide-react"
import { LiveStats } from "@/components/academy/live-stats"

// Student experience features that exist today (WhatsApp group, student success role, certificates)
const points = [
  {
    icon: MessageCircle,
    title: "A student community",
    description: "Enrolled students join the Coltek Academy student group on WhatsApp for announcements and peer support.",
  },
  {
    icon: HeartHandshake,
    title: "Support for every student",
    description: "Our VP of Student Success is dedicated to ensuring every student achieves their goals.",
  },
  {
    icon: Award,
    title: "Recognised progress",
    description: "Students receive certificates of completion they can download from their dashboard.",
  },
]

export function CommunitySection() {
  return (
    <section aria-labelledby="community-heading" className="py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold text-accent">Student experience</p>
          <h2
            id="community-heading"
            className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
          >
            You learn alongside others
          </h2>
          <ul className="mt-8 space-y-8">
            {points.map((point) => (
              <li key={point.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold leading-snug text-foreground">{point.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5 lg:self-center">
          <div className="rounded-xl bg-primary p-8 sm:p-10">
            <h3 className="text-lg font-semibold text-primary-foreground">Coltek Academy in numbers</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">Live figures from our enrollment and certificate records.</p>
            <LiveStats className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8" />
          </div>
        </div>
      </div>
    </section>
  )
}
