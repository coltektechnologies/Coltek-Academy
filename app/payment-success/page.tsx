"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { saveUserEnrollment } from '@/lib/enrollment'
import { courses } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const reference = searchParams.get('reference')
      const trxref = searchParams.get('trxref')
      const isMockPayment = reference?.startsWith('MOCK-') || trxref?.startsWith('MOCK-')

      if (!reference && !trxref) {
        setError('Payment reference not found')
        setIsProcessing(false)
        return
      }

      const paymentRef = reference || trxref

      // For mock payments, require authentication
      if (isMockPayment) {
        if (!user) {
          setError('User not authenticated')
          setIsProcessing(false)
          return
        }
      } else {
        // For real payments, verify with Paystack first
        try {
          const verifyResponse = await fetch(`/api/paystack/verify?reference=${paymentRef}`)
          const verifyData = await verifyResponse.json()

          if (!verifyResponse.ok || !verifyData.status || verifyData.data.status !== 'success') {
            setError('Payment verification failed')
            setIsProcessing(false)
            return
          }
        } catch (verifyError) {
          console.error('Payment verification error:', verifyError)
          setError('Payment verification failed')
          setIsProcessing(false)
          return
        }
      }

      // At this point, payment is verified (or it's a mock payment with authenticated user)
      if (!user) {
        setError('User not authenticated. Please log in to complete your enrollment.')
        setIsProcessing(false)
        return
      }

      try {
        // Extract course info from localStorage
        const courseId = localStorage.getItem('selectedCourseId')
        const courseTitle = localStorage.getItem('selectedCourseTitle')
        const storedFormData = localStorage.getItem('registrationFormData')
        const formData = storedFormData ? JSON.parse(storedFormData) : {}

        if (!courseId) {
          throw new Error('Course ID not found in local storage')
        }

        // Get course details
        const selectedCourse = courses.find(course => course.id === courseId)
        if (!selectedCourse) {
          throw new Error('Course not found')
        }

        if (!paymentRef) {
          throw new Error('Payment reference not found')
        }

        // Save enrollment to Firebase
        await saveUserEnrollment(
          user.uid,
          user.email!,
          formData,
          paymentRef,
          selectedCourse.price,
          'paystack'
        )

        // Clear stored data
        localStorage.removeItem('selectedCourseId')
        localStorage.removeItem('selectedCourseTitle')
        localStorage.removeItem('registrationFormData')

        setIsProcessing(false)
      } catch (err) {
        console.error('Error saving enrollment:', err)
        setError('Payment was successful but enrollment could not be saved. Please contact support with reference: ' + paymentRef)
        setIsProcessing(false)
      }
    }

    handlePaymentSuccess()
  }, [user, searchParams])


  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing Payment
            </CardTitle>
            <CardDescription>
              Please wait while we confirm your payment and enroll you in the course.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/courses')}>
              Return to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
          <CardDescription>
            {searchParams.get('reference')?.startsWith('MOCK-') || searchParams.get('trxref')?.startsWith('MOCK-')
              ? "This was a test payment. In production, you would be charged."
              : "You have been successfully enrolled in your course. You can now access your course materials."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Payment Reference: {searchParams.get('reference') || searchParams.get('trxref')}
          </div>
          <div className="space-y-2">
            <Button onClick={() => router.push('/courses')} className="w-full">
              Browse More Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}