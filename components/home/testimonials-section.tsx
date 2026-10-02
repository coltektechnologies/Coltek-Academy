"use client"

import { useEffect, useState } from "react"
import { TestimonialCard } from "@/components/academy/testimonial-card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/academy/section-header"

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatarUrl: string
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonials", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to load testimonials")
        }

        const data = await response.json()
        setTestimonials(Array.isArray(data) ? data.slice(0, 6) : [])
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error loading testimonials:", error)
          setTestimonials([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchTestimonials()

    return () => controller.abort()
  }, [])

  if (!isLoading && testimonials.length === 0) {
    return null
  }

  // Avoid a lone orphan card: 2 or 4 testimonials sit in a 2-column grid
  const count = isLoading ? 3 : testimonials.length
  const gridClasses = count === 2 || count === 4 ? "mx-auto max-w-5xl md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"

  return (
    <section aria-labelledby="testimonials-heading" className="bg-muted py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="testimonials-heading"
          align="center"
          eyebrow="Student experience"
          title="What our students say"
          description="Real feedback from learners building practical skills with Coltek Academy."
        />

        <div className={`grid gap-6 ${gridClasses}`}>
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} aria-hidden="true" className="rounded-xl border border-border bg-card p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            : testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  name={testimonial.name}
                  role={testimonial.role}
                  content={testimonial.content}
                  rating={testimonial.rating}
                  avatarUrl={testimonial.avatarUrl}
                />
              ))}
        </div>
      </div>
    </section>
  )
}
