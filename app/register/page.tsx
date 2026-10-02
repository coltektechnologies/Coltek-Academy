"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ChevronDown, UserRound } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingState } from "@/components/academy/states"
import { ProgressSteps } from "@/components/register/progress-steps"
import { EnrollmentGuide } from "@/components/register/enrollment-guide"
import { StepCourseSelection } from "@/components/register/step-course-selection"
import { StepDetails } from "@/components/register/step-details"
import { StepPayment } from "@/components/register/step-payment"
import { RegistrationSuccess } from "@/components/register/registration-success"
import { useAuth } from "@/hooks/use-auth"
import type { RegistrationFormData } from "@/lib/types"

const steps = ["Course", "Your details", "Review & enroll"]

// Fields in on-screen order, used to focus the first problem
const FIELD_ORDER = ["selectedCourseId", "learningGoals", "firstName", "lastName", "email", "highestEducation", "agreeToTerms"]

// Which enrollment-guide stages each form step represents
const ACTIVE_STAGES: Record<number, number[]> = { 1: [1, 2], 2: [3], 3: [4] }

const initialFormData: RegistrationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  highestEducation: "",
  fieldOfStudy: "",
  currentOccupation: "",
  yearsOfExperience: "",
  selectedCourseId: "",
  learningGoals: "",
  preferredSchedule: "weekdays",
  // Paystack is the only supported payment method
  paymentMethod: "credit-card",
  agreeToTerms: false,
}

function SignInGate({ redirect }: { redirect: string }) {
  const target = encodeURIComponent(redirect)
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRound className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Sign in to enroll</h1>
      <p className="mt-2 text-muted-foreground">
        You need a free Coltek Academy account to enroll. Your enrollments and certificates are kept in your dashboard, and
        you&apos;ll come straight back here afterwards.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={`/signup?redirect=${target}`}>Create a free account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/login?redirect=${target}`}>Log in</Link>
        </Button>
      </div>
    </div>
  )
}

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const preselectedCourseId = searchParams.get("course") || ""

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RegistrationFormData>({
    ...initialFormData,
    selectedCourseId: preselectedCourseId,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)
  const stepHeadingRef = useRef<HTMLDivElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (preselectedCourseId) {
      setFormData((prev) => ({ ...prev, selectedCourseId: preselectedCourseId }))
    }
  }, [preselectedCourseId])

  // Prefill from the signed-in account (only empty fields)
  useEffect(() => {
    if (!user) return
    const [first = "", ...rest] = (user.displayName || "").trim().split(/\s+/)
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || first,
      lastName: prev.lastName || rest.join(" "),
      email: prev.email || user.email || "",
    }))
  }, [user])

  const updateFormData = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(data).forEach((key) => delete next[key])
      return next
    })
  }

  // Same rules as before, grouped by the new steps
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {}

      if (step === 1) {
        if (!formData.selectedCourseId) newErrors.selectedCourseId = "Choose the course you want to enroll in."
        if (!formData.learningGoals.trim()) newErrors.learningGoals = "Tell us briefly what you want to achieve."
      }
      if (step === 2) {
        if (!formData.firstName.trim()) newErrors.firstName = "Enter your first name."
        if (!formData.lastName.trim()) newErrors.lastName = "Enter your last name."
        if (!formData.email.trim()) {
          newErrors.email = "Enter your email address."
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Enter a valid email address, like name@example.com."
        }
        if (!formData.highestEducation) newErrors.highestEducation = "Select your highest education level."
      }
      if (step === 3) {
        if (!formData.agreeToTerms) newErrors.agreeToTerms = "Please accept the Terms & Conditions to continue."
      }

      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) {
        // Announce the summary, then move focus to the first field with a problem
        requestAnimationFrame(() => {
          const first = FIELD_ORDER.find((field) => newErrors[field])
          const element = first ? document.getElementById(first) : null
          ;(element || errorSummaryRef.current)?.focus()
        })
        return false
      }
      return true
    },
    [formData],
  )

  const goToStep = (step: number) => {
    setErrors({})
    setCurrentStep(step)
    requestAnimationFrame(() => {
      stepHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      stepHeadingRef.current?.focus({ preventScroll: true })
    })
  }

  const handleNext = () => {
    if (validateStep(currentStep)) goToStep(currentStep + 1)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepCourseSelection formData={formData} updateFormData={updateFormData} errors={errors} />
      case 2:
        return <StepDetails formData={formData} updateFormData={updateFormData} errors={errors} />
      case 3:
        return (
          <StepPayment
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            onPaymentSuccess={() => setIsComplete(true)}
            onValidate={() => validateStep(3)}
            onBack={() => goToStep(2)}
            onEditStep={goToStep}
          />
        )
      default:
        return null
    }
  }

  const errorList = Object.entries(errors)

  let content: React.ReactNode
  if (loading) {
    content = <LoadingState size="page" label="Checking your account…" />
  } else if (!user) {
    const courseParam = preselectedCourseId ? `?course=${encodeURIComponent(preselectedCourseId)}` : ""
    content = <SignInGate redirect={`/register${courseParam}`} />
  } else if (isComplete) {
    content = (
      <div className="mx-auto max-w-2xl">
        <RegistrationSuccess formData={formData} />
      </div>
    )
  } else {
    content = (
      <>
        <div className="mb-8">
          <p className="text-sm font-semibold text-accent">Enrollment</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Enroll in a course</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Three short steps. Everything is done online, and you can go back to change anything before you enroll.
          </p>
        </div>

        {/* grid-cols-1 (minmax(0,1fr)) keeps long content from widening the page on phones */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Mobile: collapsible guide above the form */}
          <details className="group rounded-xl border border-border bg-muted p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground">
              How enrollment works
              <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <EnrollmentGuide activeStages={ACTIVE_STAGES[currentStep]} className="mt-4" />
          </details>

          <div className="min-w-0 lg:col-span-8">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <ProgressSteps currentStep={currentStep} steps={steps} />

              <div ref={stepHeadingRef} tabIndex={-1} className="scroll-mt-24 outline-none" aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]}`}>
                {errorList.length > 0 && (
                  <div ref={errorSummaryRef} tabIndex={-1} className="mb-6 outline-none">
                    <Alert variant="destructive">
                      <AlertTriangle aria-hidden="true" />
                      <AlertTitle>
                        {errorList.length === 1 ? "There is 1 problem to fix" : `There are ${errorList.length} problems to fix`}
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc space-y-1 pl-4">
                          {errorList.map(([field, message]) => (
                            <li key={field}>
                              <a href={`#${field}`} className="underline underline-offset-4">
                                {message}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {renderStep()}
              </div>

              {/* Steps 1–2 navigation (step 3 has its own action row) */}
              {currentStep < 3 && (
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {currentStep > 1 ? (
                    <Button variant="outline" size="lg" onClick={() => goToStep(currentStep - 1)}>
                      Back
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="lg">
                      <Link href="/courses">Cancel</Link>
                    </Button>
                  )}
                  <Button size="lg" onClick={handleNext} className="sm:min-w-48">
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: guide alongside the form */}
          <aside aria-labelledby="guide-heading" className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-muted p-6">
              <h2 id="guide-heading" className="font-semibold text-foreground">
                How enrollment works
              </h2>
              <EnrollmentGuide activeStages={ACTIVE_STAGES[currentStep]} className="mt-5" />
              <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                Questions?{" "}
                <Link href="/contact" className="font-medium text-primary underline underline-offset-4">
                  Contact our team
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">{content}</div>
      </main>
      <Footer />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState size="page" label="Preparing enrollment…" />}>
      <RegisterPageContent />
    </Suspense>
  )
}
