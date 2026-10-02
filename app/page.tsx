import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { ValueStrip } from "@/components/home/value-strip"
import { ProgrammesSection } from "@/components/home/programmes-section"
import { WhySection } from "@/components/home/why-section"
import { LearningJourney } from "@/components/home/learning-journey"
import { ProjectsSection } from "@/components/home/projects-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { HowToJoin } from "@/components/home/how-to-join"
import { HomeFaqSection } from "@/components/home/faq-section"
import { CTASection } from "@/components/home/cta-section"

const description =
  "Coltek Academy is the training arm of Coltek Technologies in Accra, Ghana. Learn web development, design, data and more through hands-on, project-based courses."

export const metadata: Metadata = {
  title: "Coltek Academy — Practical tech courses in Accra, Ghana",
  description,
  openGraph: {
    title: "Coltek Academy — Practical tech courses",
    description,
    type: "website",
  },
}

// Server-rendered page; only sections that load live data (courses, stats, projects, testimonials) run on the client.
// The projects section stays hidden until an admin publishes a real student project at /admin/projects.
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <HeroSection />
        <ValueStrip />
        <ProgrammesSection />
        <WhySection />
        <LearningJourney />
        <ProjectsSection />
        <TestimonialsSection />
        <HowToJoin />
        <HomeFaqSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
