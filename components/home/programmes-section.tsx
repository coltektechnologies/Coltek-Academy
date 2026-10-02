"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/course-card"
import { CourseCardSkeleton } from "@/components/course-card-skeleton"
import { SectionHeader } from "@/components/academy/section-header"
import { EmptyState, ErrorState } from "@/components/academy/states"
import { isCourseUpcoming } from "@/lib/course-display"
import type { Course } from "@/lib/types"

const MAX_COURSES = 6

// Mobile: swipeable row. sm+: grid. Same items in both layouts.
const listClasses =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
const itemClasses = "w-4/5 shrink-0 snap-start sm:w-auto"

export function ProgrammesSection() {
  const [courses, setCourses] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading")
    try {
      const response = await fetch("/api/courses", { signal })
      if (!response.ok) throw new Error("Failed to load courses")
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error("Invalid courses response")
      // Open courses first, then upcoming ones
      const sorted = [...data].sort((a, b) => Number(isCourseUpcoming(a)) - Number(isCourseUpcoming(b)))
      setCourses(sorted.slice(0, MAX_COURSES))
      setTotal(data.length)
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

  return (
    <section aria-labelledby="programmes-heading" className="py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="programmes-heading"
          eyebrow="Programmes"
          title="Choose what you want to learn"
          description="Hands-on courses across web, design, data, mobile and more. Open a course to see its curriculum, duration, learning mode and fee."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">
                {total > 0 ? `View all ${total} courses` : "View all courses"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        {status === "error" && (
          <ErrorState
            title="Courses could not be loaded"
            description="Please try again, or browse the full catalogue."
            onRetry={() => load()}
          />
        )}

        {status === "loading" && (
          <div className={listClasses} aria-busy="true" aria-label="Loading courses">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={itemClasses}>
                <CourseCardSkeleton />
              </div>
            ))}
          </div>
        )}

        {status === "ready" && courses.length === 0 && (
          <EmptyState
            title="No courses published yet"
            description="New courses are on the way. Check back soon."
          />
        )}

        {status === "ready" && courses.length > 0 && (
          <ul className={listClasses} aria-label="Courses">
            {courses.map((course) => (
              <li key={course.id} className={itemClasses}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
