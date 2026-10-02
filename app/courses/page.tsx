import type { Metadata } from "next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/academy/page-header"
import { CTASection } from "@/components/academy/cta-section"
import { LoadingState } from "@/components/academy/states"
import { CourseCatalogue } from "@/components/courses/course-catalogue"

const description =
  "Browse Coltek Academy's hands-on courses in web development, design, data, mobile and more. Compare level, duration, learning mode and fee."

export const metadata: Metadata = {
  title: "Courses | Coltek Academy",
  description,
  openGraph: { title: "Courses | Coltek Academy", description, type: "website" },
}

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Courses" }]}
          eyebrow="Course catalogue"
          title="Find the right course for you"
          description="Hands-on courses in web development, design, data, mobile and more. Compare level, duration, learning mode and fee, then open a course to see its full curriculum."
        />

        {/* The catalogue reads filters from the URL, so it renders inside a Suspense boundary */}
        <Suspense fallback={<LoadingState size="page" label="Loading courses…" />}>
          <CourseCatalogue />
        </Suspense>

        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
          <CTASection
            variant="panel"
            title="Not sure which course to choose?"
            description="See how enrollment works, or ask our team for advice."
            primaryAction={{ label: "Contact us", href: "/contact" }}
            secondaryAction={{ label: "How enrollment works", href: "/#how-to-join" }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
