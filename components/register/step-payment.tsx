"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCourseById } from "@/lib/courses"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { saveUserEnrollment } from "@/lib/enrollment"
import type { RegistrationFormData } from "@/lib/types"

const IS_DEV_BUILD = process.env.NODE_ENV !== "production"

// Paystack type declarations
declare global {
  interface Window {
    PaystackPop?: any
  }
}

interface StepPaymentProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
  onPaymentSuccess?: () => void
  /** Validates this step (terms) and focuses the first problem; returns true when valid. */
  onValidate: () => boolean
  onBack: () => void
  /** Jump back to a step to edit it. */
  onEditStep: (step: number) => void
}

const SCHEDULE_LABELS: Record<string, string> = { weekdays: "Weekdays (Mon – Fri)", weekends: "Weekends (Sat – Sun)" }

/** Step 3: review the application, accept the terms, then pay with Paystack or enroll for free. */
export function StepPayment({ formData, updateFormData, errors, onPaymentSuccess, onValidate, onBack, onEditStep }: StepPaymentProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string; price: number; [key: string]: any } | null>(null)

  useEffect(() => {
    if (formData.selectedCourseId) {
      getCourseById(formData.selectedCourseId).then(setSelectedCourse)
    } else {
      setSelectedCourse(null)
    }
  }, [formData.selectedCourseId])

  const isFree = !!selectedCourse && selectedCourse.price <= 0

  const handleFreeEnrollment = async () => {
    if (!selectedCourse || !user) return

    setIsProcessing(true)

    try {
      const paymentReference = `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Save to Firebase using the existing saveUserEnrollment function
      await saveUserEnrollment(
        user.uid,
        user.email || '',
        formData,
        paymentReference,
        0, // paymentAmount
        'free' // paymentMethod
      )

      if (onPaymentSuccess) {
        onPaymentSuccess()
      }
    } catch (error) {
      console.error('Free enrollment error:', error)
      const message = "We couldn't complete your enrollment. Please try again, or contact us if it keeps happening."
      setActionError(message)
      toast({ title: "Enrollment not completed", description: message, variant: "destructive" })
      setIsProcessing(false)
    }
  }

  const handlePaystackPayment = async () => {
    if (!selectedCourse || !user) return

    // Handle free courses
    if (selectedCourse.price <= 0) {
      return handleFreeEnrollment()
    }

    // Check if user has an email (required for Paystack)
    if (!user.email) {
      const message = "Your account needs an email address to pay with Paystack. Please sign in with an email account."
      setActionError(message)
      toast({ title: "Email required", description: message, variant: "destructive" })
      return
    }

    setIsProcessing(true)

    try {
      // Store course info for callback handling
      localStorage.setItem('selectedCourseId', selectedCourse.id)
      localStorage.setItem('selectedCourseTitle', selectedCourse.title)
      localStorage.setItem('registrationFormData', JSON.stringify(formData))

      // Initialize transaction server-side (the server sets the amount from the course record)
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: selectedCourse.price,
          courseId: selectedCourse.id,
          courseTitle: selectedCourse.title,
          userId: user.uid,
          userEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Payment initialization failed:', { status: response.status, data })
        throw new Error(data.error || data.message || 'Failed to initialize payment')
      }

      // Redirect to Paystack checkout
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      } else {
        throw new Error('No authorization URL received from Paystack')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      setIsProcessing(false)
      const message = "We couldn't start the payment. Please try again in a moment. You have not been charged."
      setActionError(message)
      toast({ title: "Payment not started", description: message, variant: "destructive" })
    }
  }

  const handleSubmit = () => {
    setActionError(null)
    if (!onValidate()) return
    void handlePaystackPayment()
  }

  const actionLabel = !selectedCourse
    ? "Submit application"
    : isFree
      ? "Enroll for free"
      : `Pay GH₵${selectedCourse.price.toLocaleString()} with Paystack`

  const summary = [
    { label: "Course", value: selectedCourse?.title || "—", step: 1 },
    { label: "Schedule", value: SCHEDULE_LABELS[formData.preferredSchedule] || formData.preferredSchedule, step: 1 },
    { label: "Name", value: `${formData.firstName} ${formData.lastName}`.trim(), step: 2 },
    { label: "Email", value: formData.email, step: 2 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Review and enroll</h2>
        <p className="mt-1 text-muted-foreground">Check your details, accept the terms and complete your enrollment.</p>
      </div>

      {/* Application summary */}
      <section aria-labelledby="summary-heading" className="rounded-xl border border-border">
        <h3 id="summary-heading" className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground sm:px-6">
          Your application
        </h3>
        <dl className="divide-y divide-border">
          {summary.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4 px-5 py-3 text-sm sm:px-6">
              <dt className="w-24 shrink-0 text-muted-foreground">{item.label}</dt>
              <dd className="min-w-0 flex-1 wrap-break-word font-medium text-foreground">{item.value}</dd>
              <dd className="shrink-0">
                <button
                  type="button"
                  onClick={() => onEditStep(item.step)}
                  className="rounded-sm text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  Edit<span className="sr-only"> {item.label.toLowerCase()}</span>
                </button>
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted px-5 py-4 sm:px-6">
          <span className="font-semibold text-foreground">{isFree ? "Fee" : "Total to pay"}</span>
          <span className="text-2xl font-bold text-foreground">
            {selectedCourse ? (isFree ? "Free" : `GH₵${selectedCourse.price.toLocaleString()}`) : "—"}
          </span>
        </div>
      </section>

      {/* Payment method: Paystack is the only supported method */}
      {!isFree && selectedCourse && (
        <div className="flex items-start gap-3 rounded-xl border border-border p-5 text-sm sm:p-6">
          <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">Paid securely with Paystack</p>
            <p className="mt-1 text-muted-foreground">
              You will be taken to Paystack to pay by card, then brought back here to confirm your enrollment.
            </p>
          </div>
        </div>
      )}

      {/* Developer-only payment notes: never rendered in production builds */}
      {IS_DEV_BUILD && process.env.NEXT_PUBLIC_MOCK_PAYSTACK === 'true' && (
        <Alert variant="info">
          <AlertTitle>Development mode</AlertTitle>
          <AlertDescription>Mock payments enabled. Paying will simulate a successful payment without contacting Paystack.</AlertDescription>
        </Alert>
      )}
      {IS_DEV_BUILD && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_test') && process.env.NEXT_PUBLIC_MOCK_PAYSTACK !== 'true' && (
        <Alert variant="warning">
          <AlertTitle>Test mode</AlertTitle>
          <AlertDescription>Test card: 4084084084084081 · any future expiry · CVV 408</AlertDescription>
        </Alert>
      )}

      {/* Terms, before the action */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateFormData({ agreeToTerms: checked === true })}
            aria-invalid={errors.agreeToTerms ? true : undefined}
            aria-describedby={errors.agreeToTerms ? "agreeToTerms-error" : undefined}
            className="mt-0.5"
          />
          <label htmlFor="agreeToTerms" className="cursor-pointer text-sm leading-relaxed text-foreground">
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">
              Privacy Policy
            </a>
            , including the refund policy, and understand that enrollment depends on course availability.
          </label>
        </div>
        {errors.agreeToTerms && (
          <p id="agreeToTerms-error" className="pl-7 text-sm text-destructive">
            {errors.agreeToTerms}
          </p>
        )}
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Enrollment not completed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        {/* While the course (and its fee) loads, the action shows a loading state instead of a silent disabled button */}
        <Button size="lg" onClick={handleSubmit} loading={isProcessing || !selectedCourse} className="sm:min-w-64">
          {!selectedCourse
            ? "Loading course…"
            : isProcessing
              ? isFree
                ? "Completing enrollment…"
                : "Redirecting to Paystack…"
              : actionLabel}
        </Button>
      </div>
    </div>
  )
}
