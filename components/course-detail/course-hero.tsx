import Image from "next/image"
import Link from "next/link"
import { BarChart3, Clock, Globe, Laptop } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { formatCourseDuration, getCourseMode, isCourseUpcoming } from "@/lib/course-display"
import type { Course } from "@/lib/types"

// Course hero: where am I, what is this course, and its key facts at a glance
export function CourseHero({ course }: { course: Course }) {
  const upcoming = isCourseUpcoming(course)
  const duration = formatCourseDuration(course.duration)
  const mode = getCourseMode(course)
  const facts = [
    course.level && { icon: BarChart3, label: "Level", value: course.level },
    duration && { icon: Clock, label: "Duration", value: duration },
    mode && { icon: Laptop, label: "Learning mode", value: mode },
    course.language && { icon: Globe, label: "Language", value: course.language },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]

  return (
    <header className="border-b border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/courses">Courses</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              {course.category && (
                <Link
                  href={`/courses?category=${encodeURIComponent(course.category)}`}
                  className="rounded-sm text-sm font-semibold text-accent underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {course.category}
                </Link>
              )}
              {upcoming && <Badge variant="warning">Coming soon</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>
            {course.description && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{course.description}</p>
            )}

            {facts.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-8">
                {facts.map((fact) => (
                  // dt/dd must be direct children of the group, so the icon sits inside the dt
                  <div key={fact.label} className="relative min-h-9 pl-12">
                    <dt className="text-xs text-muted-foreground">
                      <span className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-lg bg-card text-primary">
                        <fact.icon className="size-4" aria-hidden="true" />
                      </span>
                      {fact.label}
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-card">
              <Image
                src={course.image || "/placeholder.svg"}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
