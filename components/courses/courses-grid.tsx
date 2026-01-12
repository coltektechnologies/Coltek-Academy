"use client"

import { CourseCard } from "@/components/course-card"
import { CourseCardSkeleton } from "@/components/course-card-skeleton"
import type { Course } from "@/lib/types"

interface CoursesGridProps {
  courses: Course[]
  isLoading?: boolean
}

export function CoursesGrid({ courses, isLoading }: CoursesGridProps) {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground text-lg mb-2">No courses found</div>
        <p className="text-muted-foreground/80 text-sm">
          Try adjusting your filters or search query to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
