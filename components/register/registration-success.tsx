"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCourseById } from "@/lib/courses"
import { useAuth } from "@/hooks/use-auth"
import type { Course, RegistrationFormData } from "@/lib/types"

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/CVTzw4zdtqVHjDV3IwC1zy"

interface RegistrationSuccessProps {
  formData: RegistrationFormData
}

export function RegistrationSuccess({ formData }: RegistrationSuccessProps) {
  const { user } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [emailStatus, setEmailStatus] = useState<"pending" | "sent" | "failed">("pending")
  const emailSentRef = useRef(false)

  useEffect(() => {
    if (formData.selectedCourseId) {
      getCourseById(formData.selectedCourseId).then((c) => setSelectedCourse(c))
    }
  }, [formData.selectedCourseId])

  // Send confirmation email with WhatsApp invite on successful registration
  useEffect(() => {
    if (emailSentRef.current || !user || !selectedCourse) return
    emailSentRef.current = true

    user
      .getIdToken()
      .then((token) =>
        fetch("/api/register/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            firstName: formData.firstName || "Student",
            courseTitle: selectedCourse.title,
          }),
        })
      )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        setEmailStatus(res.ok && data.success ? "sent" : "failed")
      })
      .catch((err) => {
        console.error("Failed to send confirmation email:", err)
        setEmailStatus("failed")
      })
  }, [user, formData.firstName, selectedCourse])

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

      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-4 max-w-md mx-auto text-left">
        <p className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Join the CADs WhatsApp Group
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Connect with fellow students and stay updated on course announcements.
        </p>
        <Button asChild className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
          <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer">
            Join WhatsApp Group
          </a>
        </Button>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {emailStatus === "sent" && (
          <p className="text-muted-foreground text-sm">
            We&apos;ve sent a confirmation email to <strong className="text-foreground">{user?.email}</strong> with
            details about your enrollment and an invitation to join our WhatsApp group.
          </p>
        )}
        {emailStatus === "failed" && (
          <p className="text-muted-foreground text-sm">
            Your enrollment is saved, but we couldn&apos;t send a confirmation email. Use the WhatsApp link above to
            join the student group.
          </p>
        )}

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
