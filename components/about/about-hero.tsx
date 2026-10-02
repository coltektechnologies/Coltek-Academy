import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function AboutHero() {
  return (
    <header className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pt-14 lg:px-8 lg:pb-24">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>About</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-accent">About Coltek Academy</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
              Practical technology education, from a technology company
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Founded as the training arm of Coltek Technologies, Coltek Academy equips learners with practical coding and
              technology skills through hands-on learning, real-world projects and industry-relevant instruction.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button asChild size="lg">
                <Link href="/courses">
                  Explore courses
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#leadership">Meet the team</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
              <Image
                src="/about-classroom.jpg"
                alt="An instructor guiding students working on laptops and a shared screen"
                fill
                priority
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
