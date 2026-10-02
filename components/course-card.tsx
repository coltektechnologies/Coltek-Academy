"use client"

import Image from "next/image"
import Link from "next/link"
import { BarChart3, Clock, Laptop, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatCourseDuration,
  formatCoursePrice,
  getCourseMode,
  isCourseUpcoming,
} from "@/lib/course-display"
import type { Course } from "@/lib/types"

interface CourseCardProps {
  course: Course
  /** Heading level for the course title, to fit the surrounding outline. */
  headingLevel?: "h2" | "h3"
}

// Course card — see DESIGN_SYSTEM.md §11. The title link covers the whole card (one focus stop).
export function CourseCard({ course, headingLevel = "h3" }: CourseCardProps) {
  const Heading = headingLevel
  const upcoming = isCourseUpcoming(course)
  const duration = formatCourseDuration(course.duration)
  const mode = getCourseMode(course)
  const students = typeof course.enrolledStudents === "number" ? course.enrolledStudents : 0

  return (
    <Card
      interactive
      className="group h-full gap-0 overflow-hidden py-0 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={course.image || "/placeholder.svg"}
          alt=""
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {upcoming && (
          <Badge variant="warning" className="absolute left-3 top-3 shadow-sm">
            Coming soon
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {course.category && <p className="text-sm font-medium text-accent">{course.category}</p>}
        <Heading className="mt-1 text-lg font-semibold leading-snug text-foreground line-clamp-2">
          <Link
            href={`/courses/${course.slug}`}
            className="outline-none after:absolute after:inset-0 group-hover:text-primary"
          >
            {course.title}
          </Link>
        </Heading>
        {course.description && (
          <p className="mt-2 text-sm leading-normal text-muted-foreground line-clamp-2">{course.description}</p>
        )}

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {course.level && (
            <li className="flex items-center gap-1.5">
              <BarChart3 className="size-4" aria-hidden="true" />
              <span className="sr-only">Level: </span>
              {course.level}
            </li>
          )}
          {duration && (
            <li className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              <span className="sr-only">Duration: </span>
              {duration}
            </li>
          )}
          {mode && (
            <li className="flex items-center gap-1.5">
              <Laptop className="size-4" aria-hidden="true" />
              <span className="sr-only">Mode: </span>
              {mode}
            </li>
          )}
          {students > 0 && (
            <li className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {students.toLocaleString()} {students === 1 ? "student" : "students"}
            </li>
          )}
        </ul>
      </div>

      <div className="flex min-h-16 items-center justify-between gap-4 border-t border-border px-6 py-4">
        <p className={cn(upcoming ? "text-sm font-medium text-muted-foreground" : "text-lg font-bold text-foreground")}>
          <span className="sr-only">Price: </span>
          {formatCoursePrice(course)}
        </p>
        {/* Visual affordance only: the title link above is the accessible link */}
        <span aria-hidden="true" className={buttonVariants({ variant: "outline", size: "sm" })}>
          View course
        </span>
      </div>
    </Card>
  )
}
