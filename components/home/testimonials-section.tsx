"use client"

import { useEffect, useState } from "react"
import { TestimonialCard } from "@/components/academy/testimonial-card"
import { Skeleton } from "@/components/ui/skeleton"

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

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Our Students Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real feedback from learners building practical skills with Coltek Academy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
