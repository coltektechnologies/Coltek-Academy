import type { ComponentType, ReactNode } from "react"
import { AlertTriangle, Inbox, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

/* Loading, empty and error states — see DESIGN_SYSTEM.md §28. Built on components/ui/empty. */

interface LoadingStateProps {
  /** Announced to screen readers and shown under the spinner. */
  label?: string
  /** "inline" for sections/cards, "page" to fill the main area. */
  size?: "inline" | "page"
  className?: string
}

export function LoadingState({ label = "Loading…", size = "inline", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        size === "page" ? "min-h-96 py-16" : "py-12",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: ReactNode
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
  /** Usually one button or link that resolves the empty state. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <Empty className={cn("border border-dashed border-border bg-card", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-muted text-muted-foreground">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-foreground">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

interface ErrorStateProps {
  title?: string
  description?: ReactNode
  /** Shows a "Try again" button. */
  onRetry?: () => void
  retryLabel?: string
  /** Extra action, e.g. a link back to the catalogue. */
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  return (
    <Empty role="alert" className={cn("border border-destructive/30 bg-destructive-subtle", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-card text-destructive">
          <AlertTriangle aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-foreground">{title}</EmptyTitle>
        {description && <EmptyDescription className="text-foreground">{description}</EmptyDescription>}
      </EmptyHeader>
      {(onRetry || action) && (
        <EmptyContent className="flex-row justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
          {action}
        </EmptyContent>
      )}
    </Empty>
  )
}
