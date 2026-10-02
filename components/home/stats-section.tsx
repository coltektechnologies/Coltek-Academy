"use client"

import { useState, useEffect } from "react"

interface Stats {
  studentsEnrolled: number
  coursesAvailable: number
  certificatesIssued: number
  graduates: number
}

// All figures are computed live from Firestore by /api/stats
export function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
  }, [])

  const items = [
    { value: stats?.studentsEnrolled, label: "Students Enrolled" },
    { value: stats?.graduates, label: "Graduates" },
    { value: stats?.coursesAvailable, label: "Courses Available" },
    { value: stats?.certificatesIssued, label: "Certificates Issued" },
  ]

  return (
    <section className="py-16 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-2">
                {typeof item.value === "number" ? item.value.toLocaleString() : "—"}
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
