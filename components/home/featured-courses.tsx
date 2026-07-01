"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/course-card"
import { CourseCardSkeleton } from "@/components/course-card-skeleton"
import type { Course } from "@/lib/types"
import { ArrowRight } from "lucide-react"

export function FeaturedCourses() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchFeaturedCourses = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/courses", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to load featured courses")
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid courses response")
        }

        setFeaturedCourses(data.slice(0, 4))
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error loading featured courses:", err)
          setError("Featured courses are unavailable right now.")
          setFeaturedCourses([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchFeaturedCourses()

    return () => controller.abort()
  }, [])

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Courses</h2>
            <p className="text-muted-foreground max-w-2xl">
              Explore our most popular courses hand-picked by our team to help you achieve your learning goals.
            </p>
          </div>
          <Button variant="outline" asChild className="mt-4 md:mt-0 bg-transparent">
            <Link href="/courses">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => <CourseCardSkeleton key={index} />)
            : featuredCourses.map((course) => (
                <CourseCard key={course.id} course={{ ...course, enrolledStudents: course.enrolledStudents || 0 }} />
              ))}
        </div>

        {!isLoading && error && (
          <p className="mt-6 text-sm text-muted-foreground">{error}</p>
        )}
      </div>
    </section>
  )
}
