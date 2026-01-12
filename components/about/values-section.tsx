import { Target, Heart, Zap, Shield } from "lucide-react"

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We maintain the highest standards in course content, instruction, and student support.",
  },
  {
    icon: Heart,
    title: "Student-First",
    description: "Every decision we make is guided by what's best for our learners' success.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We continuously evolve our platform and curriculum to stay ahead of industry trends.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description: "We're transparent about outcomes and committed to honest, ethical practices.",
  },
]

export function ValuesSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Core Values</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These principles guide everything we do at EduLearn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <div key={value.title} className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
