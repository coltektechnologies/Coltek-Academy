// The Academy's own milestones (2025)
const milestones = [
  {
    period: "2025 · Q1",
    title: "Coltek Academy founded",
    description:
      "Established as the training arm of Coltek Technologies, focusing on practical coding and technology skills.",
  },
  {
    period: "2025 · Q2",
    title: "Platform development",
    description: "Built our learning platform and infrastructure to support scalable and effective online training programs.",
  },
  {
    period: "2025 · Q3",
    title: "Curriculum finalized",
    description: "Completed development of our curriculum based on industry needs and learner feedback.",
  },
  {
    period: "2025 · Q4",
    title: "First programs launched",
    description: "Launched our initial coding programs, bringing hands-on learning to our first cohort of students.",
  },
]

export function MilestonesSection() {
  return (
    <section aria-labelledby="journey-heading" className="bg-muted py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <p className="text-sm font-semibold text-accent">Our journey</p>
          <h2
            id="journey-heading"
            className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
          >
            How we got here
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Here&apos;s how Coltek Academy has grown so far.</p>
        </div>
        <ol className="relative space-y-10 border-l-2 border-border pl-8 lg:col-span-8">
          {milestones.map((milestone) => (
            <li key={milestone.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[2.6rem] top-1 size-4 rounded-full border-4 border-muted bg-primary"
              />
              <p className="text-sm font-semibold text-accent">{milestone.period}</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{milestone.title}</h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">{milestone.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
