import { Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  name: string
  role?: string
  content: string
  /** Admin-entered rating (1–5). Omit when the testimonial has no real rating. */
  rating?: number
  avatarUrl?: string
  className?: string
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CA"
  )
}

// Testimonial card — see DESIGN_SYSTEM.md §10. Only for published testimonials from Firestore.
export function TestimonialCard({ name, role, content, rating, avatarUrl, className }: TestimonialCardProps) {
  const stars = typeof rating === "number" ? Math.min(5, Math.max(0, Math.round(rating))) : null

  return (
    <Card className={cn("h-full gap-0 p-6", className)}>
      <figure className="flex h-full flex-col">
        {stars !== null && (
          <div className="mb-4 flex items-center gap-1">
            <span className="sr-only">Rated {stars} out of 5</span>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={cn("size-4", index < stars ? "fill-warning text-warning" : "text-border")}
              />
            ))}
          </div>
        )}
        <blockquote className="flex-1 leading-relaxed text-muted-foreground">
          <p>&ldquo;{content}&rdquo;</p>
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          {avatarUrl ? (
            // Testimonial avatars are admin-uploaded URLs on external storage
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            >
              {getInitials(name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">{name}</div>
            {role && <div className="truncate text-sm text-muted-foreground">{role}</div>}
          </div>
        </figcaption>
      </figure>
    </Card>
  )
}
