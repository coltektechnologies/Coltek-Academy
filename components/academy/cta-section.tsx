import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CtaAction {
  label: string
  href: string
}

interface CTASectionProps {
  title: ReactNode
  description?: ReactNode
  primaryAction: CtaAction
  secondaryAction?: CtaAction
  /**
   * "band": full-width navy section, used once at the end of a page.
   * "panel": inline muted panel inside page content.
   */
  variant?: "band" | "panel"
  /** Band only: use the logo gradient (counts as the page's single gradient device). */
  gradient?: boolean
  className?: string
}

// Call-to-action section — see DESIGN_SYSTEM.md §18
export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "band",
  gradient = false,
  className,
}: CTASectionProps) {
  if (variant === "panel") {
    return (
      <div className={cn("rounded-xl bg-muted p-8 text-center sm:text-left", className)}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">{title}</h3>
            {description && <p className="mt-2 text-muted-foreground">{description}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            {secondaryAction && (
              <Button asChild variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        "py-12 md:py-16",
        gradient ? "bg-linear-to-r from-primary to-accent" : "bg-primary",
        className,
      )}
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground text-balance sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {description && (
          // Full-opacity text over the gradient: /80 drops below 4.5:1 on the teal end
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl text-lg leading-relaxed",
              gradient ? "text-primary-foreground" : "text-primary-foreground/80",
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" variant="inverse">
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          {secondaryAction && (
            <Button asChild size="lg" variant="outline-inverse">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
