import { Heart, Shield, Target, Zap } from "lucide-react"
import { SectionHeader } from "@/components/academy/section-header"

const values = [
  {
    icon: Target,
    title: "Excellence",
    description:
      "We uphold high standards in our training delivery, curriculum design, mentorship, and learner support to ensure quality and relevance.",
  },
  {
    icon: Heart,
    title: "Learner-Focused",
    description: "Every decision we make is guided by what's best for our learners' success.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "We embrace continuous improvement by adapting our curriculum, tools, and teaching methods to match evolving technology and industry trends.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "We operate with transparency, accountability, and ethical practices, building trust with our learners, partners, and community.",
  },
]

export function ValuesSection() {
  return (
    <section aria-labelledby="values-heading" className="bg-muted py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="values-heading"
          eyebrow="Our values"
          title="The principles that guide us"
          description="These principles guide everything we do at Coltek Academy."
        />
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <li key={value.title}>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <value.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{value.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{value.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
