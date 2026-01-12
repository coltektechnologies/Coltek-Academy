import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/course-card"
import { courses } from "@/lib/data"
import { ArrowRight } from "lucide-react"

export function FeaturedCourses() {
  const featuredCourses = courses.slice(0, 4)

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
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  )
}
