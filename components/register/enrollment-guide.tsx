import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// The actual enrollment process, in order
export const ENROLLMENT_STAGES = [
  { title: "Choose your course", description: "Pick the course you want to join." },
  { title: "Check the requirements", description: "Review the level, prerequisites, duration, mode and fee." },
  { title: "Submit your details", description: "Tell us about yourself and your learning goals." },
  { title: "Pay or enroll", description: "Pay securely with Paystack. Free courses enroll you straight away." },
  { title: "Get your confirmation", description: "We email your confirmation with an invite to the student WhatsApp group." },
  { title: "Start learning", description: "Your course appears in your dashboard." },
]

/** Overview of the enrollment stages. `activeStages` are 1-based stage numbers in progress. */
export function EnrollmentGuide({ activeStages, className }: { activeStages: number[]; className?: string }) {
  const firstActive = Math.min(...activeStages)

  return (
    <ol className={cn("space-y-5", className)}>
      {ENROLLMENT_STAGES.map((stage, index) => {
        const number = index + 1
        const active = activeStages.includes(number)
        const done = number < firstActive
        return (
          <li key={stage.title} className="flex gap-3" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active && "bg-primary text-primary-foreground",
                done && "bg-success-subtle text-success",
                !active && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : number}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                {stage.title}
                {done && <span className="sr-only"> (done)</span>}
                {active && <span className="sr-only"> (current)</span>}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{stage.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
