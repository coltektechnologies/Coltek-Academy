const milestones = [
  { year: "2018", title: "Founded", description: "EduLearn was founded with a vision to transform online education." },
  {
    year: "2019",
    title: "10,000 Students",
    description: "Reached our first major milestone of 10,000 enrolled students.",
  },
  {
    year: "2020",
    title: "100 Courses",
    description: "Expanded our catalog to over 100 courses across multiple disciplines.",
  },
  {
    year: "2021",
    title: "Series A Funding",
    description: "Raised $15M to accelerate platform development and expansion.",
  },
  {
    year: "2022",
    title: "Global Expansion",
    description: "Launched in 50+ countries with localized content and support.",
  },
  {
    year: "2023",
    title: "50,000 Graduates",
    description: "Celebrated 50,000 successful graduates entering the workforce.",
  },
  {
    year: "2024",
    title: "AI-Powered Learning",
    description: "Introduced AI tutoring and personalized learning paths.",
  },
  {
    year: "2025",
    title: "Industry Partnerships",
    description: "Partnered with Fortune 500 companies for direct hiring pipelines.",
  },
]

export function MilestonesSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Journey</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From a small startup to a global education platform—here&apos;s how we grew.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.year}
                className={`relative flex items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background md:-translate-x-1/2 z-10" />

                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <span className="text-primary font-bold text-lg">{milestone.year}</span>
                    <h3 className="font-semibold text-foreground mt-1 mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground text-sm">{milestone.description}</p>
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
