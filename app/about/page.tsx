import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AboutHero } from "@/components/about/about-hero"
import { MissionSection } from "@/components/about/mission-section"
import { TeamSection } from "@/components/about/team-section"
import { ValuesSection } from "@/components/about/values-section"
import { MilestonesSection } from "@/components/about/milestones-section"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AboutHero />
        <MissionSection />
        <ValuesSection />
        <TeamSection />
        <MilestonesSection />
      </main>
      <Footer />
    </div>
  )
}
