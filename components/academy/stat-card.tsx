import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  /** Real value only (e.g. from /api/stats). null/undefined renders "—", never a guess. */
  value: number | string | null | undefined
  label: ReactNode
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
  /** "onPrimary" for the navy stats band (no chrome); "card" for a bordered card on light backgrounds. */
  variant?: "onPrimary" | "card"
  className?: string
}

/**
 * Stat item — see DESIGN_SYSTEM.md §10. Renders a <dt>/<dd> pair, so place it inside a <dl>.
 * The label is first in the DOM (read first) but shown below the number.
 */
export function StatCard({ value, label, icon: Icon, variant = "card", className }: StatCardProps) {
  const onPrimary = variant === "onPrimary"
  const display = typeof value === "number" ? value.toLocaleString() : value ?? "—"

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center text-center",
        !onPrimary && "rounded-xl border border-border bg-card p-6 shadow-sm",
        className,
      )}
    >
      <dt className={cn("mt-2 text-sm md:text-base", onPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {label}
      </dt>
      <dd className="flex flex-col items-center">
        {Icon && (
          <span
            className={cn(
              "mb-4 flex size-10 items-center justify-center rounded-lg",
              onPrimary ? "bg-primary-foreground/10 text-brand-teal" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <span
          className={cn(
            "text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl",
            onPrimary ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {display}
        </span>
      </dd>
    </div>
  )
}
