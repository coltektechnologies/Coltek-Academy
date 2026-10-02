import { CTASection as CTABand } from "@/components/academy/cta-section"

export function CTASection() {
  return (
    <CTABand
      gradient
      title="Ready to Start Your Learning Journey?"
      description="Join learners who are already advancing their careers with Coltek Academy. Start today and transform your future."
      primaryAction={{ label: "Browse Courses", href: "/courses" }}
      secondaryAction={{ label: "Register Now", href: "/register" }}
    />
  )
}
