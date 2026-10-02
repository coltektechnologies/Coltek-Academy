// Learning philosophy, drawn from the Academy's own mission text
const principles = [
  {
    title: "Learn by doing",
    description: "Students go beyond theory by working on practical projects from the start of each course.",
  },
  {
    title: "Grounded in real-world problems",
    description: "The curriculum is designed around real-world challenges and current industry needs.",
  },
  {
    title: "Build confidence and experience",
    description: "Practical projects build problem-solving ability, confidence and job-ready experience.",
  },
  {
    title: "Guided, not left alone",
    description: "Learners get the guidance, tools and mentorship they need to keep progressing.",
  },
]

export function ApproachSection() {
  return (
    <section aria-labelledby="approach-heading" className="py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <p className="text-sm font-semibold text-accent">Our approach</p>
          <h2
            id="approach-heading"
            className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
          >
            How we think about learning
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Hands-on learning, real-world projects and industry-relevant instruction, so students are prepared for careers
            in the tech ecosystem.
          </p>
        </div>
        <ol className="divide-y divide-border border-y border-border lg:col-span-8">
          {principles.map((principle, index) => (
            <li key={principle.title} className="grid gap-2 py-6 sm:grid-cols-12 sm:gap-6">
              <span className="text-sm font-semibold tabular-nums text-accent sm:col-span-1 sm:pt-1" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold leading-snug text-foreground sm:col-span-4">{principle.title}</h3>
              <p className="leading-relaxed text-muted-foreground sm:col-span-7">{principle.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
