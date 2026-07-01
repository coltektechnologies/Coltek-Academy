"use client"

import { useEffect, useState } from "react"
import { Quote, Star } from "lucide-react"

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatarUrl: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
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
                <div key={index} className="rounded-lg border border-border/50 bg-card p-6">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse mb-4" />
                  <div className="space-y-2 mb-6">
                    <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            : testimonials.map((testimonial) => (
                <article key={testimonial.id} className="relative rounded-lg border border-border/50 bg-card p-6 shadow-sm">
                  <Quote className="absolute right-5 top-5 h-9 w-9 text-primary/10" />
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < testimonial.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatarUrl ? (
                      <img
                        src={testimonial.avatarUrl}
                        alt={testimonial.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(testimonial.name) || "CA"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{testimonial.role}</div>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  )
}
