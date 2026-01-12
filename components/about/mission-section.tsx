import Image from "next/image"

export function MissionSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              At EduLearn, we believe that quality education should be accessible to everyone, regardless of their
              background or location. Our mission is to democratize learning by providing world-class courses taught by
              industry experts.
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
