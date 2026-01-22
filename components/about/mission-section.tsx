import Image from "next/image"

export function MissionSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
            At COLTEK ACADEMY, we believe that practical technology education should be accessible to everyone, regardless of background or location. Our mission is to equip learners with in-demand coding and digital skills through hands-on, industry-focused training.

As a training arm of Coltek Technologies, we design our curriculum around real-world challenges and current industry needs. Our students go beyond theory by working on practical projects that build problem-solving ability, confidence, and job-ready experience.

Whether you are starting your tech journey, transitioning into a new career, or strengthening your existing skills, COLTEK ACADEMY provides the guidance, tools, and mentorship needed to succeed in today’s digital world.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              We partner with leading companies and universities to create curriculum that reflects real-world demands.
              Our students don&apos;t just learn theory—they gain practical skills that employers value.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you&apos;re looking to switch careers, advance in your current role, or simply expand your
              knowledge, EduLearn provides the tools and support you need to succeed.
            </p>
          </div>
          <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
            <Image src="/diverse-students-learning-together-in-modern-class.jpg" alt="Students learning together" fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
