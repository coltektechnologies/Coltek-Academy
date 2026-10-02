import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/academy/section-header"

// The actual enrollment flow: account → course → registration + Paystack → confirmation and dashboard
const steps = [
  {
    title: "Create your account",
    description: "Sign up for free with your email, Google or GitHub account.",
  },
  {
    title: "Choose a course",
    description: "Browse the catalogue and open a course to see its curriculum, duration, learning mode and fee.",
  },
  {
    title: "Register and pay",
    description:
      "Complete a short registration form, choose your preferred schedule and pay securely with Paystack. Free courses enroll you straight away.",
  },
  {
    title: "Start learning",
    description:
      "You receive a confirmation email and an invitation to the student WhatsApp group, and your course appears in your dashboard.",
  },
]

export function HowToJoin() {
  return (
    <section id="how-to-join" aria-labelledby="join-heading" className="scroll-mt-20 py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-5">
          <SectionHeader
            id="join-heading"
            eyebrow="How to join"
            title="Enroll in four steps"
            description="Everything happens online, from choosing a course to confirming your place."
            className="mb-8"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                Browse courses
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <ol className="divide-y divide-border rounded-xl border border-border bg-card lg:col-span-7">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-5 p-6 sm:p-8">
              <span className="text-3xl font-bold leading-none tabular-nums text-accent" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-semibold leading-snug text-foreground">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
