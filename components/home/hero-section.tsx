import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Course categories that exist in the catalogue; each links to the filtered course list
const learningAreas = [
  { label: "Web Development", category: "Web" },
  { label: "UI/UX Design", category: "UI/UX" },
  { label: "Mobile Apps", category: "Mobile App" },
  { label: "Data Science", category: "Data Science" },
  { label: "Graphic Design", category: "Graphic Design" },
]

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-14 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-6">
          <p className="text-sm font-semibold text-accent">Coltek Academy · Accra, Ghana</p>
          <h1
            id="hero-heading"
            className="mt-3 text-4xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl"
          >
            Build practical tech skills for a real career in technology
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Coltek Academy is the training arm of Coltek Technologies. Learn web development, design, data and
            more through hands-on courses built around real-world projects.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg">
              <Link href="/courses">
                Explore courses
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-to-join">How enrollment works</Link>
            </Button>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-sm font-medium text-foreground">Learning areas</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {learningAreas.map((area) => (
                <li key={area.category}>
                  <Link
                    href={`/courses?category=${encodeURIComponent(area.category)}`}
                    className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {area.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted sm:aspect-video lg:aspect-square">
            <Image
              src="/diverse-students-learning-together-in-modern-class.jpg"
              alt="Students learning together with laptops and tablets in a classroom"
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
