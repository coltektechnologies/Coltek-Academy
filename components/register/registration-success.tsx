"use client"

import { useEffect, useRef, useState } from "react"
import { getCourseById } from "@/lib/courses"
import { useAuth } from "@/hooks/use-auth"
import { EnrollmentSuccess } from "@/components/register/enrollment-success"
import type { Course, RegistrationFormData } from "@/lib/types"

interface RegistrationSuccessProps {
  formData: RegistrationFormData
}

/** Confirmation after a free enrollment: sends the confirmation email (same API as before) and shows next steps. */
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

  return <EnrollmentSuccess courseTitle={selectedCourse?.title} emailStatus={emailStatus} email={user?.email} />
}
