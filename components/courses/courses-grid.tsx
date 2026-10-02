"use client"

import { CourseCard } from "@/components/course-card"
import { CourseCardSkeleton } from "@/components/course-card-skeleton"
import { EmptyState } from "@/components/academy/states"
import { SearchX } from "lucide-react"
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
      <EmptyState
        icon={SearchX}
        title="No courses found"
        description="Try adjusting your filters or search query to find what you're looking for."
      />
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
