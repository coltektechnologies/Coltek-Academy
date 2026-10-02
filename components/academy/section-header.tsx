import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  /** Optional trailing action, e.g. a "View all courses" link. */
  action?: ReactNode
  align?: "left" | "center"
  /** Heading level; sections are h2 unless nested. */
  as?: "h2" | "h3"
  /** Id for the heading so the section can use aria-labelledby. */
  id?: string
  className?: string
}

// Section header — see DESIGN_SYSTEM.md §13
export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  align = "left",
  as: Heading = "h2",
  id,
  className,
}: SectionHeaderProps) {
  const centered = align === "center"

  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 md:mb-12",
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && <p className="text-sm font-semibold text-accent">{eyebrow}</p>}
        <Heading
          id={id}
          className={cn(
            "font-bold tracking-tight text-foreground text-balance leading-tight",
            Heading === "h2" ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl",
            eyebrow && "mt-2",
          )}
        >
          {title}
        </Heading>
        {description && <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
