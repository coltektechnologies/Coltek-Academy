import { GraduationCap, Users, Award } from "lucide-react"

export function AboutHero() {
  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Transforming Lives Through Education</h1>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Since 2018, EduLearn has been at the forefront of online education, empowering individuals worldwide to
            achieve their career goals through expert-led courses and hands-on learning experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">50,000+</h3>
            <p className="text-muted-foreground text-sm">Graduates Worldwide</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">100+</h3>
            <p className="text-muted-foreground text-sm">Expert Instructors</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">95%</h3>
            <p className="text-muted-foreground text-sm">Job Placement Rate</p>
          </div>
        </div>
      </div>
    </section>
  )
}
