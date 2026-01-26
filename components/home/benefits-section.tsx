import { Award, Clock, Users, Headphones, BookOpen, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: BookOpen,
    title: "Expert Instructors",
    description: "Learn from industry professionals with years of real-world experience.",
  },
  {
    icon: Clock,
    title: "Learn at Your Pace",
    description: "Access courses anytime, anywhere, and learn on your own schedule.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Get recognized certificates to showcase your new skills to employers.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join a vibrant community of learners and get help when you need it.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated support team is always here to help you succeed.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth",
    description: "Gain in-demand skills that will help you advance in your career.",
  },
]

export function BenefitsSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Coltek Academy?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We are committed to providing the best learning experience with features designed for your success.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <benefit.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
