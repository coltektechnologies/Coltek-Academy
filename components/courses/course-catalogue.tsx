"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SearchX, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CourseCard } from "@/components/course-card"
import { CourseCardSkeleton } from "@/components/course-card-skeleton"
import { EmptyState, ErrorState } from "@/components/academy/states"
import { isCourseUpcoming } from "@/lib/course-display"
import type { Course } from "@/lib/types"

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const
const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"

const chipClasses = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
  )

const sameText = (a?: string | null, b?: string | null) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase()

/**
 * Course catalogue: search, category and level filters (kept in the URL so views can be shared),
 * results grouped by availability. Data comes from /api/courses.
 */
export function CourseCatalogue() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [courses, setCourses] = useState<Course[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [query, setQuery] = useState(searchParams.get("q") || "")

  const category = searchParams.get("category") || ""
  const level = searchParams.get("level") || ""

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading")
    try {
      const response = await fetch("/api/courses", { signal })
      if (!response.ok) throw new Error("Failed to load courses")
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error("Invalid courses response")
      setCourses(data)
      setStatus("ready")
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStatus("error")
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const updateParams = useCallback(
    (changes: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Keep the search term in the URL without a navigation on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchParams.get("q") || "") !== query.trim()) updateParams({ q: query.trim() })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, searchParams, updateParams])

  // Categories that actually exist in the catalogue, in a stable order
  const categories = useMemo(
    () => Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [courses],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return courses.filter((course) => {
      if (category && !sameText(course.category, category)) return false
      if (level && !sameText(course.level, level)) return false
      if (term) {
        const haystack = [course.title, course.description, course.category].join(" ").toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [courses, category, level, query])

  const open = filtered.filter((course) => !isCourseUpcoming(course))
  const upcoming = filtered.filter((course) => isCourseUpcoming(course))
  const hasFilters = Boolean(category || level || query.trim())

  const clearFilters = () => {
    setQuery("")
    updateParams({ category: "", level: "", q: "" })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
      {/* Filters */}
      <div className="space-y-5 border-b border-border pb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <label htmlFor="course-search" className="sr-only">
              Search courses
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="course-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by course name or topic"
              className="h-12 pl-10"
            />
          </div>

          <div role="group" aria-label="Filter by level" className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
            {["", ...LEVELS].map((option) => {
              const active = sameText(level, option)
              return (
                <button
                  key={option || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateParams({ level: option })}
                  className={cn(
                    "h-10 flex-1 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex-none sm:px-4",
                    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option || "All levels"}
                </button>
              )
            })}
          </div>
        </div>

        {categories.length > 0 && (
          <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button type="button" aria-pressed={!category} onClick={() => updateParams({ category: "" })} className={chipClasses(!category)}>
              All categories
            </button>
            {categories.map((option) => {
              const active = sameText(category, option)
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateParams({ category: active ? "" : option })}
                  className={chipClasses(active)}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Result summary */}
      <div className="flex min-h-14 items-center justify-between gap-4 py-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {status === "ready" && (
            <>
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {courses.length}{" "}
              {courses.length === 1 ? "course" : "courses"}
            </>
          )}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>

      {status === "loading" && (
        <div className={GRID} aria-busy="true" aria-label="Loading courses">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === "error" && (
        <ErrorState title="Courses could not be loaded" description="Please check your connection and try again." onRetry={() => load()} />
      )}

      {status === "ready" && filtered.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="No courses match your filters"
          description="Try a different search term, level or category."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {status === "ready" && filtered.length > 0 && (
        <div className="space-y-14">
          {open.length > 0 && <CourseGroup id="open-courses" title="Open for enrollment" courses={open} />}
          {upcoming.length > 0 && (
            <CourseGroup
              id="upcoming-courses"
              title="Coming soon"
              description="These courses are announced but not yet open for enrollment. Open a course to see its curriculum."
              courses={upcoming}
            />
          )}
        </div>
      )}
    </div>
  )
}

function CourseGroup({ id, title, description, courses }: { id: string; title: string; description?: string; courses: Course[] }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-6">
        <h2 id={id} className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {title} <span className="text-muted-foreground font-normal">({courses.length})</span>
        </h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      <ul className={GRID}>
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  )
}
