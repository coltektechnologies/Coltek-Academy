"use client"

import { useEffect, useState } from "react"
import { SectionHeader } from "@/components/academy/section-header"
import { ProjectCard, type ProjectCardData } from "@/components/academy/project-card"

interface PublicProject extends ProjectCardData {
  id: string
}

const MAX_PROJECTS = 6

/**
 * Student projects published by admins at /admin/projects.
 * Renders nothing until at least one real project is published — no placeholders.
 */
export function ProjectsSection() {
  const [projects, setProjects] = useState<PublicProject[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/projects", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data.slice(0, MAX_PROJECTS) : []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  if (projects.length === 0) return null

  // Avoid a lone orphan card: 2 or 4 projects sit in a 2-column grid
  const gridClasses =
    projects.length === 1
      ? "mx-auto max-w-xl"
      : projects.length === 2 || projects.length === 4
        ? "mx-auto max-w-5xl sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <section aria-labelledby="projects-heading" className="border-t border-border py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="projects-heading"
          eyebrow="Student projects"
          title="Built by our students"
          description="Real projects created by Coltek Academy students during their courses."
        />
        <ul className={`grid gap-6 ${gridClasses}`}>
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
