import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressStepsProps {
  currentStep: number
  steps: string[]
}

/** Form progress: compact "Step x of n" on mobile, full step row from sm. */
export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <nav aria-label="Enrollment progress" className="mb-8">
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} of {steps.length} · {steps[currentStep - 1]}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* sm and up */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const number = index + 1
          const done = currentStep > number
          const current = currentStep === number
          return (
            <li key={step} className={cn("flex items-center", index < steps.length - 1 && "flex-1")} aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  done || current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : number}
              </span>
              <span className={cn("ml-3 text-sm font-medium", current ? "text-foreground" : "text-muted-foreground")}>
                {step}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={cn("mx-4 h-px flex-1", done ? "bg-primary" : "bg-border")} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
