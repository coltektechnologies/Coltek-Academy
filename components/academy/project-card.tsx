import { Code2, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface ProjectCardData {
  title: string
  studentName: string
  cohort?: string
  description: string
  technologies: string[]
  imageUrl: string
  projectUrl?: string
  repoUrl?: string
}

const linkClasses =
  "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

// Student project card — real projects published by admins at /admin/projects (DESIGN_SYSTEM.md §11b)
export function ProjectCard({ project, headingLevel = "h3" }: { project: ProjectCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="aspect-video overflow-hidden border-b border-border bg-muted">
        {/* Admin-uploaded screenshot (data URL or https), so a plain img is used */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.imageUrl}
          alt={`Screenshot of ${project.title}`}
          loading="lazy"
          className="size-full object-cover object-top"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <Heading className="text-lg font-semibold leading-snug text-foreground">{project.title}</Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          By {project.studentName}
          {project.cohort && ` · ${project.cohort}`}
        </p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{project.description}</p>

        {project.technologies.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies used">
            {project.technologies.map((tech) => (
              <li key={tech}>
                <Badge variant="outline">{tech}</Badge>
              </li>
            ))}
          </ul>
        )}

        {(project.projectUrl || project.repoUrl) && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
            {project.projectUrl && (
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={linkClasses}>
                <ExternalLink className="size-4" aria-hidden="true" />
                Live project
                <span className="sr-only"> for {project.title} (opens in a new tab)</span>
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className={linkClasses}>
                <Code2 className="size-4" aria-hidden="true" />
                Source code
                <span className="sr-only"> for {project.title} (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
