import { SectionHeader } from "@/components/academy/section-header"

// Stages that reflect the Academy's actual approach (course curricula, hands-on projects, certificates)
const stages = [
  {
    title: "Follow a structured curriculum",
    description: "Work through your course module by module, lesson by lesson.",
  },
  {
    title: "Practise hands-on",
    description: "Apply each new concept with practical exercises as you go.",
  },
  {
    title: "Build real-world projects",
    description: "Put your skills together in projects that reflect real industry challenges.",
  },
  {
    title: "Earn your certificate",
    description: "Complete your course and download your certificate of completion from your dashboard.",
  },
]

export function LearningJourney() {
  return (
    <section aria-labelledby="learning-heading" className="py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="learning-heading"
          eyebrow="Learning experience"
          title="How you'll learn"
          description="Every course follows the same practical path, from first lesson to finished project."
        />
        {/* Mobile/tablet: vertical timeline. Desktop: four columns joined by a line. */}
        <div className="relative">
          <span aria-hidden="true" className="absolute left-5 top-5 bottom-5 w-px bg-border lg:hidden" />
          <span aria-hidden="true" className="absolute left-5 right-5 top-5 hidden h-px bg-border lg:block" />
          <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
          {stages.map((stage, index) => (
            <li key={stage.title} className="relative flex gap-5 lg:flex-col lg:gap-0">
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-4 ring-background">
                {index + 1}
              </span>
              <div className="lg:mt-6">
                <h3 className="text-lg font-semibold leading-snug text-foreground">{stage.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{stage.description}</p>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
