import { Award, CalendarDays, Hammer, Users } from "lucide-react"

// Quick value points. Each reflects something the Academy actually does (see CLAUDE.md §5).
const values = [
  {
    icon: Hammer,
    title: "Hands-on, project-based",
    description: "Learn by building real-world projects, not just reading theory.",
  },
  {
    icon: Users,
    title: "Taught by practitioners",
    description: "Courses are led by engineers and educators from Coltek Technologies.",
  },
  {
    icon: Award,
    title: "Certificate of completion",
    description: "Download your certificate from your dashboard once it is issued.",
  },
  {
    icon: CalendarDays,
    title: "Weekday or weekend",
    description: "Tell us your preferred learning schedule when you register.",
  },
]

export function ValueStrip() {
  return (
    <section aria-label="Why learners choose Coltek Academy" className="border-y border-border bg-muted">
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {values.map((value) => (
          <li key={value.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <value.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{value.title}</p>
              <p className="mt-1 text-sm leading-normal text-muted-foreground">{value.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
