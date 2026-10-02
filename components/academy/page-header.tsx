import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

export interface BreadcrumbEntry {
  label: string
  /** Omit for the current page (the last entry). */
  href?: string
}

interface PageHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  breadcrumbs?: BreadcrumbEntry[]
  /** Up to two calls to action (primary + outline). */
  actions?: ReactNode
  align?: "left" | "center"
  className?: string
  children?: ReactNode
}

// Interior page hero — see DESIGN_SYSTEM.md §12. Renders the page's single h1.
export function PageHeader({
  title,
  eyebrow,
  description,
  breadcrumbs,
  actions,
  align = "left",
  className,
  children,
}: PageHeaderProps) {
  const centered = align === "center"

  return (
    <header className={cn("border-b border-border bg-muted", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className={cn("mb-6", centered && "flex justify-center")}>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    <BreadcrumbItem className={isLast ? "min-w-0" : undefined}>
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
          {eyebrow && <p className="text-sm font-semibold text-accent">{eyebrow}</p>}
          <h1
            className={cn(
              "text-3xl font-bold tracking-tight text-foreground text-balance leading-tight sm:text-4xl lg:text-5xl",
              eyebrow && "mt-2",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn("mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty", centered && "mx-auto")}>
              {description}
            </p>
          )}
          {actions && (
            <div className={cn("mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4", centered && "sm:justify-center")}>
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </header>
  )
}
