"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/academy/stat-card"

interface Stats {
  studentsEnrolled: number
  coursesAvailable: number
  certificatesIssued: number
  graduates: number
}

/** Live figures computed from Firestore by /api/stats. Shows "—" until loaded; never guesses. */
export function LiveStats({ className }: { className?: string }) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/stats", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const items = [
    { value: stats?.studentsEnrolled, label: "Students enrolled" },
    { value: stats?.graduates, label: "Graduates" },
    { value: stats?.coursesAvailable, label: "Courses" },
    { value: stats?.certificatesIssued, label: "Certificates issued" },
  ]

  return (
    <dl className={className} aria-busy={stats === null}>
      {items.map((item) => (
        <StatCard key={item.label} variant="onPrimary" value={item.value} label={item.label} />
      ))}
    </dl>
  )
}
