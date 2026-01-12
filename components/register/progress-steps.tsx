import { Check } from "lucide-react"

interface ProgressStepsProps {
  currentStep: number
  steps: string[]
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = currentStep > stepNumber
          const isCurrent = currentStep === stepNumber

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 ${isCompleted ? "bg-primary" : "bg-secondary"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
