import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { courses } from "@/lib/data"
import type { RegistrationFormData } from "@/lib/types"

interface RegistrationSuccessProps {
  formData: RegistrationFormData
}

export function RegistrationSuccess({ formData }: RegistrationSuccessProps) {
  const selectedCourse = courses.find((c) => c.id === formData.selectedCourseId)

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
        <p className="text-muted-foreground">
          Thank you, {formData.firstName}! Your registration has been submitted successfully.
        </p>
      </div>

      {selectedCourse && (
        <div className="p-6 bg-secondary/50 rounded-lg border border-border text-left max-w-md mx-auto">
          <h4 className="font-semibold text-foreground mb-2">Course Enrolled:</h4>
          <p className="text-foreground">{selectedCourse.title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Duration: {selectedCourse.duration} • Level: {selectedCourse.level}
          </p>
        </div>
      )}

      <div className="space-y-4 max-w-md mx-auto">
        <p className="text-muted-foreground text-sm">
          We&apos;ve sent a confirmation email to <strong className="text-foreground">{formData.email}</strong> with
          details about your enrollment and next steps.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/courses">
              Browse More Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
