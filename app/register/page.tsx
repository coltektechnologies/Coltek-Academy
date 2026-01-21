"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProgressSteps } from "@/components/register/progress-steps"
import { StepPersonalInfo } from "@/components/register/step-personal-info"
import { StepEducation } from "@/components/register/step-education"
import { StepCourseSelection } from "@/components/register/step-course-selection"
import { StepPayment } from "@/components/register/step-payment"
import { RegistrationSuccess } from "@/components/register/registration-success"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { RegistrationFormData } from "@/lib/types"

const steps = ["Personal Info", "Education", "Course", "Payment"]

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
  preferredSchedule: "flexible",
  paymentMethod: "",
  agreeToTerms: false,
}

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const preselectedCourseId = searchParams.get("course") || ""

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RegistrationFormData>({
    ...initialFormData,
    selectedCourseId: preselectedCourseId,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "You must have an account to register for a course. Please log in or create an account.",
        variant: "destructive",
      })
      const courseParam = preselectedCourseId ? `?course=${preselectedCourseId}` : ''
      router.push(`/login?redirect=/register${courseParam}`)
      return
    }
  }, [user, loading, toast, router, preselectedCourseId])

  useEffect(() => {
    if (preselectedCourseId) {
      setFormData((prev) => ({ ...prev, selectedCourseId: preselectedCourseId }))
    }
  }, [preselectedCourseId])

  const updateFormData = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    // Clear errors for updated fields
    const clearedErrors = { ...errors }
    Object.keys(data).forEach((key) => delete clearedErrors[key])
    setErrors(clearedErrors)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address"
        }
        break
      case 2:
        if (!formData.highestEducation) newErrors.highestEducation = "Please select your education level"
        break
      case 3:
        if (!formData.selectedCourseId) newErrors.selectedCourseId = "Please select a course"
        if (!formData.learningGoals.trim()) newErrors.learningGoals = "Please describe your learning goals"
        break
      case 4:
        if (!formData.paymentMethod) newErrors.paymentMethod = "Please select a payment method"
        if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    // For Paystack payments, payment is handled separately
    if (formData.paymentMethod === "credit-card") {
      return
    }

    setIsSubmitting(true)

    // Simulate API call for other payment methods
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In production, this would call the API endpoint:
    // await fetch('/api/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })

    setIsSubmitting(false)
    setIsComplete(true)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonalInfo formData={formData} updateFormData={updateFormData} errors={errors} />
      case 2:
        return <StepEducation formData={formData} updateFormData={updateFormData} errors={errors} />
      case 3:
        return (
          <StepCourseSelection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            preselectedCourseId={preselectedCourseId}
          />
        )
      case 4:
        return <StepPayment formData={formData} updateFormData={updateFormData} errors={errors} onPaymentSuccess={() => setIsComplete(true)} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <RegistrationSuccess formData={formData} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Course Registration</h1>
            <p className="text-muted-foreground">Complete the form below to enroll in your chosen course.</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 md:p-8">
            <ProgressSteps currentStep={currentStep} steps={steps} />

            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="bg-transparent">
                Back
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>Continue</Button>
              ) : formData.paymentMethod !== "credit-card" ? (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
