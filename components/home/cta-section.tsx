import { CTASection as CTABand } from "@/components/academy/cta-section"

export function CTASection() {
  return (
    <CTABand
      gradient
      title="Ready to start learning?"
      description="Pick the course that fits your goals, create your free account and enroll online."
      primaryAction={{ label: "Browse courses", href: "/courses" }}
      secondaryAction={{ label: "Create an account", href: "/signup" }}
    />
  )
}
