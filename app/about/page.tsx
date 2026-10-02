import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CTASection } from "@/components/academy/cta-section"
import { AboutHero } from "@/components/about/about-hero"
import { MissionSection } from "@/components/about/mission-section"
import { ApproachSection } from "@/components/about/approach-section"
import { ValuesSection } from "@/components/about/values-section"
import { TeamSection } from "@/components/about/team-section"
import { MilestonesSection } from "@/components/about/milestones-section"
import { CommunitySection } from "@/components/about/community-section"

const description =
  "Coltek Academy is the training arm of Coltek Technologies, equipping learners with practical coding and technology skills through hands-on learning and real-world projects."

export const metadata: Metadata = {
  title: "About | Coltek Academy",
  description,
  openGraph: { title: "About Coltek Academy", description, type: "website" },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <AboutHero />
        <MissionSection />
        <ApproachSection />
        <ValuesSection />
        <TeamSection />
        <MilestonesSection />
        <CommunitySection />
        <CTASection
          gradient
          title="Start learning with Coltek Academy"
          description="Explore the courses, find the one that fits your goals and enroll online."
          primaryAction={{ label: "Explore courses", href: "/courses" }}
          secondaryAction={{ label: "Contact us", href: "/contact" }}
        />
      </main>
      <Footer />
    </div>
  )
}
