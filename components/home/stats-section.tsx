"use client"

import { useState, useEffect } from "react"
import { stats } from "@/lib/data"

export function StatsSection() {
  const [courseCount, setCourseCount] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourseCount(data.length)
        }
      })
      .catch(() => setCourseCount(0))
  }, [])

  return (
    <section className="py-16 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-2">
                {stat.value === null ? (courseCount !== null ? `${courseCount}+` : "—") : stat.value}
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
