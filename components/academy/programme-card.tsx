import Link from "next/link"
import type { ComponentType } from "react"
import { ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ProgrammeCardProps {
  /** Programme area / track name, e.g. "Web Development". */
  title: string
  description?: string
  /** Destination, e.g. "/courses?category=Web". */
  href: string
  /** Real number of courses in this programme, from course data. Omit if unknown. */
  courseCount?: number
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
  headingLevel?: "h2" | "h3"
}

/**
 * Programme card — a programme area that groups several courses (see DESIGN_SYSTEM.md §11a).
 * For an individual course use CourseCard. The title link covers the whole card.
 */
export function ProgrammeCard({
  title,
  description,
  href,
  courseCount,
  icon: Icon,
  headingLevel = "h3",
}: ProgrammeCardProps) {
  const Heading = headingLevel

  return (
    <Card
      interactive
      className="group h-full gap-0 p-6 shadow-none has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50"
    >
      {Icon && (
        <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <Heading className="text-lg font-semibold leading-snug text-foreground">
        <Link href={href} className="outline-none after:absolute after:inset-0 group-hover:text-primary">
          {title}
        </Link>
      </Heading>
      {description && <p className="mt-2 flex-1 text-sm leading-normal text-muted-foreground">{description}</p>}
      <div className="mt-5 flex items-center justify-between text-sm">
        {typeof courseCount === "number" ? (
          <span className="text-muted-foreground">
            {courseCount} {courseCount === 1 ? "course" : "courses"}
          </span>
        ) : (
          <span />
        )}
        <span aria-hidden="true" className="flex items-center gap-1 font-medium text-accent">
          Explore
          <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </span>
      </div>
    </Card>
  )
}
