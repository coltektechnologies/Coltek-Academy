import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseCard } from "@/components/course-card"
import { CTASection } from "@/components/academy/cta-section"
import { SectionHeader } from "@/components/academy/section-header"
import { CourseHero } from "@/components/course-detail/course-hero"
import { CourseBody } from "@/components/course-detail/course-body"
import { MobileEnrollBar } from "@/components/course-detail/enroll-action"
import { formatCoursePrice, isCourseUpcoming } from "@/lib/course-display"
import { getPublicCourseBySlug, getRelatedPublicCourses } from "@/lib/public-course"
import { getPublishedProjects } from "@/lib/public-projects"

// Course data changes rarely; refresh the rendered page at most once a minute
export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const course = await getPublicCourseBySlug(slug).catch(() => null)
  if (!course) return { title: "Course not found | Coltek Academy" }
  return {
    title: `${course.title} | Coltek Academy`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      type: "website",
      images: course.image ? [course.image] : undefined,
    },
    alternates: { canonical: `/courses/${course.slug}` },
  }
}

export default async function CoursePage({ params }: Params) {
  const { slug } = await params
  const course = await getPublicCourseBySlug(slug)
  if (!course) notFound()

  const upcoming = isCourseUpcoming(course)
  const priceLabel = formatCoursePrice(course)
  const [related, projects] = await Promise.all([
    getRelatedPublicCourses(course.category, course.id).catch(() => []),
    getPublishedProjects({ courseId: course.id }).catch(() => []),
  ])

  // Structured data for search engines, using only real course fields
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "EducationalOrganization", name: "Coltek Academy" },
    inLanguage: course.language || undefined,
    educationalLevel: course.level || undefined,
    ...(!upcoming && typeof course.price === "number" && course.price > 0
      ? { offers: { "@type": "Offer", price: course.price, priceCurrency: "GHS", category: "Paid" } }
      : {}),
  }

  return (
    // Bottom padding on small screens leaves room for the fixed enroll bar below the footer
    <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
      <Navbar />
      <main id="main" className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <CourseHero course={course} />
        <CourseBody course={course} projects={projects} />

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="border-t border-border bg-muted py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader id="related-heading" title={`More ${course.category} courses`} />
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.id}>
                    <CourseCard course={item} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <CTASection
          title={upcoming ? `${course.title} is coming soon` : `Ready to join ${course.title}?`}
          description={
            upcoming
              ? "Browse the courses that are open now, or contact us to ask about this one."
              : "Create your account if you don't have one yet, complete the short registration form and confirm your place."
          }
          primaryAction={
            upcoming
              ? { label: "Browse courses", href: "/courses" }
              : { label: "Enroll now", href: `/register?course=${encodeURIComponent(course.id)}` }
          }
          secondaryAction={upcoming ? { label: "Contact us", href: "/contact" } : { label: "How enrollment works", href: "/#how-to-join" }}
        />
      </main>
      <Footer />
      <MobileEnrollBar courseId={course.id} courseTitle={course.title} upcoming={upcoming} priceLabel={priceLabel} />
    </div>
  )
}
