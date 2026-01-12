import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseHero } from "@/components/course-detail/course-hero"
import { CourseContent } from "@/components/course-detail/course-content"
import { RelatedCourses } from "@/components/course-detail/related-courses"
import { courses } from "@/lib/data"

interface CoursePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)

  if (!course) {
    return {
      title: "Course Not Found",
    }
  }

  return {
    title: `${course.title} | EduLearn`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [course.image],
    },
  }
}

export async function generateStaticParams() {
  return courses.map((course) => ({
    slug: course.slug,
  }))
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CourseHero course={course} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CourseContent course={course} />
        </div>
        <RelatedCourses courses={courses} currentCourseId={course.id} />
      </main>
      <Footer />
    </div>
  )
}
