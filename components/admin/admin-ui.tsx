import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Shared admin building blocks (DESIGN_SYSTEM.md §30 "Admin").
 * Every admin page is: <AdminPage> → <AdminPageHeader> → content (stats, toolbars, tables, sections).
 */

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>

/** Page container for admin content: 1280 px max, consistent padding and vertical rhythm. */
export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8", className)}>{children}</div>
}

/** Page title row: the page's single h1, a one-line description and the page actions. */
export function AdminPageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: ReactNode
  /** Primary action last (right-most on desktop). */
  actions?: ReactNode
  /** Small facts under the description, e.g. totals. */
  meta?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:gap-3">{actions}</div>}
    </div>
  )
}

/**
 * KPI tile. `value` must be real data; null/undefined renders "—" (loading or unavailable), never a guess.
 * Render inside a <dl> (it outputs a dt/dd pair).
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
}: {
  label: string
  value: number | string | null | undefined
  icon?: IconType
  hint?: ReactNode
  href?: string
}) {
  const display = typeof value === "number" ? value.toLocaleString() : value ?? "—"
  // dt/dd stay direct children of this wrapper (valid <dl> structure); the link is a stretched overlay
  return (
    <Card interactive={!!href} className="relative gap-0 p-5 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
      <dt className="flex items-start justify-between gap-3 text-sm font-medium text-muted-foreground">
        {label}
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </dt>
      <dd className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {display}
        {href && (
          <Link href={href} className="absolute inset-0 rounded-xl outline-none">
            <span className="sr-only">View {label.toLowerCase()}</span>
          </Link>
        )}
      </dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </Card>
  )
}

/** Search field for filtering a list on the page. */
export function AdminSearch({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Accessible name, e.g. "Search students". */
  label: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 bg-card pr-9 pl-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** Toolbar row above a list: search on the left, filters/actions on the right. */
export function AdminToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>{children}</div>
}

/** Bordered surface for tables (DESIGN_SYSTEM.md §19). Scrolls horizontally on narrow screens. */
export function AdminTableCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto rounded-xl border border-border bg-card shadow-sm", className)}>{children}</div>
}

/** Titled panel for dashboard sections and side panels. */
export function AdminSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  )
}

const STATUS_VARIANTS: Record<string, "success" | "info" | "warning" | "error" | "outline" | "secondary"> = {
  active: "info",
  "in progress": "info",
  completed: "success",
  issued: "success",
  published: "success",
  paid: "success",
  free: "secondary",
  draft: "outline",
  pending: "warning",
  upcoming: "warning",
  cancelled: "error",
  revoked: "error",
  failed: "error",
  admin: "info",
  student: "secondary",
}

/** Status pill with the design-system color for each status (never color alone: the text is the status). */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.trim().toLowerCase()
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown"
  return (
    <Badge variant={STATUS_VARIANTS[key] || "outline"} className={className}>
      {label}
    </Badge>
  )
}

/** Avatar circle with initials (or photo) for people lists. */
export function PersonAvatar({ name, email, photoURL, className }: { name?: string; email?: string; photoURL?: string; className?: string }) {
  const source = (name || email || "").trim()
  const initials = source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-primary", className)} aria-hidden="true">
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  )
}

/** Short date like "16 Jul 2026"; "—" when missing or invalid. */
export function formatAdminDate(value: unknown): string {
  if (!value) return "—"
  const date =
    value instanceof Date
      ? value
      : typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
